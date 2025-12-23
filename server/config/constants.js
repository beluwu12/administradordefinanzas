/**
 * Application Constants
 * Centralizes all magic numbers and configuration values
 * 
 * KISS Principle: One source of truth for configurable values
 */

// ═══════════════════════════════════════════════════════════════
// PAGINATION
// ═══════════════════════════════════════════════════════════════
const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    MIN_PAGE_SIZE: 1
};

// ═══════════════════════════════════════════════════════════════
// GOALS
// ═══════════════════════════════════════════════════════════════
const GOALS = {
    MAX_DURATION_MONTHS: 120,  // 10 years maximum
    MIN_DURATION_MONTHS: 1
};

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════
const AUTH = {
    TOKEN_EXPIRY: '30d',
    BCRYPT_SALT_ROUNDS: 10,
    PIN_LENGTH: 4
};

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════
const RATE_LIMITS = {
    AUTH_WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
    AUTH_MAX_REQUESTS: 50,
    GENERAL_WINDOW_MS: 60 * 1000,    // 1 minute
    GENERAL_MAX_REQUESTS: 100
};

// ═══════════════════════════════════════════════════════════════
// TIMEOUTS
// ═══════════════════════════════════════════════════════════════
const TIMEOUTS = {
    API_REQUEST_MS: 15000,
    EXTERNAL_API_MS: 10000
};

// ═══════════════════════════════════════════════════════════════
// VALIDATION LIMITS
// ═══════════════════════════════════════════════════════════════
const VALIDATION = {
    NAME_MAX_LENGTH: 50,
    DESCRIPTION_MAX_LENGTH: 200,
    GOAL_DESCRIPTION_MAX_LENGTH: 500,
    TAG_NAME_MAX_LENGTH: 50,
    SEARCH_MAX_LENGTH: 100,
    PASSWORD_MIN_LENGTH: 6
};

// ═══════════════════════════════════════════════════════════════
// CURRENCIES
// ═══════════════════════════════════════════════════════════════
const CURRENCIES = {
    SUPPORTED: ['USD', 'VES', 'COP', 'CLP', 'MXN', 'ARS'],
    DEFAULT: 'USD'
};

// ═══════════════════════════════════════════════════════════════
// COUNTRIES
// ═══════════════════════════════════════════════════════════════
const COUNTRIES = {
    SUPPORTED: ['VE', 'CO', 'CL', 'MX', 'AR', 'US'],
    DEFAULT: 'VE',
    DUAL_CURRENCY: ['VE']  // Countries that support dual currency
};

module.exports = {
    PAGINATION,
    GOALS,
    AUTH,
    RATE_LIMITS,
    TIMEOUTS,
    VALIDATION,
    CURRENCIES,
    COUNTRIES
};
