/**
 * Frontend Component Tests
 * Using Vitest + React Testing Library patterns
 * 
 * To run: npm run test (requires vitest setup)
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../src/utils/formatters';
import { isDualCurrency, getCountryConfig, getCountryOptions, COUNTRIES } from '../src/config/countries';

// ═══════════════════════════════════════════════════════════════
// FORMATTER TESTS
// ═══════════════════════════════════════════════════════════════

describe('formatCurrency', () => {
    it('formats USD correctly', () => {
        const result = formatCurrency(1234.56, 'USD');
        expect(result).toContain('1');
        expect(result).toContain('234');
    });

    it('formats VES correctly', () => {
        const result = formatCurrency(1000000, 'VES');
        expect(result).toContain('Bs');
    });

    it('formats COP correctly', () => {
        const result = formatCurrency(50000, 'COP');
        expect(result).toContain('50');
    });

    it('formats CLP correctly', () => {
        const result = formatCurrency(100000, 'CLP');
        expect(result).toContain('100');
    });

    it('formats MXN correctly', () => {
        const result = formatCurrency(999, 'MXN');
        expect(result).toContain('999');
    });

    it('handles zero', () => {
        const result = formatCurrency(0, 'USD');
        expect(result).toContain('0');
    });

    it('handles negative numbers', () => {
        const result = formatCurrency(-500, 'USD');
        expect(result).toContain('500');
    });

    it('handles large numbers', () => {
        const result = formatCurrency(1000000000, 'COP');
        expect(result).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════
// COUNTRY CONFIG TESTS
// ═══════════════════════════════════════════════════════════════

describe('isDualCurrency', () => {
    it('returns true for Venezuela', () => {
        expect(isDualCurrency('VE')).toBe(true);
    });

    it('returns false for Colombia', () => {
        expect(isDualCurrency('CO')).toBe(false);
    });

    it('returns false for Chile', () => {
        expect(isDualCurrency('CL')).toBe(false);
    });

    it('returns false for Mexico', () => {
        expect(isDualCurrency('MX')).toBe(false);
    });

    it('returns false for Argentina', () => {
        expect(isDualCurrency('AR')).toBe(false);
    });

    it('returns false for USA', () => {
        expect(isDualCurrency('US')).toBe(false);
    });
});

describe('getCountryConfig', () => {
    it('returns correct config for VE', () => {
        const config = getCountryConfig('VE');
        expect(config.name).toBe('Venezuela');
        expect(config.currencies).toContain('USD');
        expect(config.currencies).toContain('VES');
        expect(config.features.dualCurrency).toBe(true);
        expect(config.features.showBCVCard).toBe(true);
    });

    it('returns correct config for CO', () => {
        const config = getCountryConfig('CO');
        expect(config.name).toBe('Colombia');
        expect(config.currencies).toContain('COP');
        expect(config.currencies).not.toContain('USD');
        expect(config.features.dualCurrency).toBe(false);
    });

    it('returns correct config for CL', () => {
        const config = getCountryConfig('CL');
        expect(config.name).toBe('Chile');
        expect(config.defaultCurrency).toBe('CLP');
    });

    it('returns correct config for MX', () => {
        const config = getCountryConfig('MX');
        expect(config.name).toBe('México');
        expect(config.defaultCurrency).toBe('MXN');
    });

    it('returns correct config for AR', () => {
        const config = getCountryConfig('AR');
        expect(config.name).toBe('Argentina');
        expect(config.defaultCurrency).toBe('ARS');
    });

    it('returns correct config for US', () => {
        const config = getCountryConfig('US');
        expect(config.name).toBe('Estados Unidos');
        expect(config.defaultCurrency).toBe('USD');
        expect(config.locale).toBe('en-US');
    });

    it('defaults to VE for unknown country', () => {
        const config = getCountryConfig('XX');
        expect(config.name).toBe('Venezuela');
    });
});

describe('getCountryOptions', () => {
    it('returns all countries', () => {
        const options = getCountryOptions();
        expect(options.length).toBe(Object.keys(COUNTRIES).length);
    });

    it('each option has value and label', () => {
        const options = getCountryOptions();
        options.forEach(opt => {
            expect(opt.value).toBeTruthy();
            expect(opt.label).toBeTruthy();
            expect(opt.label).toContain(COUNTRIES[opt.value].flag);
        });
    });
});

// ═══════════════════════════════════════════════════════════════
// DATE UTILS TESTS
// ═══════════════════════════════════════════════════════════════

import { toUTCISOString, getCurrentLocalDatetime, utcToLocalDatetime } from '../src/utils/dateUtils';

describe('toUTCISOString', () => {
    it('converts valid date string to UTC ISO', () => {
        const result = toUTCISOString('2023-10-27T08:30:00');
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(result).toContain('Z'); // UTC marker
    });

    it('handles null by returning current time', () => {
        const result = toUTCISOString(null);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(result).toContain('Z');
    });

    it('handles undefined by returning current time', () => {
        const result = toUTCISOString(undefined);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('handles invalid date string by returning current time', () => {
        const result = toUTCISOString('not-a-date');
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('handles empty string by returning current time', () => {
        const result = toUTCISOString('');
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
});

describe('getCurrentLocalDatetime', () => {
    it('returns string in correct format', () => {
        const result = getCurrentLocalDatetime();
        // Format: YYYY-MM-DDTHH:mm:ss (19 characters)
        expect(result.length).toBe(19);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it('does not include timezone marker', () => {
        const result = getCurrentLocalDatetime();
        expect(result).not.toContain('Z');
    });
});

describe('utcToLocalDatetime', () => {
    it('converts UTC to local format', () => {
        const utcDate = '2023-10-27T12:30:00.000Z';
        const result = utcToLocalDatetime(utcDate);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
        expect(result).not.toContain('Z');
    });

    it('handles null by returning current time', () => {
        const result = utcToLocalDatetime(null);
        expect(result.length).toBe(19);
    });

    it('handles invalid date by returning current time', () => {
        const result = utcToLocalDatetime('garbage');
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });
});
