/**
 * Currency Enforcement Middleware
 * Ensures users can only create transactions in currencies allowed for their country
 */

const { isCurrencyAllowed } = require('../config/countries');
const { errors } = require('../utils/responseUtils');

/**
 * Middleware to enforce currency restrictions based on user's country
 * Should be used after requireAuth middleware
 */
const enforceCurrency = (req, res, next) => {
    try {
        const { country } = req.user || {};
        const { currency } = req.body;

        // Skip if no currency in body or no country set
        if (!currency || !country) {
            return next();
        }

        // Check if currency is allowed for this country
        if (!isCurrencyAllowed(country, currency)) {
            const errResponse = errors.validation(
                `Moneda ${currency} no está permitida para tu país (${country})`
            );
            return res.status(errResponse.status).json(errResponse);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { enforceCurrency };
