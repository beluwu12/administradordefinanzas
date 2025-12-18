// Locale mapping for Intl.NumberFormat
const CURRENCY_LOCALES = {
    USD: 'en-US',
    VES: 'es-VE',
    COP: 'es-CO',
    CLP: 'es-CL',
    MXN: 'es-MX',
    ARS: 'es-AR'
};

/**
 * Format currency using Intl.NumberFormat
 * Handles locale-specific formatting (e.g., CLP has no decimals)
 */
export const formatCurrency = (amount, currency = 'USD') => {
    const absAmount = Math.abs(amount || 0);
    const locale = CURRENCY_LOCALES[currency] || 'en-US';

    // CLP typically doesn't use decimal places
    const noDecimalCurrencies = ['CLP'];
    const fractionDigits = noDecimalCurrencies.includes(currency) ? 0 : 2;

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits
        }).format(absAmount);
    } catch (e) {
        // Fallback for unsupported currencies
        return `${currency} ${absAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('es-VE', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
};
