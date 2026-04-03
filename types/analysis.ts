export type ContractType =
  | 'lease'
  | 'employment'
  | 'loan'
  | 'insurance'
  | 'gym'
  | 'service'
  | 'nda'
  | 'other';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ClauseRiskLevel = 'safe' | 'caution' | 'danger';

export interface KeyTerms {
  duration: string | null;
  total_cost: string | null;
  cancellation: string | null;
  auto_renewal: string | null;
  deposit: string | null;
  penalties: string | null;
}

export interface ClauseAnalysis {
  title: string;
  section_ref: string | null;
  original_text: string;
  explanation: string;
  risk_level: ClauseRiskLevel;
  suggestion: string | null;
}

export interface ContractAnalysis {
  title: string;
  contract_type: ContractType;
  risk_score: number;
  risk_level: RiskLevel;
  summary: string;
  key_terms: KeyTerms;
  red_flags: string[];
  negotiation_tips: string[];
  clauses: ClauseAnalysis[];
}
