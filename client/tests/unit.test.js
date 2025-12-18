/**
 * Frontend Component Tests
 * Using Vitest + React Testing Library patterns
 * 
 * To run: npm run test (requires vitest setup)
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../src/utils/formatters';
import { isDualCurrency, getCountryConfig } from '../src/config/countries';

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

    it('handles zero', () => {
        const result = formatCurrency(0, 'USD');
        expect(result).toContain('0');
    });

    it('handles negative numbers', () => {
        const result = formatCurrency(-500, 'USD');
        expect(result).toContain('500');
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
    });

    it('returns correct config for CO', () => {
        const config = getCountryConfig('CO');
        expect(config.name).toBe('Colombia');
        expect(config.currencies).toContain('COP');
    });

    it('defaults to VE for unknown country', () => {
        const config = getCountryConfig('XX');
        expect(config.name).toBe('Venezuela');
    });
});
