/**
 * Backend Test Runner
 * Simple test framework for API routes and utilities
 */

const assert = require('assert');

// Test results collector
const results = { passed: 0, failed: 0, errors: [] };

// Simple test function
const test = (name, fn) => {
    try {
        fn();
        results.passed++;
        console.log(`✅ ${name}`);
    } catch (error) {
        results.failed++;
        results.errors.push({ name, error: error.message });
        console.log(`❌ ${name}: ${error.message}`);
    }
};

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION SCHEMA TESTS
// ═══════════════════════════════════════════════════════════════

const { createTransactionSchema, updateTransactionSchema, registerSchema, loginSchema } = require('./schemas');

test('registerSchema - valid registration', () => {
    const valid = {
        email: 'test@example.com',
        password: 'secure123',
        firstName: 'John',
        lastName: 'Doe',
        country: 'CO'
    };
    const result = registerSchema.safeParse(valid);
    assert.strictEqual(result.success, true);
});

test('registerSchema - password too short rejected', () => {
    const invalid = {
        email: 'test@example.com',
        password: '123', // Less than 6 chars
        firstName: 'John',
        lastName: 'Doe'
    };
    const result = registerSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
});

test('registerSchema - invalid email rejected', () => {
    const invalid = {
        email: 'not-an-email',
        password: 'secure123',
        firstName: 'John',
        lastName: 'Doe'
    };
    const result = registerSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
});

test('registerSchema - defaults country to VE', () => {
    const valid = {
        email: 'test@example.com',
        password: 'secure123',
        firstName: 'John',
        lastName: 'Doe'
    };
    const result = registerSchema.safeParse(valid);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.country, 'VE');
});

test('loginSchema - valid login', () => {
    const valid = {
        email: 'test@example.com',
        password: 'mypassword'
    };
    const result = loginSchema.safeParse(valid);
    assert.strictEqual(result.success, true);
});

test('loginSchema - empty password rejected', () => {
    const invalid = {
        email: 'test@example.com',
        password: ''
    };
    const result = loginSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
});

// ═══════════════════════════════════════════════════════════════
// TRANSACTION SCHEMA VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════

test('createTransactionSchema - valid income transaction', () => {
    const valid = {
        type: 'INCOME',
        amount: 100.50,
        description: 'Salary',
        currency: 'USD',
        date: '2024-01-15T10:00:00.000Z'
    };
    const result = createTransactionSchema.safeParse(valid);
    assert.strictEqual(result.success, true);
});

test('createTransactionSchema - valid expense transaction', () => {
    const valid = {
        type: 'EXPENSE',
        amount: 25.00,
        description: 'Groceries',
        currency: 'VES',
        date: '2024-01-15T10:00:00.000Z'
    };
    const result = createTransactionSchema.safeParse(valid);
    assert.strictEqual(result.success, true);
});

test('createTransactionSchema - invalid type', () => {
    const invalid = {
        type: 'INVALID',
        amount: 100,
        description: 'Test',
        currency: 'USD',
        date: '2024-01-15T10:00:00.000Z'
    };
    const result = createTransactionSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
});

test('createTransactionSchema - negative amount rejected', () => {
    const invalid = {
        type: 'INCOME',
        amount: -50,
        description: 'Test',
        currency: 'USD',
        date: '2024-01-15T10:00:00.000Z'
    };
    const result = createTransactionSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
});

test('createTransactionSchema - empty description rejected', () => {
    const invalid = {
        type: 'INCOME',
        amount: 100,
        description: '',
        currency: 'USD',
        date: '2024-01-15T10:00:00.000Z'
    };
    const result = createTransactionSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
});

// ═══════════════════════════════════════════════════════════════
// PAGINATION UTILITY TESTS
// ═══════════════════════════════════════════════════════════════

const { withSoftDelete } = require('./utils/pagination');

test('withSoftDelete - adds deletedAt: null', () => {
    const where = { userId: 'abc123' };
    const result = withSoftDelete(where);
    assert.deepStrictEqual(result, { userId: 'abc123', deletedAt: null });
});

test('withSoftDelete - handles empty object', () => {
    const result = withSoftDelete({});
    assert.deepStrictEqual(result, { deletedAt: null });
});

// ═══════════════════════════════════════════════════════════════
// COUNTRY CONFIG TESTS
// ═══════════════════════════════════════════════════════════════

const { getCountryConfig, isDualCurrency } = require('./config/countries');

test('getCountryConfig - VE returns dual currency', () => {
    const config = getCountryConfig('VE');
    assert.strictEqual(config.currencies.length, 2);
    assert.strictEqual(config.currencies.includes('USD'), true);
    assert.strictEqual(config.currencies.includes('VES'), true);
});

test('getCountryConfig - CO returns single currency', () => {
    const config = getCountryConfig('CO');
    assert.strictEqual(config.currencies.length, 1);
    assert.strictEqual(config.currencies[0], 'COP');
});

test('isDualCurrency - VE is true', () => {
    assert.strictEqual(isDualCurrency('VE'), true);
});

test('isDualCurrency - US is false', () => {
    assert.strictEqual(isDualCurrency('US'), false);
});

// ═══════════════════════════════════════════════════════════════
// RESULTS SUMMARY
// ═══════════════════════════════════════════════════════════════

console.log('\n════════════════════════════════════════');
console.log(`📊 Test Results: ${results.passed} passed, ${results.failed} failed`);
console.log('════════════════════════════════════════');

if (results.failed > 0) {
    console.log('\n❌ Failed tests:');
    results.errors.forEach(({ name, error }) => {
        console.log(`   - ${name}: ${error}`);
    });
    process.exit(1);
}

process.exit(0);
