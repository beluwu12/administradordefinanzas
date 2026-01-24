import { formatDistanceToNow } from 'date-fns';
import { CURRENCIES, CurrencyCode } from './mockData';

export const formatCurrency = (amount: number, currencyCode: CurrencyCode = 'USD'): string => {
  const currency = CURRENCIES[currencyCode];

  // Handle currencies with different formatting
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'JPY' || currencyCode === 'CLP' || currencyCode === 'COP' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'JPY' || currencyCode === 'CLP' || currencyCode === 'COP' ? 0 : 2,
  };

  // Use locale based on currency
  const localeMap: Record<CurrencyCode, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    CLP: 'es-CL',
    ARS: 'es-AR',
    COP: 'es-CO',
    VES: 'es-VE',
  };

  return new Intl.NumberFormat(localeMap[currencyCode], options).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
};

export const formatShortDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
};

export const formatPercentage = (value: number | undefined | null): string => {
  const safeValue = value ?? 0;
  return `${safeValue >= 0 ? '+' : ''}${safeValue.toFixed(1)}%`;
};

export const formatRelativeDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};
