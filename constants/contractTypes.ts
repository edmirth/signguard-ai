export type ContractTypeKey =
  | 'lease'
  | 'employment'
  | 'loan'
  | 'insurance'
  | 'gym'
  | 'service'
  | 'nda'
  | 'purchase'
  | 'other';

export interface ContractTypeConfig {
  emoji: string;
  label: string;
  color: string;
}

export const CONTRACT_TYPES: Record<ContractTypeKey, ContractTypeConfig> = {
  lease: {
    emoji: '🏠',
    label: 'Lease Agreement',
    color: '#5c8fff',
  },
  employment: {
    emoji: '💼',
    label: 'Employment Contract',
    color: '#7c5cff',
  },
  loan: {
    emoji: '💰',
    label: 'Loan Agreement',
    color: '#ffb340',
  },
  insurance: {
    emoji: '🛡️',
    label: 'Insurance Policy',
    color: '#00e5a0',
  },
  gym: {
    emoji: '🏋️',
    label: 'Gym Membership',
    color: '#ff8c40',
  },
  service: {
    emoji: '🤝',
    label: 'Service Agreement',
    color: '#5ce4ff',
  },
  nda: {
    emoji: '🔒',
    label: 'Non-Disclosure Agreement',
    color: '#b45cff',
  },
  purchase: {
    emoji: '🛒',
    label: 'Purchase Agreement',
    color: '#ffd700',
  },
  other: {
    emoji: '📄',
    label: 'Contract',
    color: '#8888aa',
  },
};
