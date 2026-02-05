'use client';

import { Stock } from '@/lib/api';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';
import {
    PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface AnalyticsProps {
    stocks: Stock[];
    summary: any;
}

export default function Analytics({ stocks, summary }: AnalyticsProps) {
    // Count stocks with live data
    const stocksWithLiveData = stocks.filter(s => s.liveData).length;
    const hasLiveData = stocksWithLiveData > 0;

    // Calculate sector allocation
    const sectorData = stocks.reduce((acc: any[], stock) => {
        const sectorName = stock.sector?.replace(' Sector', '') || 'Other';
        const existing = acc.find(s => s.name === sectorName);

        if (existing) {
            existing.value += stock.investedAmount;
            existing.currentValue += stock.totalValue;
            existing.stocks += 1;
            existing.profitLoss += stock.profitLoss;
            if (stock.liveData) existing.liveCount++;
        } else {
            acc.push({
                name: sectorName,
                value: stock.investedAmount,
                currentValue: stock.totalValue,
                stocks: 1,
                profitLoss: stock.profitLoss,
                liveCount: stock.liveData ? 1 : 0
            });
        }

        return acc;
    }, []);

    // Sort and get top 10 gainers
    const topGainers = [...stocks]
        .filter(s => s.profitLoss > 0)
        .sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
        .slice(0, 10)
        .map(s => ({
            name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
            fullName: s.name,
            gain: s.profitLossPercentage,
            amount: s.profitLoss,
            isLive: !!s.liveData,
            dayChange: s.liveData?.changePercent || 0
        }));

    // Sort and get top 10 losers
    const topLosers = [...stocks]
        .filter(s => s.profitLoss < 0)
        .sort((a, b) => a.profitLossPercentage - b.profitLossPercentage)
        .slice(0, 10)
        .map(s => ({
            name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
            fullName: s.name,
            loss: Math.abs(s.profitLossPercentage),
            amount: Math.abs(s.profitLoss),
            isLive: !!s.liveData,
            dayChange: s.liveData?.changePercent || 0
        }));

    // Portfolio composition by investment
    const portfolioComposition = [...stocks]
        .sort((a, b) => b.investedAmount - a.investedAmount)
        .slice(0, 10)
        .map(s => ({
            name: s.name.length > 12 ? s.name.substring(0, 12) + '...' : s.name,
            fullName: s.name,
            invested: s.investedAmount,
            current: s.totalValue,
            isLive: !!s.liveData
        }));

    // Sector performance
    const sectorPerformance = sectorData.map(sector => ({
        name: sector.name,
        invested: sector.value,
        current: sector.currentValue,
        gain: sector.currentValue - sector.value,
        gainPercent: ((sector.currentValue - sector.value) / sector.value * 100).toFixed(2),
        stockCount: sector.stocks,
        liveCount: sector.liveCount
    }));

    // Live market movers (stocks with biggest day changes)
    const marketMovers = [...stocks]
        .filter(s => s.liveData && s.liveData.changePercent !== undefined)
        .sort((a, b) => Math.abs(b.liveData!.changePercent) - Math.abs(a.liveData!.changePercent))
        .slice(0, 8)
        .map(s => ({
            name: s.name.length > 12 ? s.name.substring(0, 12) + '...' : s.name,
            fullName: s.name,
            symbol: s.symbol,
            price: s.currentPrice,
            change: s.liveData!.change,
            changePercent: s.liveData!.changePercent,
            volume: s.liveData!.volume
        }));

    // Colors for charts
    const COLORS = [
        '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
        '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border-2 border-gray-200">
                    <p className="font-bold text-gray-900">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
                            {entry.name}: ₹{entry.value?.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Section Header with Live Status */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-white flex items-center gap-3">
                            📈 Portfolio Analytics
                        </h2>
                        <p className="text-blue-100 mt-2">Real-time data visualization and insights</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {hasLiveData ? (
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                                <span className="text-white font-bold">
                                    {stocksWithLiveData}/{stocks.length} Live
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                                <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                                <span className="text-white font-bold">Cached Data</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Live Market Movers - Only show if we have live data */}
            {marketMovers.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
                    <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        🔥 Today's Market Movers
                        <span className="text-sm font-normal text-gray-500">(Live)</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {marketMovers.map((stock, index) => {
                            const isPositive = stock.changePercent >= 0;
                            return (
                                <div
                                    key={index}
                                    className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                                        isPositive
                                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                                            : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase">
                                            {stock.symbol}
                                        </span>
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm truncate" title={stock.fullName}>
                                        {stock.name}
                                    </p>
                                    <p className="text-lg font-black text-gray-900 mt-1">
                                        ₹{stock.price.toLocaleString()}
                                    </p>
                                    <div className={`flex items-center gap-1 mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        <span className="text-lg">{isPositive ? '↑' : '↓'}</span>
                                        <span className="font-bold">
                                            {Math.abs(stock.changePercent).toFixed(2)}%
                                        </span>
                                        <span className="text-xs">
                                            ({isPositive ? '+' : ''}₹{stock.change?.toFixed(2)})
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Portfolio Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl">
                    <p className="text-blue-100 text-sm font-semibold">Total Invested</p>
                    <p className="text-2xl font-black mt-2">{formatCompactNumber(summary?.totalInvested)}</p>
                    <p className="text-blue-200 text-xs mt-1">{stocks.length} stocks</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl">
                    <p className="text-purple-100 text-sm font-semibold">Current Value</p>
                    <p className="text-2xl font-black mt-2">{formatCompactNumber(summary?.totalCurrentValue)}</p>
                    {hasLiveData && (
                        <p className="text-purple-200 text-xs mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                            Live
                        </p>
                    )}
                </div>
                <div className={`rounded-2xl p-5 text-white shadow-xl ${
                    summary?.totalProfitLoss >= 0
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                        : 'bg-gradient-to-br from-red-500 to-orange-600'
                }`}>
                    <p className="text-white/80 text-sm font-semibold">Total P&L</p>
                    <p className="text-2xl font-black mt-2">{formatCompactNumber(summary?.totalProfitLoss)}</p>
                    <p className="text-white/80 text-xs mt-1">
                        {summary?.totalProfitLossPercentage?.toFixed(2)}%
                    </p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-xl">
                    <p className="text-orange-100 text-sm font-semibold">Win Rate</p>
                    <p className="text-2xl font-black mt-2">
                        {((stocks.filter(s => s.profitLoss > 0).length / stocks.length) * 100).toFixed(1)}%
                    </p>
                    <p className="text-orange-200 text-xs mt-1">
                        {stocks.filter(s => s.profitLoss > 0).length} profitable
                    </p>
                </div>
            </div>

            {/* Grid Layout for Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Sector Allocation Pie Chart */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
                    <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                        🥧 Sector Allocation
                        <span className="text-sm font-normal text-gray-500">(by Investment)</span>
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={sectorData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {sectorData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {sectorData.map((sector, index) => (
                            <div key={sector.name} className="flex items-center gap-2 text-sm">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                ></div>
                                <span className="text-gray-700 font-semibold">{sector.name}</span>
                                <span className="text-gray-500">({sector.stocks})</span>
                                {sector.liveCount > 0 && (
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top 10 Holdings */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
                    <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                        💼 Top 10 Holdings
                        <span className="text-sm font-normal text-gray-500">(by Investment)</span>
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={portfolioComposition} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="invested" fill="#3b82f6" name="Invested" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="current" fill="#10b981" name="Current Value" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Gainers */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
                    <h3 className="text-xl font-black text-green-700 mb-4 flex items-center gap-2">
                        📈 Top 10 Gainers
                        <span className="text-sm font-normal text-gray-500">(by %)</span>
                        {topGainers.some(g => g.isLive) && (
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></span>
                        )}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topGainers}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={10} />
                            <YAxis tickFormatter={(value) => `${value}%`} />
                            <Tooltip
                                formatter={(value: any, name: string) => [
                                    `${value.toFixed(2)}%`,
                                    name === 'gain' ? 'Total Gain' : 'Day Change'
                                ]}
                                contentStyle={{ backgroundColor: '#f0fdf4', border: '2px solid #10b981' }}
                            />
                            <Bar dataKey="gain" fill="#10b981" name="gain" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Losers */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
                    <h3 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                        📉 Top 10 Losers
                        <span className="text-sm font-normal text-gray-500">(by %)</span>
                        {topLosers.some(l => l.isLive) && (
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></span>
                        )}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topLosers}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={10} />
                            <YAxis tickFormatter={(value) => `${value}%`} />
                            <Tooltip
                                formatter={(value: any) => [`${value.toFixed(2)}%`, 'Loss %']}
                                contentStyle={{ backgroundColor: '#fef2f2', border: '2px solid #ef4444' }}
                            />
                            <Bar dataKey="loss" fill="#ef4444" name="loss" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Sector Performance */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6 lg:col-span-2">
                    <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                        📊 Sector Performance Comparison
                        {sectorPerformance.some(s => s.liveCount > 0) && (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-normal">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Live Data
                            </span>
                        )}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={sectorPerformance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="invested" fill="#3b82f6" name="Invested Amount" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="current" fill="#10b981" name="Current Value" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="gain" fill="#f59e0b" name="Gain/Loss" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Sector Performance Table */}
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-bold text-gray-700">Sector</th>
                                    <th className="px-4 py-2 text-center font-bold text-gray-700">Stocks</th>
                                    <th className="px-4 py-2 text-right font-bold text-gray-700">Invested</th>
                                    <th className="px-4 py-2 text-right font-bold text-gray-700">Current</th>
                                    <th className="px-4 py-2 text-right font-bold text-gray-700">Gain/Loss</th>
                                    <th className="px-4 py-2 text-right font-bold text-gray-700">Return %</th>
                                    <th className="px-4 py-2 text-center font-bold text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sectorPerformance.map((sector) => {
                                    const isProfit = sector.gain >= 0;
                                    return (
                                        <tr key={sector.name} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 font-semibold text-gray-900">{sector.name}</td>
                                            <td className="px-4 py-2 text-center text-gray-700">{sector.stockCount}</td>
                                            <td className="px-4 py-2 text-right text-gray-700">
                                                ₹{sector.invested.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-right text-gray-700">
                                                ₹{sector.current.toLocaleString()}
                                            </td>
                                            <td className={`px-4 py-2 text-right font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                                {isProfit ? '↗' : '↘'} ₹{Math.abs(sector.gain).toLocaleString()}
                                            </td>
                                            <td className={`px-4 py-2 text-right font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                                {sector.gainPercent}%
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                {sector.liveCount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                        {sector.liveCount} Live
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                                                        Cached
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Portfolio Summary Stats */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 shadow-xl p-6 lg:col-span-2">
                    <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                        📊 Quick Stats
                        {hasLiveData && (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-normal ml-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                {stocksWithLiveData} stocks with live data
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-xl p-4 shadow-md">
                            <p className="text-sm text-gray-600 mb-1">Total Stocks</p>
                            <p className="text-2xl font-black text-blue-600">{stocks.length}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-md">
                            <p className="text-sm text-gray-600 mb-1">Profitable</p>
                            <p className="text-2xl font-black text-green-600">
                                {stocks.filter(s => s.profitLoss > 0).length}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-md">
                            <p className="text-sm text-gray-600 mb-1">Loss-Making</p>
                            <p className="text-2xl font-black text-red-600">
                                {stocks.filter(s => s.profitLoss < 0).length}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-md">
                            <p className="text-sm text-gray-600 mb-1">Sectors</p>
                            <p className="text-2xl font-black text-purple-600">{sectorData.length}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-md">
                            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                                Live Data
                                {hasLiveData && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
                            </p>
                            <p className="text-2xl font-black text-green-600">{stocksWithLiveData}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
