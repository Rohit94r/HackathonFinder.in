'use client';

import { useCurrency } from './CurrencyProvider';

/**
 * A prize or fee in the visitor's currency: exact in its own currency, converted and marked "≈"
 * otherwise (the original stays in the tooltip). `full` shows the exact amount with the converted
 * one beside it, for a hackathon's own page.
 */
export default function Money({ amount, currency, compact = false, full = false }: { amount: number; currency: string; compact?: boolean; full?: boolean }) {
  const { format, formatFull } = useCurrency();
  const text = full ? formatFull(amount, currency) : format(amount, currency, { compact });
  const converted = text.startsWith('≈') || text.includes('(≈');
  return <span title={converted ? `Stated as ${formatFull(amount, currency).split(' (≈')[0]}; converted at today’s rate` : undefined}>{text}</span>;
}
