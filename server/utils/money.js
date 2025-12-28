/**
 * Money Utilities - Financial calculation helpers using Decimal.js
 * 
 * NEVER use parseFloat() for monetary values. Always use these helpers.
 * 
 * @see ADR-003: Money Representation
 */

const Decimal = require('decimal.js');

// Configure Decimal.js for financial precision
Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP
});

/**
 * Parse a monetary amount from various input types
 * Returns a Decimal instance or null if invalid
 * 
 * @param {string|number|Decimal} amount - The amount to parse
 * @returns {Decimal|null} Parsed Decimal or null if invalid
 */
function parseMoney(amount) {
    if (amount === null || amount === undefined || amount === '') {
        return null;
    }

    try {
        // If already a Decimal, return it
        if (amount instanceof Decimal) {
            return amount;
        }

        // Convert to string and clean
        const cleaned = String(amount).trim().replace(/,/g, '');

        // Validate format (optional sign, digits, optional decimal)
        if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
            return null;
        }

        return new Decimal(cleaned);
    } catch (error) {
        console.warn('[Money] Failed to parse amount:', amount, error.message);
        return null;
    }
}

/**
 * Add two or more monetary amounts
 * @param {...(string|number|Decimal)} amounts - Amounts to add
 * @returns {Decimal} Sum as Decimal
 */
function addMoney(...amounts) {
    return amounts.reduce((sum, amt) => {
        const parsed = parseMoney(amt);
        return parsed ? sum.plus(parsed) : sum;
    }, new Decimal(0));
}

/**
 * Subtract monetary amounts (first - rest)
 * @param {string|number|Decimal} base - Base amount
 * @param {...(string|number|Decimal)} amounts - Amounts to subtract
 * @returns {Decimal} Result as Decimal
 */
function subtractMoney(base, ...amounts) {
    const baseDecimal = parseMoney(base) || new Decimal(0);
    return amounts.reduce((result, amt) => {
        const parsed = parseMoney(amt);
        return parsed ? result.minus(parsed) : result;
    }, baseDecimal);
}

/**
 * Multiply a monetary amount by a factor
 * @param {string|number|Decimal} amount - Amount to multiply
 * @param {string|number|Decimal} factor - Multiplication factor
 * @returns {Decimal} Result as Decimal
 */
function multiplyMoney(amount, factor) {
    const amtDecimal = parseMoney(amount);
    const factorDecimal = parseMoney(factor);

    if (!amtDecimal || !factorDecimal) {
        return new Decimal(0);
    }

    return amtDecimal.times(factorDecimal);
}

/**
 * Divide a monetary amount by a divisor
 * @param {string|number|Decimal} amount - Amount to divide
 * @param {string|number|Decimal} divisor - Division factor
 * @returns {Decimal} Result as Decimal, or 0 if divisor is 0
 */
function divideMoney(amount, divisor) {
    const amtDecimal = parseMoney(amount);
    const divisorDecimal = parseMoney(divisor);

    if (!amtDecimal || !divisorDecimal || divisorDecimal.isZero()) {
        return new Decimal(0);
    }

    return amtDecimal.dividedBy(divisorDecimal);
}

/**
 * Round a Decimal to 2 decimal places (for display)
 * @param {Decimal} amount - Amount to round
 * @returns {Decimal} Rounded amount
 */
function roundMoney(amount) {
    if (!(amount instanceof Decimal)) {
        const parsed = parseMoney(amount);
        if (!parsed) return new Decimal(0);
        return parsed.toDecimalPlaces(2);
    }
    return amount.toDecimalPlaces(2);
}

/**
 * Convert Decimal to string for database storage
 * @param {Decimal} amount - Amount to convert
 * @returns {string} String representation
 */
function toMoneyString(amount) {
    if (amount instanceof Decimal) {
        return amount.toFixed(4); // 4 decimal places for storage
    }
    const parsed = parseMoney(amount);
    return parsed ? parsed.toFixed(4) : '0.0000';
}

/**
 * Convert Decimal to number for JSON serialization
 * Use sparingly - prefer string representation
 * @param {Decimal} amount - Amount to convert
 * @returns {number} Number representation
 */
function toMoneyNumber(amount) {
    if (amount instanceof Decimal) {
        return amount.toNumber();
    }
    const parsed = parseMoney(amount);
    return parsed ? parsed.toNumber() : 0;
}

/**
 * Compare two monetary amounts
 * @param {string|number|Decimal} a - First amount
 * @param {string|number|Decimal} b - Second amount
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 */
function compareMoney(a, b) {
    const aDecimal = parseMoney(a) || new Decimal(0);
    const bDecimal = parseMoney(b) || new Decimal(0);
    return aDecimal.comparedTo(bDecimal);
}

/**
 * Check if amount is positive
 * @param {string|number|Decimal} amount - Amount to check
 * @returns {boolean} True if positive
 */
function isPositive(amount) {
    const parsed = parseMoney(amount);
    return parsed ? parsed.isPositive() : false;
}

/**
 * Check if amount is negative
 * @param {string|number|Decimal} amount - Amount to check
 * @returns {boolean} True if negative
 */
function isNegative(amount) {
    const parsed = parseMoney(amount);
    return parsed ? parsed.isNegative() : false;
}

/**
 * Get absolute value
 * @param {string|number|Decimal} amount - Amount
 * @returns {Decimal} Absolute value
 */
function absMoney(amount) {
    const parsed = parseMoney(amount);
    return parsed ? parsed.abs() : new Decimal(0);
}

module.exports = {
    Decimal,
    parseMoney,
    addMoney,
    subtractMoney,
    multiplyMoney,
    divideMoney,
    roundMoney,
    toMoneyString,
    toMoneyNumber,
    compareMoney,
    isPositive,
    isNegative,
    absMoney
};
