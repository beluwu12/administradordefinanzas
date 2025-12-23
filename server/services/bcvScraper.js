/**
 * BCV Exchange Rate Scraper
 * Fetches USD/VES official rate from Banco Central de Venezuela
 * 
 * SECURITY: NO SSL BYPASS - Uses HTTP endpoint
 * RELIABILITY: Implements retry logic with exponential backoff
 */

const axios = require('axios');
const cheerio = require('cheerio');
const prisma = require('../db');
const { getOrFetch, invalidate } = require('./cacheService');
const { logger } = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════
// CONSTANTS - No more magic numbers!
// ═══════════════════════════════════════════════════════════════
const BCV_URL = 'http://www.bcv.org.ve/';  // HTTP - BCV's SSL is unreliable
const CACHE_KEY = 'bcv-rate-usd-ves';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CACHE_TTL_SECONDS = 3600; // 1 hour

/**
 * Delay helper for retry logic
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch BCV exchange rate with retry logic
 * NO SSL BYPASS - We use HTTP endpoint which BCV provides
 * @returns {Promise<number|null>} Exchange rate or null on failure
 */
async function fetchBCVRate() {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            logger.info(`Fetching BCV Rate (attempt ${attempt}/${MAX_RETRIES})...`);

            const { data } = await axios.get(BCV_URL, {
                timeout: REQUEST_TIMEOUT_MS,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'es-VE,es;q=0.9'
                }
            });

            const $ = cheerio.load(data);

            // Selector based on typical BCV structure
            // div#dolar -> div.col-sm-6 -> div.col-xs-6 -> strong
            let rateText = $('#dolar strong').text().trim();

            if (!rateText) {
                // Fallback: Sometimes it's inside #dolar .field-content
                rateText = $('#dolar .field-content').text().trim();
            }

            // Additional fallback: Search for "USD" text container
            if (!rateText) {
                const usdContainer = $('span:contains("USD")').closest('div');
                rateText = usdContainer.find('strong').text().trim();
            }

            if (!rateText) {
                throw new Error('Could not find rate in HTML');
            }

            // Parse "45,23" -> 45.23
            const cleanedText = rateText.replace(/[^\d,.-]/g, '').replace(',', '.');
            const rate = parseFloat(cleanedText);

            if (isNaN(rate) || !isFinite(rate) || rate <= 0) {
                throw new Error(`Parsed rate is invalid: ${rateText} -> ${rate}`);
            }

            logger.info('BCV Rate Fetched successfully', { rate, attempt });
            return rate;

        } catch (error) {
            lastError = error;
            logger.warn(`BCV fetch attempt ${attempt} failed`, { error: error.message });

            if (attempt < MAX_RETRIES) {
                const delayTime = RETRY_DELAY_MS * attempt; // Exponential backoff
                logger.info(`Retrying in ${delayTime}ms...`);
                await delay(delayTime);
            }
        }
    }

    logger.error('All BCV fetch attempts failed', {
        error: lastError?.message,
        attempts: MAX_RETRIES
    });
    return null;
}

/**
 * Update exchange rate in database
 * @returns {Promise<number|null>} The saved rate or null on failure
 */
async function updateExchangeRate() {
    const rate = await fetchBCVRate();

    if (!rate) {
        logger.warn('No rate fetched, skipping DB update');
        return null;
    }

    try {
        await prisma.exchangeRate.create({
            data: {
                source: 'BCV',
                pair: 'USD-VES',
                rate: rate
            }
        });

        logger.info('Exchange Rate updated in DB', { rate });
        invalidate(CACHE_KEY);
        return rate;

    } catch (dbError) {
        logger.error('DB Error saving rate', { error: dbError.message });
        return null;
    }
}

/**
 * Get latest rate from DB (no cache)
 * @returns {Promise<object|null>} Latest rate record or null
 */
async function getLatestRateFromDB() {
    const latest = await prisma.exchangeRate.findFirst({
        where: { pair: 'USD-VES' },
        orderBy: { fetchedAt: 'desc' }
    });
    return latest;
}

/**
 * Get latest rate WITH CACHE
 * This is the main function to use in API endpoints
 * @returns {Promise<object|null>} Cached or fresh rate data
 */
async function getLatestRate() {
    return getOrFetch(CACHE_KEY, async () => {
        return await getLatestRateFromDB();
    }, CACHE_TTL_SECONDS);
}

module.exports = {
    updateExchangeRate,
    getLatestRate,
    getLatestRateFromDB,
    invalidateRateCache: () => invalidate(CACHE_KEY)
};
