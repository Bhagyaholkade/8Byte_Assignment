const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

/**
 * Parses the Excel file and converts it to structured JSON
 */
function parseExcelData() {
    const excelPath = path.join(__dirname, '..', 'E555815F_58D029050B.xlsx');

    if (!fs.existsSync(excelPath)) {
        throw new Error(`Excel file not found at: ${excelPath}`);
    }

    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    // The first row contains headers, second row is sector header
    // We need to properly map the columns
    const stocks = [];
    let currentSector = '';
    let stockCounter = 1; // Use a counter for unique IDs

    rawData.forEach((row, index) => {
        // Get column values
        const col1 = row.__EMPTY;
        const col2 = row.__EMPTY_1;
        const col3 = row.__EMPTY_2;
        const col4 = row.__EMPTY_3;
        const col2Str = col2 ? col2.toString().trim() : '';
        const col1Str = col1 ? col1.toString().trim() : '';

        // Skip completely empty rows
        if (!col1 && !col2) {
            return;
        }

        // Skip header row
        if (col1Str === 'No' || col2Str === 'Particulars') {
            return;
        }

        // Detect sector header row:
        // A sector row has:
        // - Empty or no value in column 1 (__EMPTY)
        // - A text name in column 2 (__EMPTY_1)
        // - No numeric price in column 3 (__EMPTY_2) OR empty column 3

        const col3Value = row.__EMPTY_2;
        const hasNoPrice = !col3Value || col3Value === '' || col3Value === undefined;

        // Check if this is a sector header (col1 is empty, col2 has text, no price data)
        if ((!col1Str || col1Str === '') && col2Str && hasNoPrice) {
            currentSector = col2Str;
            console.log(`[Parser] Found sector: "${currentSector}" at row ${index}`);
            return;
        }

        // Skip rows without valid stock ID (must be a number)
        if (!col1 || isNaN(parseInt(col1))) {
            return;
        }

        // Parse stock data with unique ID
        const stock = {
            id: stockCounter++, // Use counter instead of row.__EMPTY
            originalId: row.__EMPTY, // Keep original ID for reference
            name: row.__EMPTY_1,
            currentPrice: parseFloat(row.__EMPTY_2) || 0,
            quantity: parseInt(row.__EMPTY_3) || 0,
            investedAmount: parseFloat(row.__EMPTY_4) || 0,
            investedPercentage: parseFloat(row.__EMPTY_5) || 0,
            symbol: row.__EMPTY_6,
            currentValue: parseFloat(row.__EMPTY_7) || 0,
            totalValue: parseFloat(row.__EMPTY_8) || 0,
            profitLoss: parseFloat(row.__EMPTY_9) || 0,
            profitLossPercentage: parseFloat(row.__EMPTY_10) || 0,
            marketCap: parseFloat(row.__EMPTY_11) || 0,
            pe: parseFloat(row.__EMPTY_12) || 0,
            pb: parseFloat(row.__EMPTY_13) || 0,
            revenue: parseFloat(row['Core Fundamentals']) || 0,
            ebitda: parseFloat(row.__EMPTY_14) || 0,
            ebitdaMargin: parseFloat(row.__EMPTY_15) || 0,
            pat: parseFloat(row.__EMPTY_16) || 0,
            patMargin: parseFloat(row.__EMPTY_17) || 0,
            cashFlow: parseFloat(row.__EMPTY_18) || 0,
            reserves: parseFloat(row.__EMPTY_19) || 0,
            borrowings: parseFloat(row.__EMPTY_20) || 0,
            debtToEquity: parseFloat(row.__EMPTY_21) || 0,
            bookValue: parseFloat(row.__EMPTY_22) || 0,
            revenueGrowth3Y: parseFloat(row['Growth (3 years']) || 0,
            ebitdaGrowth3Y: parseFloat(row.__EMPTY_23) || 0,
            profitGrowth3Y: parseFloat(row.__EMPTY_24) || 0,
            marketCapGrowth: parseFloat(row.__EMPTY_25) || 0,
            priceToSales: parseFloat(row.__EMPTY_26) || 0,
            cfoToEbitda: parseFloat(row.__EMPTY_27) || 0,
            cfoToPat: parseFloat(row.__EMPTY_28) || 0,
            priceToBook: parseFloat(row.__EMPTY_29) || 0,
            stage2: row.__EMPTY_30,
            salePrice: parseFloat(row.__EMPTY_31) || 0,
            notes: row.__EMPTY_32,
            sector: currentSector
        };

        // Calculate purchase price (invested amount / quantity)
        stock.purchasePrice = stock.quantity > 0 ? stock.investedAmount / stock.quantity : 0;

        // Calculate gain/loss percentage if not already present
        if (!stock.profitLossPercentage && stock.investedAmount > 0) {
            stock.profitLossPercentage = (stock.profitLoss / stock.investedAmount) * 100;
        }

        stocks.push(stock);
    });

    return stocks;
}

/**
 * Get summary statistics
 */
function getSummary(stocks) {
    const totalInvested = stocks.reduce((sum, s) => sum + (s.investedAmount || 0), 0);
    const totalCurrentValue = stocks.reduce((sum, s) => sum + (s.totalValue || 0), 0);
    const totalProfitLoss = totalCurrentValue - totalInvested;

    const sectorDistribution = {};
    stocks.forEach(stock => {
        if (!sectorDistribution[stock.sector]) {
            sectorDistribution[stock.sector] = {
                count: 0,
                invested: 0,
                currentValue: 0
            };
        }
        sectorDistribution[stock.sector].count++;
        sectorDistribution[stock.sector].invested += stock.investedAmount || 0;
        sectorDistribution[stock.sector].currentValue += stock.totalValue || 0;
    });

    return {
        totalInvested,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercentage: (totalProfitLoss / totalInvested) * 100,
        totalStocks: stocks.length,
        sectorDistribution
    };
}

/**
 * Get alerts (Must exit, Stage-2)
 */
function getAlerts(stocks) {
    const mustExit = stocks.filter(s => s.notes && s.notes.toLowerCase().includes('exit'));
    const stage2 = stocks.filter(s => s.stage2 === 'Yes');

    return {
        mustExit,
        stage2
    };
}

module.exports = {
    parseExcelData,
    getSummary,
    getAlerts
};
