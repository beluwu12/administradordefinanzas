import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CurrencyCode, CURRENCIES } from '@/lib/mockData';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatAmount: (amount: number) => string;
  formatCompact: (amount: number) => string;
  getCurrencySymbol: () => string;
  currencies: typeof CURRENCIES;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('fincontrol-currency');
    return (saved as CurrencyCode) || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('fincontrol-currency', currency);
  }, [currency]);

  const formatAmount = useCallback((amount: number): string => {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' || currency === 'CLP' || currency === 'COP' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' || currency === 'CLP' || currency === 'COP' ? 0 : 2,
    };

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

    return new Intl.NumberFormat(localeMap[currency], options).format(amount);
  }, [currency]);

  const formatCompact = useCallback((amount: number): string => {
    const symbol = CURRENCIES[currency].symbol;
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (absAmount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}k`;
    }
    return `${symbol}${amount.toFixed(0)}`;
  }, [currency]);

  const getCurrencySymbol = useCallback((): string => {
    return CURRENCIES[currency].symbol;
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      formatAmount, 
      formatCompact,
      getCurrencySymbol,
      currencies: CURRENCIES 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
