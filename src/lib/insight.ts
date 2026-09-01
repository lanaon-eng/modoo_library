import type { ChatMessage, CharacterRole } from './chatScenario';

const ROLE_LABELS: Record<CharacterRole, string> = {
  protagonist: '주인공',
  villain: '악당/라이벌',
  helper: '조력자',
};

export function extractInsight(messages: ChatMessage[]): string {
  const userMessages = messages.filter((m) => m.role === 'user');
  if (userMessages.length === 0) return '';

  // Pick the longest user message as the most insightful
  const sorted = [...userMessages].sort(
    (a, b) => b.text.length - a.text.length
  );
  let insight = sorted[0].text;

  // Clean up: trim, limit to 60 chars with ellipsis
  if (insight.length > 80) {
    insight = insight.slice(0, 77) + '...';
  }

  return insight;
}

export function getRoleLabel(role: CharacterRole): string {
  return ROLE_LABELS[role];
}
