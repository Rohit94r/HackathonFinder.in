'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CURRENCY_KEY,
  convert,
  countryFromLanguages,
  currencyForCountry,
  formatCurrency,
  roundNice,
  type Rates,
} from '@/lib/currency';

interface FormatOptions {
  compact?: boolean;
  /** Two significant figures (filter thresholds). */
  round?: boolean;
  /** Prefix converted amounts with "≈" (default true). */
  approx?: boolean;
}

interface CurrencyContext {
  /** The visitor's currency once known (their choice, else detected); null until then. */
  currency: string | null;
  /** The detected one, shown as "Automatic" in the picker. */
  detected: string | null;
  /** Their own choice, or null for automatic. */
  choice: string | null;
  setChoice: (currency: string | null) => void;
  /** An amount for display: unchanged in its own currency, converted (marked ≈) otherwise. */
  format: (amount: number, from: string, options?: FormatOptions) => string;
  /** Exact amount, plus " (≈ converted)" when the visitor's currency differs. For a hackathon's own page. */
  formatFull: (amount: number, from: string) => string;
}

const Ctx = createContext<CurrencyContext | null>(null);

/**
 * Works out the visitor's currency (their choice in the footer, else their country) and today's
 * rates, once per visit. Until that's known, amounts render in their own currency, exactly as the
 * server did, so the first paint and hydration match.
 */
export default function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<Rates | null>(null);
  const [detected, setDetected] = useState<string | null>(null);
  const [choice, setChoiceState] = useState<string | null>(null);

  useEffect(() => {
    try {
      setChoiceState(localStorage.getItem(CURRENCY_KEY));
    } catch {
      // Storage can be unavailable (private mode); the choice then isn't remembered.
    }
    let cancelled = false;
    fetch('/api/locale')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { country: string | null; rates: Rates | null } | null) => {
        if (cancelled || !data) return;
        const country = data.country ?? countryFromLanguages(navigator.languages ?? [navigator.language]);
        setRates(data.rates);
        setDetected(currencyForCountry(country, data.rates));
      })
      .catch(() => {
        // Without rates, amounts simply stay in their own currency.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setChoice = useCallback((next: string | null) => {
    setChoiceState(next);
    try {
      if (next) localStorage.setItem(CURRENCY_KEY, next);
      else localStorage.removeItem(CURRENCY_KEY);
    } catch {
      // Not remembered, but applied for this visit.
    }
  }, []);

  const currency = (choice && (!rates || rates[choice]) ? choice : null) ?? detected;

  const format = useCallback(
    (amount: number, from: string, { compact = false, round = false, approx = true }: FormatOptions = {}) => {
      if (!currency || currency === from || !rates) return formatCurrency(round ? roundNice(amount) : amount, from, { compact });
      const value = convert(amount, from, currency, rates);
      if (value === null) return formatCurrency(amount, from, { compact });
      return `${approx ? '≈ ' : ''}${formatCurrency(round ? roundNice(value) : value, currency, { compact })}`;
    },
    [currency, rates]
  );

  const formatFull = useCallback(
    (amount: number, from: string) => {
      const exact = formatCurrency(amount, from);
      if (!currency || currency === from || !rates) return exact;
      const value = convert(amount, from, currency, rates);
      return value === null ? exact : `${exact} (≈ ${formatCurrency(value, currency, { compact: true })})`;
    },
    [currency, rates]
  );

  const value = useMemo(() => ({ currency, detected, choice, setChoice, format, formatFull }), [currency, detected, choice, setChoice, format, formatFull]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrency(): CurrencyContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
