export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro';
  scans_used: number;
  scans_limit: number;
  scans_reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  title: string;
  contract_type: string;
  status: 'processing' | 'complete' | 'failed';
  risk_score: number | null;
  risk_level: string | null;
  summary: string | null;
  red_flags: string[] | null;
  negotiation_tips: string[] | null;
  key_terms: Record<string, string> | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  clauses?: Clause[];
}

export interface Clause {
  id: string;
  scan_id: string;
  title: string;
  section_ref: string | null;
  original_text: string;
  explanation: string;
  risk_level: 'safe' | 'caution' | 'danger';
  suggestion: string | null;
  created_at: string;
}
