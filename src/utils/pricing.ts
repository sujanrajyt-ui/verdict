import { FeeCategory, PricingRule, Committee } from '../types';

/**
 * Resolves participant category based on branch name
 * Standardizes ISE vs NON_ISE
 */
export function resolveParticipantCategory(branchName: string): FeeCategory {
  if (!branchName) return 'NON_ISE';
  const clean = branchName.trim().toLowerCase();

  const isIse = 
    clean.includes('information science') ||
    clean.includes('ise') ||
    clean.includes('is&e') ||
    clean === 'is' ||
    clean.startsWith('is-') ||
    clean.includes('info science');

  return isIse ? 'ISE' : 'NON_ISE';
}

/**
 * Calculates the exact fee for a committee and branch
 * Looks up active pricing rules first, then falls back to committee baseline fee if specified
 */
export function calculatePayableFee(
  committee: Committee,
  pricingRules: PricingRule[],
  branch: string
): {
  amount: number;
  category: FeeCategory;
  categoryLabel: string;
  ruleId?: string;
  isAvailable: boolean;
} {
  const category = resolveParticipantCategory(branch);
  const matchingRule = pricingRules.find(
    (r) => r.committee_id === committee.id && r.category === category && r.is_active
  );

  const categoryLabel = category === 'ISE' ? 'ISE Student Fee' : 'Standard Delegate Fee';

  if (matchingRule) {
    return {
      amount: matchingRule.amount,
      category,
      categoryLabel,
      ruleId: matchingRule.id,
      isAvailable: true,
    };
  }

  // If no category-specific rule, check committee fallback
  if (committee.registration_fee !== undefined && committee.registration_fee >= 0) {
    return {
      amount: committee.registration_fee,
      category,
      categoryLabel,
      ruleId: undefined,
      isAvailable: true,
    };
  }

  return {
    amount: 0,
    category,
    categoryLabel,
    ruleId: undefined,
    isAvailable: false,
  };
}

/**
 * Formats Indian Currency (INR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
