/**
 * Exchange Rate Routes
 * Updated with standardized responses
 */

const express = require('express');
const router = express.Router();
const { getLatestRate } = require('../services/bcvScraper');
const { success, errors } = require('../utils/responseUtils');

/**
 * GET /api/exchange-rate/usd-ves - Get latest BCV exchange rate
 * Public endpoint - no auth required (for transaction form)
 */
router.get('/usd-ves', async (req, res, next) => {
    try {
        const latest = await getLatestRate();

        if (!latest) {
            // Return a fallback response instead of error
            // This prevents the app from breaking if BCV is down
            return res.json(success({
                rate: null,
                source: 'BCV',
                updatedAt: null,
                message: 'Tasa no disponible - usa tasa manual'
            }));
        }

        res.json(success({
            rate: latest.rate,
            source: latest.source,
            updatedAt: latest.fetchedAt
        }));
    } catch (error) {
        next(error);
    }
});

module.exports = router;
