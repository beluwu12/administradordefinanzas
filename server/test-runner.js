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
// CACHE SERVICE TESTS
// ═══════════════════════════════════════════════════════════════

const { cache, invalidate, clearAll } = require('./services/cacheService');

test('cache - can set and get values', () => {
    cache.set('test-key', 'test-value');
    const result = cache.get('test-key');
    assert.strictEqual(result, 'test-value');
    cache.del('test-key'); // cleanup
});

test('cache - returns undefined for missing keys', () => {
    const result = cache.get('non-existent-key');
    assert.strictEqual(result, undefined);
});

test('invalidate - removes cached value', () => {
    cache.set('to-invalidate', 'value');
    invalidate('to-invalidate');
    const result = cache.get('to-invalidate');
    assert.strictEqual(result, undefined);
});

test('clearAll - removes all cached values', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    clearAll();
    assert.strictEqual(cache.get('key1'), undefined);
    assert.strictEqual(cache.get('key2'), undefined);
});

// ═══════════════════════════════════════════════════════════════
// RESPONSE UTILITIES TESTS
// ═══════════════════════════════════════════════════════════════

const { success, error, errors } = require('./utils/responseUtils');

test('success - returns correct format', () => {
    const result = success({ id: 1 }, 'Done');
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.data, { id: 1 });
    assert.strictEqual(result.message, 'Done');
    assert.strictEqual(result.error, null);
});

test('error - returns correct format', () => {
    const result = error('Something went wrong', 'ERR_CODE', 400);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.message, 'Something went wrong');
    assert.strictEqual(result.code, 'ERR_CODE');
    assert.strictEqual(result.status, 400);
});

test('errors.notFound - returns 404', () => {
    const result = errors.notFound('Usuario');
    assert.strictEqual(result.status, 404);
    assert.strictEqual(result.code, 'NOT_FOUND');
    assert.ok(result.message.includes('Usuario'));
});

test('errors.unauthorized - returns 401', () => {
    const result = errors.unauthorized();
    assert.strictEqual(result.status, 401);
    assert.strictEqual(result.code, 'UNAUTHORIZED');
});

test('errors.validation - returns 400', () => {
    const result = errors.validation('Campo inválido');
    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.message, 'Campo inválido');
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
