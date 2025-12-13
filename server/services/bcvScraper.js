const axios = require('axios');
const cheerio = require('cheerio');
const prisma = require('../db');

const BCV_URL = 'http://www.bcv.org.ve/';

async function fetchBCVRate() {
    try {
        console.log("Fetching BCV Rate...");
        // Handle SSL errors if any (BCV certs are often self-signed or invalid)
        const agent = new (require('https').Agent)({
            rejectUnauthorized: false
        });

        const { data } = await axios.get(BCV_URL, { httpsAgent: agent, timeout: 10000 });
        const $ = cheerio.load(data);

        // Selector based on typical BCV structure. 
        // Example: <div id="dolar"> ... <strong> 45,23 </strong> ... </div>
        // Note: This needs to be robust. BCV structure:
        // div#dolar -> div.col-sm-6 -> div.col-xs-6 -> strong

        let rateText = $('#dolar strong').text().trim();

        if (!rateText) {
            // Fallback or retry logic if selector fails
            // console.warn("Primary selector failed, trying generic search...");
            // Sometimes it's inside #dolar .field-content
            rateText = $('#dolar .field-content').text().trim();
        }

        if (!rateText) {
            throw new Error("Could not find rate in HTML");
        }

        // Parse "45,23" -> 45.23
        // Handle multiple formats: "45,23", "45.23", "45 23", etc.
        const cleanedText = rateText.replace(/[^\d,.-]/g, '').replace(',', '.');
        const rate = parseFloat(cleanedText);

        if (isNaN(rate) || !isFinite(rate) || rate <= 0) {
            throw new Error(`Parsed rate is invalid: ${rateText} -> ${rate}`);
        }

        console.log(`BCV Rate Fetched: ${rate}`);
        return rate;

    } catch (error) {
        console.error("Error scraping BCV:", error.message);
        return null;
    }
}

async function updateExchangeRate() {
    const rate = await fetchBCVRate();
    if (rate) {
        try {
            await prisma.exchangeRate.create({
                data: {
                    source: 'BCV',
                    pair: 'USD-VES',
                    rate: rate
                }
            });
            console.log("Exchange Rate updated in DB.");
            return rate;
        } catch (dbError) {
            console.error("DB Error saving rate:", dbError);
        }
    }
    return null;
}

async function getLatestRate() {
    // Return latest from DB
    const latest = await prisma.exchangeRate.findFirst({
        where: { pair: 'USD-VES' },
        orderBy: { fetchedAt: 'desc' }
    });
    return latest;
}

module.exports = {
    updateExchangeRate,
    getLatestRate
};
