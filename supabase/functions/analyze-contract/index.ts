import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANALYSIS_PROMPT = `You are SignGuard AI, an expert contract attorney and risk analyst. Analyze the contract image provided and return a comprehensive risk assessment in JSON format.

Analyze every clause carefully. Look for:
- Automatic renewal traps
- Unilateral modification rights
- Unfair termination clauses
- Hidden fees and penalties
- Liability waivers
- Arbitration clauses that limit legal recourse
- Data sharing provisions
- Non-compete or non-solicitation clauses
- Jurisdiction and governing law issues

Return ONLY valid JSON (no markdown, no explanation) matching this exact structure:
{
  "title": "string — descriptive title of this contract (e.g. '12-Month Apartment Lease Agreement')",
  "contract_type": "one of: lease | employment | loan | insurance | gym | service | nda | purchase | other",
  "risk_score": number between 0-100 (0=very safe, 100=extremely risky),
  "risk_level": "one of: low | medium | high | critical",
  "summary": "2-3 sentence plain-English summary of what this contract is and the overall risk",
  "key_terms": {
    "duration": "contract length or null",
    "total_cost": "total financial commitment or null",
    "cancellation": "cancellation policy summary or null",
    "auto_renewal": "auto-renewal terms or null",
    "deposit": "deposit/collateral required or null",
    "penalties": "key penalties or null"
  },
  "red_flags": ["array of specific red flag strings — only include genuine concerns"],
  "negotiation_tips": ["array of 3-5 actionable negotiation tips specific to this contract"],
  "clauses": [
    {
      "title": "Short clause title",
      "section_ref": "Section/Article reference or null",
      "original_text": "Exact or paraphrased text from the contract",
      "explanation": "Plain-English explanation of what this clause means for the signer",
      "risk_level": "safe | caution | danger",
      "suggestion": "Specific suggested revision or negotiation approach, or null if safe"
    }
  ]
}

Risk score guide:
- 80-100: Critical — multiple highly dangerous clauses
- 60-79: High — significant risks that need attention
- 40-59: Medium — some concerning clauses, negotiable
- 0-39: Low — generally fair contract

Include ALL significant clauses (aim for 5-15 clauses). Sort clauses by risk_level: danger first, then caution, then safe.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

  // Initialize Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Authenticate user via Bearer token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Parse request body
  let imageBase64: string;
  let mimeType: string = 'image/jpeg';

  try {
    const body = await req.json();
    imageBase64 = body.image_base64;
    if (body.mime_type) mimeType = body.mime_type;
    if (!imageBase64) throw new Error('Missing image_base64');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Fetch user profile (use service key to bypass RLS)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Check scan limit for free users (belt + suspenders: also handle monthly reset)
  let scansUsed = profile.scans_used;
  const scansResetAt = new Date(profile.scans_reset_at);

  if (scansResetAt <= new Date()) {
    // Reset the count
    await supabase
      .from('profiles')
      .update({ scans_used: 0, scans_reset_at: getNextMonthStart() })
      .eq('id', user.id);
    scansUsed = 0;
  }

  if (profile.plan === 'free' && scansUsed >= profile.scans_limit) {
    return new Response(
      JSON.stringify({
        error: 'Scan limit reached',
        error_code: 'scan_limit_reached',
        scans_used: scansUsed,
        scans_limit: profile.scans_limit,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }

  // Optimistically increment scans_used before calling Claude to close the TOCTOU race window.
  // If analysis fails, we decrement it in the catch block.
  if (profile.plan === 'free') {
    await supabase
      .from('profiles')
      .update({ scans_used: scansUsed + 1 })
      .eq('id', user.id);
  }

  // Create scan record with status: 'processing'
  const { data: scan, error: scanCreateError } = await supabase
    .from('scans')
    .insert({
      user_id: user.id,
      title: 'Analyzing contract...',
      contract_type: 'other',
      status: 'processing',
    })
    .select()
    .single();

  if (scanCreateError || !scan) {
    // Roll back the optimistic increment
    if (profile.plan === 'free') {
      await supabase
        .from('profiles')
        .update({ scans_used: scansUsed })
        .eq('id', user.id);
    }
    return new Response(JSON.stringify({ error: 'Failed to create scan record' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const scanId = scan.id;

  // Build the content block — images use type:'image', PDFs use type:'document'
  const isPdf = mimeType === 'application/pdf';
  const fileContentBlock = isPdf
    ? {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: imageBase64,
        },
      }
    : {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: imageBase64,
        },
      };

  try {
    // Call Claude Vision API
    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              fileContentBlock,
              {
                type: 'text',
                text: ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error('Claude API error:', errText);
      throw new Error(`Claude API returned ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const rawContent: string = claudeData.content[0].text;

    // Extract JSON from Claude response (handles markdown code block wrapping)
    let analysisJson: string = rawContent.trim();
    const jsonBlockMatch = analysisJson.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      analysisJson = jsonBlockMatch[1].trim();
    }

    // Find the first { and last } in case there's extra text
    const firstBrace = analysisJson.indexOf('{');
    const lastBrace = analysisJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      analysisJson = analysisJson.slice(firstBrace, lastBrace + 1);
    }

    const analysis = JSON.parse(analysisJson);

    // Update scan record to status: 'complete'
    const { data: updatedScan, error: updateError } = await supabase
      .from('scans')
      .update({
        title: analysis.title,
        contract_type: analysis.contract_type,
        status: 'complete',
        risk_score: analysis.risk_score,
        risk_level: analysis.risk_level,
        summary: analysis.summary,
        key_terms: analysis.key_terms,
        red_flags: analysis.red_flags,
        negotiation_tips: analysis.negotiation_tips,
      })
      .eq('id', scanId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update scan:', updateError);
      throw new Error('Failed to update scan record');
    }

    // Insert all clauses
    const clauseRows = analysis.clauses.map((clause: {
      title: string;
      section_ref: string | null;
      original_text: string;
      explanation: string;
      risk_level: string;
      suggestion: string | null;
    }) => ({
      scan_id: scanId,
      title: clause.title,
      section_ref: clause.section_ref ?? null,
      original_text: clause.original_text,
      explanation: clause.explanation,
      risk_level: clause.risk_level,
      suggestion: clause.suggestion ?? null,
    }));

    const { data: clauses, error: clauseError } = await supabase
      .from('clauses')
      .insert(clauseRows)
      .select();

    if (clauseError) {
      console.error('Failed to insert clauses:', clauseError);
      throw new Error('Failed to insert clauses');
    }

    // Return full scan object with nested clauses
    const result = { ...updatedScan, clauses: clauses ?? [] };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    console.error('Analysis error:', error);

    // Update scan to status: 'failed'
    await supabase
      .from('scans')
      .update({ status: 'failed' })
      .eq('id', scanId);

    // Roll back the optimistic increment so the user doesn't lose a scan on failure
    if (profile.plan === 'free') {
      await supabase
        .from('profiles')
        .update({ scans_used: scansUsed })
        .eq('id', user.id);
    }

    return new Response(
      JSON.stringify({ error: 'Analysis failed', scan_id: scanId }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
});

function getNextMonthStart(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString();
}
