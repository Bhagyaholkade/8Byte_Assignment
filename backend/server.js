const express = require('express');
const cors = require('cors');
const { parseExcelData, getSummary, getAlerts } = require('./dataParser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Enable CORS for Vercel domains
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // Allow all Vercel preview URLs and production URL
        const allowedPatterns = [
            /\.vercel\.app$/,
            /localhost/,
            /127\.0\.0\.1/
        ];

        const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
        if (isAllowed) {
            return callback(null, true);
        }

        // Also check explicit FRONTEND_URL
        if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Cache the parsed data
let stocksData = null;
let lastPriceUpdate = null;
const PRICE_CACHE_DURATION = 60000; // 1 minute cache for live prices

// NSE Symbol mapping for stocks with BSE codes or incorrect symbols
const SYMBOL_MAP = {
    // Financial Sector
    'HDFCBANK': 'HDFCBANK',
    'BAJFINANCE': 'BAJFINANCE',
    '532174': 'ICICIBANK',      // ICICI Bank BSE code
    '544252': 'BAJAJHFL',       // Bajaj Housing Finance
    '511577': 'SAVANIFI',       // Savani Financials (may not be on NSE)

    // Tech Sector
    'AFFLE': 'AFFLE',
    'LTIM': 'LTIM',
    '542651': 'KPITTECH',       // KPIT Tech BSE code
    '544028': 'TATATECH',       // Tata Tech BSE code
    '544107': 'BLS',            // BLS E-Services
    '532790': 'TANLA',          // Tanla Platforms

    // Consumer
    'DMART': 'DMART',
    '532540': 'TATACONSUM',     // Tata Consumer BSE code
    '500331': 'PIDILITIND',     // Pidilite BSE code

    // Power
    '500400': 'TATAPOWER',      // Tata Power BSE code
    '542323': 'KPIGREEN',       // KPI Green
    '532667': 'SUZLON',         // Suzlon BSE code
    '542851': 'GENSOL',         // Gensol Engineering

    // Pipe Sector
    '543517': 'HARIOMPIPE',     // Hariom Pipe
    'ASTRAL': 'ASTRAL',
    '542652': 'POLYCAB',        // Polycab BSE code

    // Others
    '543318': 'CLEAN',          // Clean Science
    '506401': 'DEEPAKNTR',      // Deepak Nitrite BSE code
    '541557': 'FINEORG',        // Fine Organic BSE code
    '533282': 'GRAVITA',        // Gravita BSE code
    '540719': 'SBILIFE',        // SBI Life BSE code
    '500209': 'INFY',           // Infosys BSE code
    '543237': 'HAPPSTMNDS',     // Happiest Minds
    '543272': 'EASEMYTRIP',     // EaseMyTrip
};

// Get proper NSE symbol for Yahoo Finance
function getNSESymbol(symbol) {
    if (!symbol) return null;
    const mapped = SYMBOL_MAP[symbol];
    return mapped || symbol; // Return mapped symbol or original
}

// Yahoo Finance integration
let yahooFinance = null;
async function initYahooFinance() {
    try {
        const YahooFinance = await import('yahoo-finance2').then(m => m.default);
        // New API (v3) requires instantiation
        yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
        console.log('✅ Yahoo Finance initialized');
    } catch (error) {
        console.warn('⚠️ Yahoo Finance not available:', error.message);
    }
}

// Google Finance scraping for P/E and Earnings
// Note: Google Finance doesn't have an official API, so we use Yahoo Finance
// as a fallback which provides similar data (P/E ratio, earnings)
async function fetchGoogleFinanceData(symbol) {
    // Since Google Finance has no public API, we fetch P/E and earnings from Yahoo Finance
    // which provides: trailingPE, forwardPE, earningsQuarterly, etc.
    if (!yahooFinance || !symbol) return null;

    try {
        const nseSymbol = `${symbol}.NS`;
        const quote = await yahooFinance.quote(nseSymbol);

        if (quote) {
            return {
                pe: quote.trailingPE || quote.forwardPE,
                eps: quote.epsTrailingTwelveMonths,
                earningsDate: quote.earningsTimestamp,
                revenuePerShare: quote.revenuePerShare,
                bookValue: quote.bookValue
            };
        }
    } catch (error) {
        // Silent fail
    }
    return null;
}

// Fetch live price for a stock symbol
async function fetchLivePrice(symbol) {
    if (!yahooFinance || !symbol) return null;

    try {
        // Convert to proper NSE symbol using mapping
        const properSymbol = getNSESymbol(symbol);
        const nseSymbol = `${properSymbol}.NS`;

        console.log(`  Fetching: ${symbol} -> ${nseSymbol}`);
        const quote = await yahooFinance.quote(nseSymbol);

        if (quote && quote.regularMarketPrice) {
            console.log(`  ✓ Got price for ${properSymbol}: ₹${quote.regularMarketPrice}`);
            return {
                price: quote.regularMarketPrice,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                dayHigh: quote.regularMarketDayHigh,
                dayLow: quote.regularMarketDayLow,
                volume: quote.regularMarketVolume,
                marketCap: quote.marketCap,
                pe: quote.trailingPE || quote.forwardPE,
                eps: quote.epsTrailingTwelveMonths,
                earningsDate: quote.earningsTimestamp,
                fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
                exchange: 'NSE'
            };
        }
    } catch (nseError) {
        // Try BSE if NSE fails
        try {
            const properSymbol = getNSESymbol(symbol);
            const bseSymbol = `${properSymbol}.BO`;
            const quote = await yahooFinance.quote(bseSymbol);

            if (quote && quote.regularMarketPrice) {
                console.log(`  ✓ Got BSE price for ${properSymbol}: ₹${quote.regularMarketPrice}`);
                return {
                    price: quote.regularMarketPrice,
                    change: quote.regularMarketChange,
                    changePercent: quote.regularMarketChangePercent,
                    dayHigh: quote.regularMarketDayHigh,
                    dayLow: quote.regularMarketDayLow,
                    volume: quote.regularMarketVolume,
                    marketCap: quote.marketCap,
                    pe: quote.trailingPE || quote.forwardPE,
                    eps: quote.epsTrailingTwelveMonths,
                    earningsDate: quote.earningsTimestamp,
                    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
                    fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
                    exchange: 'BSE'
                };
            }
        } catch (bseError) {
            console.log(`  ✗ Failed for ${symbol}`);
        }
    }
    return null;
}

// Update stock prices with live data
async function updateLivePrices() {
    if (!yahooFinance || !stocksData) return;

    const now = Date.now();
    if (lastPriceUpdate && (now - lastPriceUpdate) < PRICE_CACHE_DURATION) {
        return; // Use cached prices
    }

    console.log('📈 Fetching live prices...');
    let updated = 0;

    // Process in batches to avoid rate limiting
    for (const stock of stocksData) {
        if (stock.symbol) {
            const liveData = await fetchLivePrice(stock.symbol);
            if (liveData) {
                stock.currentPrice = liveData.price;
                stock.totalValue = liveData.price * stock.quantity;
                stock.profitLoss = stock.totalValue - stock.investedAmount;
                stock.profitLossPercentage = stock.investedAmount > 0
                    ? (stock.profitLoss / stock.investedAmount) * 100
                    : 0;
                // Update P/E from live data if available
                if (liveData.pe) {
                    stock.pe = liveData.pe;
                }
                // Update EPS (Earnings Per Share) if available
                if (liveData.eps) {
                    stock.eps = liveData.eps;
                }
                // Update exchange info
                if (liveData.exchange) {
                    stock.exchange = liveData.exchange;
                }
                stock.liveData = liveData;
                updated++;
            }
        }
    }

    lastPriceUpdate = now;
    console.log(`✅ Updated ${updated}/${stocksData.length} stock prices`);
}

// Initialize data
try {
    stocksData = parseExcelData();
    console.log(`✅ Loaded ${stocksData.length} stocks from Excel`);

    // Initialize Yahoo Finance
    initYahooFinance().then(() => {
        // Fetch initial live prices
        updateLivePrices();
    });
} catch (error) {
    console.error('❌ Error loading data:', error.message);
}

// Routes

/**
 * GET /api/stocks
 * Get all stocks with optional filtering
 */
app.get('/api/stocks', async (req, res) => {
    try {
        // Try to update live prices (uses cache if recent)
        await updateLivePrices();

        const { sector, stage2, minGrowth, maxPE } = req.query;

        let filtered = [...stocksData];

        if (sector) {
            filtered = filtered.filter(s =>
                s.sector.toLowerCase().includes(sector.toLowerCase())
            );
        }

        if (stage2 === 'true') {
            filtered = filtered.filter(s => s.stage2 === 'Yes');
        }

        if (minGrowth) {
            const min = parseFloat(minGrowth);
            filtered = filtered.filter(s =>
                s.revenueGrowth3Y && s.revenueGrowth3Y >= min
            );
        }

        if (maxPE) {
            const max = parseFloat(maxPE);
            filtered = filtered.filter(s =>
                s.pe && s.pe <= max
            );
        }

        res.json({
            success: true,
            count: filtered.length,
            data: filtered
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/stocks/sector/:name
 * Get stocks by sector
 */
app.get('/api/stocks/sector/:name', (req, res) => {
    try {
        const sectorName = req.params.name;
        const filtered = stocksData.filter(s =>
            s.sector.toLowerCase().includes(sectorName.toLowerCase())
        );

        res.json({
            success: true,
            sector: sectorName,
            count: filtered.length,
            data: filtered
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/stocks/summary
 * Get portfolio summary with live data
 */
app.get('/api/stocks/summary', async (req, res) => {
    try {
        // Ensure we have latest live prices before calculating summary
        await updateLivePrices();

        const summary = getSummary(stocksData);
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/alerts
 * Get portfolio alerts with live data
 */
app.get('/api/alerts', async (req, res) => {
    try {
        // Ensure we have latest live prices
        await updateLivePrices();

        const alerts = getAlerts(stocksData);
        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/stocks/:id
 * Get single stock by ID
 */
app.get('/api/stocks/:id', (req, res) => {
    try {
        const stockId = parseInt(req.params.id);
        const stock = stocksData.find(s => s.id === stockId);

        if (!stock) {
            return res.status(404).json({
                success: false,
                error: 'Stock not found'
            });
        }

        res.json({
            success: true,
            data: stock
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/sectors
 * Get list of all sectors
 */
app.get('/api/sectors', (req, res) => {
    try {
        const sectors = [...new Set(stocksData.map(s => s.sector))].filter(Boolean);
        res.json({
            success: true,
            data: sectors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/refresh-prices
 * Force refresh live stock prices
 */
app.post('/api/refresh-prices', async (req, res) => {
    try {
        lastPriceUpdate = null; // Clear cache to force refresh
        await updateLivePrices();
        res.json({
            success: true,
            message: 'Prices refreshed',
            lastUpdated: new Date().toISOString(),
            stocksUpdated: stocksData?.length || 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/live-status
 * Get live data status
 */
app.get('/api/live-status', (req, res) => {
    res.json({
        success: true,
        data: {
            yahooFinanceEnabled: !!yahooFinance,
            lastPriceUpdate: lastPriceUpdate ? new Date(lastPriceUpdate).toISOString() : null,
            cacheDuration: PRICE_CACHE_DURATION,
            totalStocks: stocksData?.length || 0,
            stocksWithLiveData: stocksData?.filter(s => s.liveData).length || 0
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        stocks: stocksData?.length || 0,
        yahooFinance: !!yahooFinance,
        lastPriceUpdate: lastPriceUpdate ? new Date(lastPriceUpdate).toISOString() : null
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
