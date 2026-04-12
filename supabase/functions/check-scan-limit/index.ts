import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SCAN_LIMIT_FREE = 2;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  try {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

  // Fetch user profile
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

  const isPro = profile.plan === 'pro';
  let scansUsed: number = profile.scans_used;
  let resetsAt: string = profile.scans_reset_at;

  // Handle monthly reset: if scans_reset_at <= now(), reset count before responding
  const scansResetAt = new Date(profile.scans_reset_at);
  if (scansResetAt <= new Date()) {
    const nextReset = getNextMonthStart();
    await supabase
      .from('profiles')
      .update({ scans_used: 0, scans_reset_at: nextReset })
      .eq('id', user.id);
    scansUsed = 0;
    resetsAt = nextReset;
  }

  const scansLimit = isPro ? null : (profile.scans_limit ?? SCAN_LIMIT_FREE);
  const canScan = isPro || scansUsed < (scansLimit ?? SCAN_LIMIT_FREE);

  return new Response(
    JSON.stringify({
      plan: profile.plan,
      scans_used: scansUsed,
      scans_limit: scansLimit,
      can_scan: canScan,
      resets_at: resetsAt,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    }
  );
  } catch (error) {
    console.error('check-scan-limit error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});

function getNextMonthStart(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString();
}
