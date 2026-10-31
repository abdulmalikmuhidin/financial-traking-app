import { Currency } from '../types';

export const SUPPORTED_CURRENCIES: Record<string, Currency> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rateToUSD: 1.0,
  },
  ETB: {
    code: 'ETB',
    symbol: 'ብር',
    name: 'Ethiopian Birr',
    rateToUSD: 125.0,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rateToUSD: 0.92,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rateToUSD: 0.79,
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    rateToUSD: 1.38,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    rateToUSD: 1.52,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    rateToUSD: 152.4,
  },
};

export interface FormatCurrencyOptions {
  showSymbol?: boolean;
  locale?: string;
  showPlus?: boolean;
}

/**
 * Returns the currently active application locale ('en' or 'am').
 * Persisted in localStorage and synchronized with <html lang="...">.
 */
export function getActiveLocale(): 'en' | 'am' {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('fintrack_lang');
      if (stored === 'am' || stored === 'en') return stored;
      const htmlLang = document.documentElement.lang;
      if (htmlLang === 'am' || htmlLang === 'en') return htmlLang;
    } catch {}
  }
  return 'en';
}

/**
 * Converts an amount from one currency to another using predefined conversion rates.
 */
export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string
): number {
  if (fromCode === toCode) return amount;
  
  const fromRate = SUPPORTED_CURRENCIES[fromCode]?.rateToUSD ?? 1.0;
  const toRate = SUPPORTED_CURRENCIES[toCode]?.rateToUSD ?? 1.0;

  // Convert to USD base first, then convert to target currency
  const inUSD = amount / fromRate;
  const inTarget = inUSD * toRate;

  return Math.round(inTarget * 100) / 100;
}

/**
 * Formats a monetary amount with currency symbol and tabular decimals
 * according to application locale and currency rules.
 *
 * English (USD): Symbol '$' before the amount, e.g. "$1,250.00"
 * Amharic (ETB): Symbol 'ብር' after the amount, e.g. "1,250.00 ብር"
 */
export function formatCurrency(
  amount: number,
  currencyCode?: string,
  optionsOrShowSymbol: boolean | FormatCurrencyOptions = true,
  localeArg?: string
): string {
  let showSymbol = true;
  let showPlus = false;
  let locale = localeArg;

  if (typeof optionsOrShowSymbol === 'boolean') {
    showSymbol = optionsOrShowSymbol;
  } else if (typeof optionsOrShowSymbol === 'object' && optionsOrShowSymbol !== null) {
    if (optionsOrShowSymbol.showSymbol !== undefined) showSymbol = optionsOrShowSymbol.showSymbol;
    if (optionsOrShowSymbol.showPlus !== undefined) showPlus = optionsOrShowSymbol.showPlus;
    if (optionsOrShowSymbol.locale) locale = optionsOrShowSymbol.locale;
  }

  const activeLocale = locale || getActiveLocale();
  const effectiveCurrencyCode = currencyCode || (activeLocale === 'am' ? 'ETB' : 'USD');
  const currency = SUPPORTED_CURRENCIES[effectiveCurrencyCode] || {
    code: effectiveCurrencyCode,
    symbol: effectiveCurrencyCode,
    name: effectiveCurrencyCode,
    rateToUSD: 1.0,
  };

  const isJpy = effectiveCurrencyCode === 'JPY';
  const absAmount = Math.abs(amount);

  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isJpy ? 0 : 2,
    maximumFractionDigits: isJpy ? 0 : 2,
  }).format(absAmount);

  const sign = amount < 0 ? '-' : (showPlus ? '+' : '');

  if (!showSymbol) {
    return `${sign}${formattedNum}`;
  }

  // Amharic locale with Ethiopian Birr: symbol placed AFTER the amount
  // e.g. "1,250.00 ብር", "-1,250.00 ብር", "+1,250.00 ብር"
  if (effectiveCurrencyCode === 'ETB') {
    if (activeLocale === 'am') {
      return `${sign}${formattedNum} ብር`;
    } else {
      // In English locale, display standard code prefix or symbol
      return `${sign}ETB ${formattedNum}`;
    }
  }

  // Western currencies (USD, EUR, GBP, CAD, AUD, JPY):
  // Symbol placed BEFORE the amount, e.g. "$1,250.00", "€1,250.00"
  return `${sign}${currency.symbol}${formattedNum}`;
}

/**
 * Formats a percentage nicely (e.g. 74.2%)
 */
export function formatPercentage(val: number): string {
  return `${val.toFixed(1)}%`;
}

const AMHARIC_MONTHS = [
  'ጃንዩ', 'ፌብሩ', 'ማርች', 'ኤፕሪ', 'ሜይ', 'ጁን',
  'ጁላይ', 'ኦገስ', 'ሴፕቴ', 'ጥቅም', 'ኖቬም', 'ዲሴም'
];

/**
 * Formats dates into human readable strings like "Oct 22, 2026" or "ጥቅም 22፣ 2026"
 */
export function formatDate(dateString: string, localeArg?: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    const date = new Date(year, month - 1, day);
    const activeLocale = localeArg || getActiveLocale();

    if (activeLocale === 'am') {
      const monthName = AMHARIC_MONTHS[month - 1] || `${month}ኛ ወር`;
      return `${monthName} ${day}፣ ${year}`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Return current month string in YYYY-MM format
 */
export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
