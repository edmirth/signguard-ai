import { colors } from '@/constants/theme';

export function formatRelativeDate(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return then.toLocaleDateString();
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'safe':
      return colors.safe;
    case 'caution':
      return colors.caution;
    case 'danger':
      return colors.danger;
    default:
      return colors.textMuted;
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return colors.safe;
  if (score >= 60) return colors.caution;
  if (score >= 40) return colors.cautionAlt;
  return colors.danger;
}
