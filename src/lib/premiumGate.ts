export type PremiumGateCode = 'FAMILY_PLAN_REQUIRED' | 'FREE_RECIPE_LIMIT' | 'HOUSEHOLD_MEMBER_LIMIT';

function errorText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object') {
    const row=error as Record<string,unknown>;
    return [row.code,row.message,row.details,row.hint].filter(value=>typeof value==='string').join(' ');
  }
  return String(error);
}

export function classifyPremiumGateError(error: unknown): PremiumGateCode | null {
  const text=errorText(error).toUpperCase();
  if(text.includes('FAMILY_PLAN_REQUIRED'))return 'FAMILY_PLAN_REQUIRED';
  if(text.includes('FREE_RECIPE_LIMIT'))return 'FREE_RECIPE_LIMIT';
  if(text.includes('HOUSEHOLD_MEMBER_LIMIT'))return 'HOUSEHOLD_MEMBER_LIMIT';
  return null;
}

export function isInvalidInvitationError(error: unknown): boolean {
  const text=errorText(error).toLowerCase();
  return text.includes('invalid or expired invitation') || text.includes('invalid invitation') || text.includes('expired invitation');
}
