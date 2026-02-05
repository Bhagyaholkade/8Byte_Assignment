import { formatCompactNumber } from '@/lib/utils';

interface SummaryCardsProps {
    summary: {
        totalInvested: number;
        totalCurrentValue: number;
        totalProfitLoss: number;
        totalProfitLossPercentage: number;
        totalStocks: number;
    };
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
    const isProfit = summary.totalProfitLoss >= 0;
    const profitColor = isProfit ? 'text-emerald-500' : 'text-red-500';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Invested */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="text-gray-500 font-semibold uppercase tracking-wide text-sm">Invested</span>
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-1">
                    {formatCompactNumber(summary.totalInvested)}
                </p>
                <p className="text-sm text-gray-500">{summary.totalStocks} holdings</p>
            </div>

            {/* Current Value */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <span className="text-gray-500 font-semibold uppercase tracking-wide text-sm">Current Value</span>
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-1">
                    {formatCompactNumber(summary.totalCurrentValue)}
                </p>
                <p className="text-sm text-gray-500">Market Value</p>
            </div>

            {/* Total P&L */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${isProfit ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} rounded-xl flex items-center justify-center shadow-md`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isProfit ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                        </svg>
                    </div>
                    <span className="text-gray-500 font-semibold uppercase tracking-wide text-sm">Total P&L</span>
                </div>
                <p className={`text-4xl font-bold ${profitColor} mb-1`}>
                    {isProfit ? '+' : '-'}₹{Math.abs(summary.totalProfitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500">{isProfit ? 'Total profit' : 'Total loss'}</p>
            </div>

            {/* Returns */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${isProfit ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} rounded-xl flex items-center justify-center shadow-md`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-gray-500 font-semibold uppercase tracking-wide text-sm">Returns</span>
                </div>
                <p className={`text-4xl font-bold ${profitColor} mb-1`}>
                    {isProfit ? '+' : ''}{summary.totalProfitLossPercentage.toFixed(2)}%
                </p>
                <p className="text-sm text-gray-500">{isProfit ? 'Overall return' : 'Overall loss'}</p>
            </div>
        </div>
    );
}
