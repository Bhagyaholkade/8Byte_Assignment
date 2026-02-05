const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Stock {
    id: number;
    name: string;
    currentPrice: number;
    quantity: number;
    investedAmount: number;
    investedPercentage: number;
    symbol: string;
    currentValue: number;
    totalValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    marketCap: number;
    pe: number;
    pb: number;
    revenue: number;
    ebitda: number;
    ebitdaMargin: number;
    pat: number;
    patMargin: number;
    cashFlow: number;
    reserves: number;
    borrowings: number;
    debtToEquity: number;
    bookValue: number;
    revenueGrowth3Y: number;
    ebitdaGrowth3Y: number;
    profitGrowth3Y: number;
    marketCapGrowth: number;
    priceToSales: number;
    cfoToEbitda: number;
    cfoToPat: number;
    priceToBook: number;
    stage2: string;
    salePrice?: number;
    notes?: string;
    sector: string;
    purchasePrice?: number; // Calculated: investedAmount / quantity
    eps?: number; // Earnings Per Share
    exchange?: string; // NSE or BSE
    liveData?: {
        price: number;
        change: number;
        changePercent: number;
        dayHigh: number;
        dayLow: number;
        volume: number;
        pe?: number;
        eps?: number;
        exchange?: string;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    count?: number;
    error?: string;
}

export const api = {
    async getStocks(params?: {
        sector?: string;
        stage2?: boolean;
        minGrowth?: number;
        maxPE?: number;
    }): Promise<Stock[]> {
        const queryParams = new URLSearchParams();
        if (params?.sector) queryParams.append('sector', params.sector);
        if (params?.stage2) queryParams.append('stage2', 'true');
        if (params?.minGrowth) queryParams.append('minGrowth', params.minGrowth.toString());
        if (params?.maxPE) queryParams.append('maxPE', params.maxPE.toString());

        const url = `${API_BASE_URL}/api/stocks${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const res = await fetch(url);
        const json: ApiResponse<Stock[]> = await res.json();
        return json.data;
    },

    async getStockById(id: number): Promise<Stock> {
        const res = await fetch(`${API_BASE_URL}/api/stocks/${id}`);
        const json: ApiResponse<Stock> = await res.json();
        return json.data;
    },

    async getSummary() {
        const res = await fetch(`${API_BASE_URL}/api/stocks/summary`);
        const json = await res.json();
        return json.data;
    },

    async getAlerts() {
        const res = await fetch(`${API_BASE_URL}/api/alerts`);
        const json = await res.json();
        return json.data;
    },

    async getSectors(): Promise<string[]> {
        const res = await fetch(`${API_BASE_URL}/api/sectors`);
        const json: ApiResponse<string[]> = await res.json();
        return json.data;
    },

    async getLiveStatus(): Promise<{
        yahooFinanceEnabled: boolean;
        lastPriceUpdate: string | null;
        totalStocks: number;
        stocksWithLiveData: number;
    }> {
        const res = await fetch(`${API_BASE_URL}/api/live-status`);
        const json = await res.json();
        return json.data;
    },

    async refreshPrices(): Promise<{ success: boolean; message: string }> {
        const res = await fetch(`${API_BASE_URL}/api/refresh-prices`, {
            method: 'POST'
        });
        const json = await res.json();
        return json;
    }
};
