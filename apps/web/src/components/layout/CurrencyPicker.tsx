'use client';

import { useCurrency } from '@/components/CurrencyProvider';
import { CURRENCIES } from '@/lib/currency';

/** Footer control: show amounts in a currency of your choice instead of the one for your country. */
export default function CurrencyPicker() {
  const { choice, detected, setChoice } = useCurrency();
  return (
    <label className="flex items-center gap-2">
      <span className="font-mono uppercase tracking-[0.14em]">Currency</span>
      <select
        value={choice ?? ''}
        onChange={(e) => setChoice(e.target.value || null)}
        className="h-8 rounded-md border border-line bg-card px-2 text-xs text-ink transition-colors hover:border-board focus:border-board focus:outline-none"
      >
        <option value="">Automatic{detected ? ` (${detected})` : ''}</option>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
