/**
 * Country Configuration
 * Centralized multi-region settings for currencies, timezones, and features
 */

const COUNTRIES = {
    VE: {
        name: 'Venezuela',
        flag: '🇻🇪',
        currencies: ['USD', 'VES'],
        defaultCurrency: 'USD',
        locale: 'es-VE',
        timezone: 'America/Caracas',
        features: {
            dualCurrency: true,
            exchangeRate: true,
            bcvScraper: true
        }
    },
    EC: {
        name: 'Ecuador',
        flag: '🇪🇨',
        currencies: ['USD'],
        defaultCurrency: 'USD',
        locale: 'es-EC',
        timezone: 'America/Guayaquil',
        features: {
            dualCurrency: false,
            exchangeRate: false,
            bcvScraper: false
        }
    },
    CO: {
        name: 'Colombia',
        flag: '🇨🇴',
        currencies: ['COP'],
        defaultCurrency: 'COP',
        locale: 'es-CO',
        timezone: 'America/Bogota',
        features: {
            dualCurrency: false,
            exchangeRate: false,
            bcvScraper: false
        }
    },
    CL: {
        name: 'Chile',
        flag: '🇨🇱',
        currencies: ['CLP'],
        defaultCurrency: 'CLP',
        locale: 'es-CL',
        timezone: 'America/Santiago',
        features: {
            dualCurrency: false,
            exchangeRate: false,
            bcvScraper: false
        }
    },
    MX: {
        name: 'México',
        flag: '🇲🇽',
        currencies: ['MXN'],
        defaultCurrency: 'MXN',
        locale: 'es-MX',
        timezone: 'America/Mexico_City',
        features: {
            dualCurrency: false,
            exchangeRate: false,
            bcvScraper: false
        }
    },
    AR: {
        name: 'Argentina',
        flag: '🇦🇷',
        currencies: ['ARS'],
        defaultCurrency: 'ARS',
        locale: 'es-AR',
        timezone: 'America/Buenos_Aires',
        features: {
            dualCurrency: false,
            exchangeRate: false,
            bcvScraper: false
        }
    },
    US: {
        name: 'Estados Unidos',
        flag: '🇺🇸',
        currencies: ['USD'],
        defaultCurrency: 'USD',
        locale: 'en-US',
        timezone: 'America/New_York',
        features: {
            dualCurrency: false,
            exchangeRate: false,
            bcvScraper: false
        }
    }
};

/**
 * Get country config by code
 * @param {string} countryCode - 'VE', 'CO', etc.
 */
const getCountryConfig = (countryCode) => {
    return COUNTRIES[countryCode] || COUNTRIES.VE;
};

/**
 * Check if a currency is allowed for a country
 * @param {string} countryCode 
 * @param {string} currency 
 */
const isCurrencyAllowed = (countryCode, currency) => {
    const config = getCountryConfig(countryCode);
    return config.currencies.includes(currency);
};

/**
 * Get default currency for a country
 * @param {string} countryCode 
 */
const getDefaultCurrency = (countryCode) => {
    return getCountryConfig(countryCode).defaultCurrency;
};

/**
 * Get default timezone for a country
 * @param {string} countryCode 
 */
const getDefaultTimezone = (countryCode) => {
    return getCountryConfig(countryCode).timezone;
};

/**
 * Check if country has dual currency support
 * @param {string} countryCode 
 */
const isDualCurrency = (countryCode) => {
    return getCountryConfig(countryCode).features.dualCurrency;
};

module.exports = {
    COUNTRIES,
    getCountryConfig,
    isCurrencyAllowed,
    getDefaultCurrency,
    getDefaultTimezone,
    isDualCurrency
};
