/**
 * Country Configuration for Frontend
 * Mirrors server/config/countries.js
 */

export interface CountryConfig {
    name: string;
    flag: string;
    currencies: string[];
    defaultCurrency: string;
    locale: string;
    timezone: string;
    features: {
        dualCurrency: boolean;
        exchangeRate: boolean;
    };
}

export const COUNTRIES: Record<string, CountryConfig> = {
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
        },
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
        },
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
        },
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
        },
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
        },
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
        },
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
        },
    },
};

/**
 * Get country config by code
 */
export const getCountryConfig = (countryCode: string): CountryConfig => {
    return COUNTRIES[countryCode] || COUNTRIES.VE;
};

/**
 * Check if country supports dual currency
 */
export const isDualCurrency = (countryCode: string): boolean => {
    return getCountryConfig(countryCode).features.dualCurrency;
};

/**
 * Check if country uses USD (can enable dual currency toggle)
 */
export const canEnableDualCurrency = (countryCode: string): boolean => {
    return getCountryConfig(countryCode).defaultCurrency === 'USD';
};

/**
 * Get country options for select dropdowns
 */
export const getCountryOptions = () => {
    return Object.entries(COUNTRIES).map(([code, config]) => ({
        value: code,
        label: `${config.flag} ${config.name}`,
        flag: config.flag,
        name: config.name,
    }));
};

export default COUNTRIES;
