const express = require('express');
const router = express.Router();
const { getLatestRate, updateExchangeRate } = require('../services/bcvScraper');

// GET /api/exchange-rate/usd-ves
router.get('/usd-ves', async (req, res) => {
    try {
        let rateData = await getLatestRate();

        // Optional: If data is too old (e.g. > 12 hours), trigger update?
        // For now, let's just return what we have. If empty, try to fetch immediately.
        if (!rateData) {
            console.log("No rate in DB, fetching now...");
            const newRate = await updateExchangeRate();
            if (newRate) {
                rateData = await getLatestRate();
            }
        }

        if (!rateData) {
            return res.status(503).json({ error: "Service unavailable (Rate not found)" });
        }

        res.json(rateData);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /api/exchange-rate/force-update (Admin/Debug)
router.post('/force-update', async (req, res) => {
    try {
        const rate = await updateExchangeRate();
        if (rate) {
            res.json({ success: true, rate });
        } else {
            res.status(500).json({ error: "Failed to fetch rate" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
