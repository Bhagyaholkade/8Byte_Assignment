import { Stock } from '@/lib/api';
import { formatCurrency, formatPercentage, getColorForProfitLoss } from '@/lib/utils';

interface StockCardProps {
    stock: Stock;
    onClick?: () => void;
}

export default function StockCard({ stock, onClick }: StockCardProps) {
    const profitLossColor = getColorForProfitLoss(stock.profitLoss);
    const isAlert = stock.notes?.toLowerCase().includes('exit');
    const isStage2 = stock.stage2 === 'Yes';

    return (
        <div
            onClick={onClick}
            className={`
        group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
        hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-2
        ${isAlert
                    ? 'border-red-400 bg-gradient-to-br from-red-50 via-orange-50 to-red-50'
                    : isStage2
                        ? 'border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50'
                        : 'border-gray-200 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30'
                }
        backdrop-blur-sm
      `}
        >
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl pointer-events-none"></div>

            {/* Alert Badge */}
            {isAlert && (
                <div className="absolute -top-2 -right-2 px-4 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                    ⚠️ ALERT
                </div>
            )}

            {/* Stage-2 Badge */}
            {isStage2 && !isAlert && (
                <div className="absolute -top-2 -right-2 px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                    ⭐ STAGE-2
                </div>
            )}

            <div className="relative z-10">
                {/* Stock Name & Symbol */}
                <div className="mb-4">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                        {stock.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-gray-500 px-2 py-0.5 bg-gray-100 rounded-md">
                            {stock.symbol || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-400">#{stock.originalId || stock.id}</span>
                    </div>
                </div>

                {/* Current Price - Large and prominent */}
                <div className="mb-5 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Price</p>
                        {stock.liveData ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Live
                            </span>
                        ) : (
                            <span className="text-xs text-gray-400">Cached</span>
                        )}
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(stock.currentPrice)}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">Qty: {stock.quantity}</p>
                        {stock.liveData && stock.liveData.change !== undefined && (
                            <p className={`text-xs font-semibold ${stock.liveData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stock.liveData.change >= 0 ? '↑' : '↓'} {Math.abs(stock.liveData.changePercent || 0).toFixed(2)}%
                            </p>
                        )}
                    </div>
                </div>

                {/* Profit/Loss - Highlighted */}
                <div className={`mb-5 p-4 rounded-xl border-2 ${stock.profitLoss >= 0
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                        : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                    }`}>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Profit/Loss</span>
                        <span className={`text-2xl font-bold ${profitLossColor}`}>
                            {formatCurrency(stock.profitLoss)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">Return</span>
                        <span className={`text-lg font-bold ${profitLossColor}`}>
                            {formatPercentage(stock.profitLossPercentage / 100)}
                        </span>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
                        <p className="text-xs text-gray-500 mb-1">Invested</p>
                        <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(stock.investedAmount)}
                        </p>
                    </div>
                    <div className="p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
                        <p className="text-xs text-gray-500 mb-1">Current Value</p>
                        <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(stock.totalValue)}
                        </p>
                    </div>
                    <div className="p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
                        <p className="text-xs text-gray-500 mb-1">P/E Ratio</p>
                        <p className="text-sm font-bold text-gray-900">
                            {stock.pe ? Number(stock.pe).toFixed(2) : '—'}
                        </p>
                    </div>
                    <div className="p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200/50">
                        <p className="text-xs text-gray-500 mb-1">P/B Ratio</p>
                        <p className="text-sm font-bold text-gray-900">
                            {stock.pb ? Number(stock.pb).toFixed(2) : '—'}
                        </p>
                    </div>
                </div>

                {/* Growth Indicators */}
                {stock.revenueGrowth3Y && (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50">
                        <p className="text-xs font-semibold text-gray-600 mb-2">3Y Growth</p>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Revenue:</span>
                            <span className="font-bold text-blue-600">
                                {formatPercentage(stock.revenueGrowth3Y)}
                            </span>
                        </div>
                        {stock.profitGrowth3Y && (
                            <div className="flex justify-between text-xs mt-1">
                                <span className="text-gray-600">Profit:</span>
                                <span className="font-bold text-purple-600">
                                    {formatPercentage(stock.profitGrowth3Y)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Notes */}
                {stock.notes && (
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-red-300">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center gap-2">
                            <span className="text-base">📌</span>
                            {stock.notes}
                        </p>
                    </div>
                )}
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-300 pointer-events-none"></div>
        </div>
    );
}
