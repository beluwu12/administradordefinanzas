/**
 * Country Configuration (Frontend)
 * Centralized multi-region settings for UI rendering
 */

export const COUNTRIES = {
    VE: {
        name: 'Venezuela',
        flag: '🇻🇪',
        currencies: ['USD', 'VES'],
        defaultCurrency: 'USD',
        locale: 'es-VE',
        features: {
            dualCurrency: true,
            exchangeRate: true,
            showBCVCard: true
        }
    },
    CO: {
        name: 'Colombia',
        flag: '🇨🇴',
        currencies: ['COP'],
        defaultCurrency: 'COP',
        locale: 'es-CO',
        features: {
            dualCurrency: false,
            exchangeRate: false,
            showBCVCard: false
        }
    },
    CL: {
        name: 'Chile',
        flag: '🇨🇱',
        currencies: ['CLP'],
        defaultCurrency: 'CLP',
        locale: 'es-CL',
        features: {
            dualCurrency: false,
            exchangeRate: false,
            showBCVCard: false
        }
    },
    MX: {
        name: 'México',
        flag: '🇲🇽',
        currencies: ['MXN'],
        defaultCurrency: 'MXN',
        locale: 'es-MX',
        features: {
            dualCurrency: false,
            exchangeRate: false,
            showBCVCard: false
        }
    },
    AR: {
        name: 'Argentina',
        flag: '🇦🇷',
        currencies: ['ARS'],
        defaultCurrency: 'ARS',
        locale: 'es-AR',
        features: {
            dualCurrency: false,
            exchangeRate: false,
            showBCVCard: false
        }
    },
    US: {
        name: 'Estados Unidos',
        flag: '🇺🇸',
        currencies: ['USD'],
        defaultCurrency: 'USD',
        locale: 'en-US',
        features: {
            dualCurrency: false,
            exchangeRate: false,
            showBCVCard: false
        }
    }
};

/**
 * Get country config by code
 */
export const getCountryConfig = (countryCode) => {
    return COUNTRIES[countryCode] || COUNTRIES.VE;
};

/**
 * Check if country has dual currency support
 */
export const isDualCurrency = (countryCode) => {
    return getCountryConfig(countryCode).features.dualCurrency;
};

/**
 * Get list of countries for select dropdown
 */
export const getCountryOptions = () => {
    return Object.entries(COUNTRIES).map(([code, config]) => ({
        value: code,
        label: `${config.flag} ${config.name}`
    }));
};
