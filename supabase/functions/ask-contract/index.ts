import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
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

  // Parse body
  let scanId: string;
  let question: string;
  try {
    const body = await req.json();
    scanId = body.scan_id;
    question = body.question?.trim();
    if (!scanId || !question) throw new Error('Missing fields');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Fetch scan + clauses, verify ownership
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .select('*, clauses(*)')
    .eq('id', scanId)
    .eq('user_id', user.id)
    .single();

  if (scanError || !scan) {
    return new Response(JSON.stringify({ error: 'Scan not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Build contract context
  const clauses = (scan.clauses ?? []) as Array<{
    title: string;
    section_ref: string | null;
    original_text: string;
    explanation: string;
    risk_level: string;
    suggestion: string | null;
  }>;

  const clauseContext = clauses.map((c) =>
    `[${c.risk_level.toUpperCase()}] ${c.title}${c.section_ref ? ` (${c.section_ref})` : ''}
Original text: ${c.original_text}
What it means: ${c.explanation}${c.suggestion ? `\nSuggested revision: ${c.suggestion}` : ''}`
  ).join('\n\n---\n\n');

  const keyTermsContext = scan.key_terms
    ? Object.entries(scan.key_terms as Record<string, string>)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    : '';

  const redFlagsContext = (scan.red_flags as string[] ?? []).join('\n') || 'None identified';

  const systemPrompt = `You are SignGuard AI, an expert contract attorney. You have already analyzed the following contract and are answering follow-up questions about it.

CONTRACT:
Title: ${scan.title}
Type: ${scan.contract_type}
Risk Score: ${scan.risk_score}/100 (${scan.risk_level} risk)
Summary: ${scan.summary ?? 'Not available'}

KEY TERMS:
${keyTermsContext || 'None extracted'}

RED FLAGS:
${redFlagsContext}

CLAUSES (${clauses.length} total):
${clauseContext || 'No clauses extracted'}

Rules:
- Answer based on the contract data above. If the answer isn't in the data, say so clearly.
- Be concise and plain-English. No legal jargon.
- Give concrete, actionable answers — not vague guidance.
- Do not claim to provide legal advice; provide contract interpretation.`;

  try {
    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error('Claude API error:', errText);
      throw new Error(`Claude API returned ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const answer: string = claudeData.content[0].text;

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    console.error('Ask contract error:', error);
    return new Response(JSON.stringify({ error: 'Failed to answer question' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});
