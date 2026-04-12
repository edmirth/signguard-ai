import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEGOTIATION_PROMPT = (
  clauseTitle: string,
  clauseText: string,
  clauseExplanation: string,
  clauseSuggestion: string | null,
  contractTitle: string,
  contractType: string,
) => `You are SignGuard AI, an expert contract negotiation attorney. A user needs a detailed negotiation toolkit for the following clause.

Contract: ${contractTitle} (${contractType})
Clause Title: ${clauseTitle}
Clause Text: ${clauseText}
Risk Analysis: ${clauseExplanation}
${clauseSuggestion ? `Suggested Revision: ${clauseSuggestion}` : ''}

Generate a comprehensive negotiation toolkit for this specific clause. Return ONLY valid JSON matching this exact structure:
{
  "verbal_script": "Word-for-word script the user can say in person or on the phone to negotiate this clause (2-4 sentences, confident but collaborative tone)",
  "email_template": "Complete email template they can send to request a change — include subject line, body, and signature placeholder. Use [YOUR NAME] placeholder.",
  "fallback_position": "If they cannot get the ideal change, what is the minimum acceptable compromise they should push for?",
  "leverage_points": ["Array of 2-4 specific leverage points or arguments they can use to justify requesting the change"],
  "walk_away_signal": "One clear signal that indicates this clause is a dealbreaker and they should walk away from the contract"
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Check pro plan
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  if (profile.plan !== 'pro') {
    return new Response(JSON.stringify({ error: 'Pro plan required', code: 'pro_required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Parse request body
  let clauseId: string;
  try {
    const body = await req.json();
    clauseId = body.clause_id;
    if (!clauseId) throw new Error('clause_id required');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Fetch clause + parent scan
  const { data: clause, error: clauseError } = await supabase
    .from('clauses')
    .select('*, scans(title, contract_type, user_id)')
    .eq('id', clauseId)
    .single();

  if (clauseError || !clause) {
    return new Response(JSON.stringify({ error: 'Clause not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Verify ownership
  const scan = clause.scans as { title: string; contract_type: string; user_id: string };
  if (scan.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  try {
    // Call Claude
    const prompt = NEGOTIATION_PROMPT(
      clause.title,
      clause.original_text,
      clause.explanation,
      clause.suggestion,
      scan.title,
      scan.contract_type,
    );

    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const rawText: string = claudeData.content[0].text;

    // Extract JSON
    let jsonText = rawText;
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonText = fenceMatch[1];
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }

    const result = JSON.parse(jsonText);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err) {
    console.error('generate-negotiation error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate negotiation script' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});
