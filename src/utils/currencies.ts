import { Currency } from '../types';

export const SUPPORTED_CURRENCIES: Record<string, Currency> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rateToUSD: 1.0,
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

/**
 * Converts an amount from one currency to another using the predefined conversion rates.
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
 * Formats a monetary amount with currency symbol and tabular decimals.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  showSymbol: boolean = true
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const isJpy = currencyCode === 'JPY';
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isJpy ? 0 : 2,
    maximumFractionDigits: isJpy ? 0 : 2,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';

  if (!showSymbol) {
    return `${sign}${formatted}`;
  }

  return `${sign}${currency.symbol}${formatted}`;
}

/**
 * Formats a percentage nicely (e.g. 74.2%)
 */
export function formatPercentage(val: number): string {
  return `${val.toFixed(1)}%`;
}

/**
 * Formats dates into human readable strings like "Oct 22, 2026"
 */
export function formatDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    const date = new Date(year, month - 1, day);
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
