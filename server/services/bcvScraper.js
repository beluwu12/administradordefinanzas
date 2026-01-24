/**
 * BCV Exchange Rate Scraper
 * Fetches USD/VES official rate from Banco Central de Venezuela
 * 
 * NOTE: Uses rejectUnauthorized: false because BCV's SSL certificate
 * is frequently misconfigured. This is acceptable for this government
 * site as we're only reading public exchange rate data.
 */

const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const prisma = require('../db');
const { getOrFetch, invalidate } = require('./cacheService');
const { logger } = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const BCV_URL = 'https://www.bcv.org.ve/';
const CACHE_KEY = 'bcv-rate-usd-ves';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CACHE_TTL_SECONDS = 3600; // 1 hour

// Custom HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// ═══════════════════════════════════════════════════════════════
// RETRY WRAPPER
// ═══════════════════════════════════════════════════════════════

/**
 * Generic retry wrapper with exponential backoff
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.delayMs - Base delay between retries (default: 2000)
 * @param {boolean} options.backoff - Use exponential backoff (default: true)
 * @param {string} options.name - Name for logging purposes
 * @returns {Promise<{success: boolean, data?: any, error?: Error}>}
 */
async function withRetry(fn, options = {}) {
    const {
        maxRetries = MAX_RETRIES,
        delayMs = RETRY_DELAY_MS,
        backoff = true,
        name = 'operation'
    } = options;

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const data = await fn();
            return { success: true, data };
        } catch (error) {
            lastError = error;
            logger.warn(`${name} attempt ${attempt}/${maxRetries} failed`, {
                error: error.message
            });

            if (attempt < maxRetries) {
                const waitTime = backoff ? delayMs * attempt : delayMs;
                logger.info(`Retrying ${name} in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    logger.error(`All ${name} attempts failed`, {
        error: lastError?.message,
        attempts: maxRetries
    });

    return { success: false, error: lastError };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch raw HTML from BCV website
 * @returns {Promise<string>} HTML content
 * @throws {Error} On network failure
 */
async function fetchBCVHtml() {
    const { data } = await axios.get(BCV_URL, {
        timeout: REQUEST_TIMEOUT_MS,
        httpsAgent: httpsAgent,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'es-VE,es;q=0.9'
        }
    });
    return data;
}

/**
 * Parse rate text from BCV HTML using multiple selector strategies
 * @param {string} html - Raw HTML content
 * @returns {string} Rate text (e.g., "45,23")
 * @throws {Error} If rate cannot be found
 */
function parseRateFromHtml(html) {
    const $ = cheerio.load(html);

    // Strategy 1: Direct selector
    let rateText = $('#dolar strong').text().trim();

    // Strategy 2: Fallback to field-content
    if (!rateText) {
        rateText = $('#dolar .field-content').text().trim();
    }

    // Strategy 3: Search for USD container
    if (!rateText) {
        const usdContainer = $('span:contains("USD")').closest('div');
        rateText = usdContainer.find('strong').text().trim();
    }

    if (!rateText) {
        throw new Error('Could not find rate in HTML');
    }

    return rateText;
}

/**
 * Parse rate value from text string
 * @param {string} text - Rate text (e.g., "45,23" or "45.23")
 * @returns {number} Parsed rate value
 * @throws {Error} If parsing fails or value is invalid
 */
function parseRateValue(text) {
    // Clean: remove non-numeric chars except comma, dot, minus
    const cleanedText = text.replace(/[^\d,.-]/g, '').replace(',', '.');
    const rate = parseFloat(cleanedText);

    if (isNaN(rate) || !isFinite(rate) || rate <= 0) {
        throw new Error(`Invalid rate value: "${text}" -> ${rate}`);
    }

    return rate;
}

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch BCV exchange rate with retry logic
 * @returns {Promise<number|null>} Exchange rate or null on failure
 */
async function fetchBCVRate() {
    logger.info('Fetching BCV Rate...');

    const result = await withRetry(async () => {
        const html = await fetchBCVHtml();
        const rateText = parseRateFromHtml(html);
        const rate = parseRateValue(rateText);
        return rate;
    }, { name: 'BCV fetch' });

    if (result.success) {
        logger.info('BCV Rate fetched successfully', { rate: result.data });
        return result.data;
    }

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
    // Main exports
    updateExchangeRate,
    getLatestRate,
    getLatestRateFromDB,
    invalidateRateCache: () => invalidate(CACHE_KEY),

    // Exposed for testing
    withRetry,
    fetchBCVHtml,
    parseRateFromHtml,
    parseRateValue
};
