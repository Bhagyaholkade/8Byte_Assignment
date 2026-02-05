import { Stock } from '@/lib/api';
import { useMemo, useState, useEffect } from 'react';

interface PortfolioTableProps {
    stocks: Stock[];
    totalInvestment: number;
}

interface SectorGroup {
    sector: string;
    stocks: Stock[];
    totalInvested: number;
    totalCurrentValue: number;
    totalProfitLoss: number;
}

// Sector color mapping for left border
const getSectorBorderColor = (sector: string) => {
    const sectorLower = sector?.toLowerCase() || '';
    if (sectorLower.includes('consumer')) return 'border-l-orange-400';
    if (sectorLower.includes('financial')) return 'border-l-violet-400';
    if (sectorLower.includes('tech')) return 'border-l-blue-400';
    if (sectorLower.includes('power')) return 'border-l-amber-400';
    if (sectorLower.includes('pipe')) return 'border-l-pink-400';
    if (sectorLower.includes('other')) return 'border-l-slate-400';
    return 'border-l-slate-400';
};

// Sector badge color mapping
const getSectorStyle = (sector: string) => {
    const sectorLower = sector?.toLowerCase() || '';
    if (sectorLower.includes('consumer')) return 'bg-orange-50 text-orange-600 border border-orange-200';
    if (sectorLower.includes('financial')) return 'bg-violet-50 text-violet-600 border border-violet-200';
    if (sectorLower.includes('tech')) return 'bg-blue-50 text-blue-600 border border-blue-200';
    if (sectorLower.includes('power')) return 'bg-amber-50 text-amber-600 border border-amber-200';
    if (sectorLower.includes('pipe')) return 'bg-pink-50 text-pink-600 border border-pink-200';
    if (sectorLower.includes('other')) return 'bg-slate-50 text-slate-600 border border-slate-200';
    return 'bg-slate-50 text-slate-600 border border-slate-200';
};

export default function PortfolioTable({ stocks, totalInvestment }: PortfolioTableProps) {
    const [viewMode, setViewMode] = useState<'sector' | 'all'>('sector');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());

    // Initialize all sectors as expanded on mount
    useEffect(() => {
        const allSectors = new Set(stocks.map(s => s.sector || 'Others'));
        setExpandedSectors(allSectors);
    }, [stocks]);

    const toggleSector = (sector: string) => {
        setExpandedSectors(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sector)) {
                newSet.delete(sector);
            } else {
                newSet.add(sector);
            }
            return newSet;
        });
    };

    // Filter stocks by search
    const filteredStocks = useMemo(() => {
        if (!searchQuery) return stocks;
        const query = searchQuery.toLowerCase();
        return stocks.filter(stock =>
            stock.name?.toLowerCase().includes(query) ||
            stock.symbol?.toLowerCase().includes(query) ||
            stock.sector?.toLowerCase().includes(query)
        );
    }, [stocks, searchQuery]);

    // Sort stocks
    const sortedStocks = useMemo(() => {
        if (!sortConfig) return filteredStocks;

        return [...filteredStocks].sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortConfig.key) {
                case 'name':
                    aVal = a.name || '';
                    bVal = b.name || '';
                    break;
                case 'invested':
                    aVal = a.investedAmount || 0;
                    bVal = b.investedAmount || 0;
                    break;
                case 'weight':
                    aVal = (a.investedAmount || 0) / totalInvestment;
                    bVal = (b.investedAmount || 0) / totalInvestment;
                    break;
                case 'cmp':
                    aVal = a.currentPrice || 0;
                    bVal = b.currentPrice || 0;
                    break;
                case 'value':
                    aVal = a.totalValue || 0;
                    bVal = b.totalValue || 0;
                    break;
                case 'pnl':
                    aVal = a.profitLoss || 0;
                    bVal = b.profitLoss || 0;
                    break;
                case 'pe':
                    aVal = a.pe || 0;
                    bVal = b.pe || 0;
                    break;
                case 'eps':
                    aVal = a.liveData?.eps || a.eps || 0;
                    bVal = b.liveData?.eps || b.eps || 0;
                    break;
                default:
                    return 0;
            }

            if (typeof aVal === 'string') {
                return sortConfig.direction === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [filteredStocks, sortConfig, totalInvestment]);

    // Group stocks by sector
    const sectorGroups = useMemo(() => {
        const groups: { [key: string]: SectorGroup } = {};

        filteredStocks.forEach(stock => {
            const sector = stock.sector || 'Others';
            if (!groups[sector]) {
                groups[sector] = {
                    sector,
                    stocks: [],
                    totalInvested: 0,
                    totalCurrentValue: 0,
                    totalProfitLoss: 0
                };
            }
            groups[sector].stocks.push(stock);
            groups[sector].totalInvested += stock.investedAmount || 0;
            groups[sector].totalCurrentValue += stock.totalValue || 0;
            groups[sector].totalProfitLoss += stock.profitLoss || 0;
        });

        return Object.values(groups).sort((a, b) => a.sector.localeCompare(b.sector));
    }, [filteredStocks]);

    // Calculate grand totals
    const grandTotals = useMemo(() => ({
        invested: filteredStocks.reduce((sum, s) => sum + (s.investedAmount || 0), 0),
        currentValue: filteredStocks.reduce((sum, s) => sum + (s.totalValue || 0), 0),
        profitLoss: filteredStocks.reduce((sum, s) => sum + (s.profitLoss || 0), 0)
    }), [filteredStocks]);

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return current.direction === 'asc'
                    ? { key, direction: 'desc' }
                    : null;
            }
            return { key, direction: 'asc' };
        });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    // Format currency in Indian format
    const formatINR = (num: number) => {
        return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Render table header for All Stocks view
    const renderTableHeader = () => (
        <thead className="bg-slate-50/80">
            <tr>
                <th
                    className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('name')}
                >
                    Particulars {getSortIcon('name')}
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sector</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Buy Price</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                <th
                    className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('invested')}
                >
                    Invested {getSortIcon('invested')}
                </th>
                <th
                    className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('weight')}
                >
                    Weight {getSortIcon('weight')}
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Exch</th>
                <th
                    className="px-4 py-3 text-right text-[11px] font-semibold text-blue-600 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSort('cmp')}
                >
                    CMP {getSortIcon('cmp')}
                </th>
                <th
                    className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('value')}
                >
                    Value {getSortIcon('value')}
                </th>
                <th
                    className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('pnl')}
                >
                    P&L {getSortIcon('pnl')}
                </th>
                <th
                    className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('pe')}
                >
                    P/E {getSortIcon('pe')}
                </th>
                <th
                    className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('eps')}
                >
                    EPS {getSortIcon('eps')}
                </th>
            </tr>
        </thead>
    );

    // Render sector table header (without Sector column)
    const renderSectorTableHeader = () => (
        <thead className="bg-slate-50/80">
            <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Buy Price</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Invested</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Weight</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Exch</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-blue-600 uppercase tracking-wider">CMP</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">P&L</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">P/E</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">EPS</th>
            </tr>
        </thead>
    );

    // Render a single stock row for All Stocks view
    const renderStockRow = (stock: Stock) => {
        const stockProfit = (stock.profitLoss || 0) >= 0;
        const portfolioPercent = totalInvestment > 0 ? ((stock.investedAmount || 0) / totalInvestment) * 100 : 0;
        const isAlert = stock.notes?.toLowerCase().includes('exit');
        const isStage2 = stock.stage2 === 'Yes';
        const profitLossPercent = stock.profitLossPercentage || 0;

        return (
            <tr
                key={stock.id}
                className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
            >
                {/* Stock Name */}
                <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{stock.name}</span>
                        {isAlert && (
                            <span className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded-md text-xs">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </span>
                        )}
                        {isStage2 && !isAlert && (
                            <span className="w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-md text-xs">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </span>
                        )}
                    </div>
                </td>

                {/* Sector */}
                <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${getSectorStyle(stock.sector || 'Others')}`}>
                        {stock.sector || 'Others'}
                    </span>
                </td>

                {/* Buy Price */}
                <td className="px-4 py-4 text-slate-600 text-right text-sm">
                    {formatINR(stock.purchasePrice || 0)}
                </td>

                {/* Quantity */}
                <td className="px-4 py-4 text-slate-600 text-center text-sm">
                    {stock.quantity}
                </td>

                {/* Invested */}
                <td className="px-4 py-4 text-slate-800 text-right text-sm font-medium">
                    {formatINR(stock.investedAmount || 0)}
                </td>

                {/* Weight */}
                <td className="px-4 py-4 text-slate-500 text-right text-sm">
                    {portfolioPercent.toFixed(1)}%
                </td>

                {/* Exchange */}
                <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-md border border-blue-200">
                        {stock.exchange || 'NSE'}
                    </span>
                </td>

                {/* CMP */}
                <td className="px-4 py-4 text-right">
                    <span className="text-blue-600 font-semibold text-sm">
                        {formatINR(stock.currentPrice || 0)}
                    </span>
                </td>

                {/* Current Value */}
                <td className="px-4 py-4 text-slate-800 text-right text-sm font-medium">
                    {formatINR(stock.totalValue || 0)}
                </td>

                {/* P&L */}
                <td className={`px-4 py-4 text-right ${stockProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                    <div className="flex flex-col items-end">
                        <span className="font-semibold text-sm">
                            {stockProfit ? '' : '-'}{formatINR(Math.abs(stock.profitLoss || 0))}
                        </span>
                        <span className="text-xs opacity-80">
                            {stockProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%
                        </span>
                    </div>
                </td>

                {/* P/E */}
                <td className="px-4 py-4 text-slate-600 text-right text-sm">
                    {stock.pe ? Number(stock.pe).toFixed(2) : '—'}
                </td>

                {/* EPS */}
                <td className="px-4 py-4 text-slate-600 text-right text-sm">
                    {stock.liveData?.eps || stock.eps ? (
                        <span>{formatINR((stock.liveData?.eps || stock.eps) ?? 0)}</span>
                    ) : '—'}
                </td>
            </tr>
        );
    };

    // Render a single stock row for Sector view (without Sector column)
    const renderSectorStockRow = (stock: Stock) => {
        const stockProfit = (stock.profitLoss || 0) >= 0;
        const portfolioPercent = totalInvestment > 0 ? ((stock.investedAmount || 0) / totalInvestment) * 100 : 0;
        const isAlert = stock.notes?.toLowerCase().includes('exit');
        const isStage2 = stock.stage2 === 'Yes';
        const profitLossPercent = stock.profitLossPercentage || 0;

        return (
            <tr
                key={stock.id}
                className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-b-0"
            >
                {/* Stock Name */}
                <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{stock.name}</span>
                        {isAlert && (
                            <span className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded-md text-xs">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </span>
                        )}
                        {isStage2 && !isAlert && (
                            <span className="w-6 h-6 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-md text-xs">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </span>
                        )}
                    </div>
                </td>

                {/* Buy Price */}
                <td className="px-4 py-4 text-slate-600 text-right text-sm">
                    {formatINR(stock.purchasePrice || 0)}
                </td>

                {/* Quantity */}
                <td className="px-4 py-4 text-slate-600 text-center text-sm">
                    {stock.quantity}
                </td>

                {/* Invested */}
                <td className="px-4 py-4 text-slate-800 text-right text-sm font-medium">
                    {formatINR(stock.investedAmount || 0)}
                </td>

                {/* Weight */}
                <td className="px-4 py-4 text-slate-500 text-right text-sm">
                    {portfolioPercent.toFixed(1)}%
                </td>

                {/* Exchange */}
                <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-md border border-blue-200">
                        {stock.exchange || 'NSE'}
                    </span>
                </td>

                {/* CMP */}
                <td className="px-4 py-4 text-right">
                    <span className="text-blue-600 font-semibold text-sm">
                        {formatINR(stock.currentPrice || 0)}
                    </span>
                </td>

                {/* Current Value */}
                <td className="px-4 py-4 text-slate-800 text-right text-sm font-medium">
                    {formatINR(stock.totalValue || 0)}
                </td>

                {/* P&L */}
                <td className={`px-4 py-4 text-right ${stockProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                    <div className="flex flex-col items-end">
                        <span className="font-semibold text-sm">
                            {stockProfit ? '' : '-'}{formatINR(Math.abs(stock.profitLoss || 0))}
                        </span>
                        <span className="text-xs opacity-80">
                            {stockProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%
                        </span>
                    </div>
                </td>

                {/* P/E */}
                <td className="px-4 py-4 text-slate-600 text-right text-sm">
                    {stock.pe ? Number(stock.pe).toFixed(2) : '—'}
                </td>

                {/* EPS */}
                <td className="px-4 py-4 text-slate-600 text-right text-sm">
                    {stock.liveData?.eps || stock.eps ? (
                        <span>{formatINR((stock.liveData?.eps || stock.eps) ?? 0)}</span>
                    ) : '—'}
                </td>
            </tr>
        );
    };

    return (
        <div className="space-y-4">
            {/* Search and View Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search stocks, sectors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-slate-100 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('sector')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'sector'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            By Sector
                        </button>
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'all'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            All Stocks
                        </button>
                    </div>
                </div>
            </div>

            {/* All Stocks View */}
            {viewMode === 'all' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            {renderTableHeader()}
                            <tbody>
                                {sortedStocks.map((stock) => renderStockRow(stock))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sector View */}
            {viewMode === 'sector' && (
                <div className="space-y-4">
                    {sectorGroups.map((group) => {
                        const isProfit = group.totalProfitLoss >= 0;
                        const isExpanded = expandedSectors.has(group.sector);

                        return (
                            <div
                                key={group.sector}
                                className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-4 ${getSectorBorderColor(group.sector)}`}
                            >
                                {/* Sector Header - Collapsible */}
                                <div
                                    className="px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                    onClick={() => toggleSector(group.sector)}
                                >
                                    <div className="flex items-center justify-between">
                                        {/* Left side - Sector name and toggle */}
                                        <div className="flex items-center gap-3">
                                            <svg
                                                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-800">
                                                    {group.sector}
                                                </h3>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {group.stocks.length} {group.stocks.length === 1 ? 'holding' : 'holdings'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right side - Summary stats */}
                                        <div className="flex items-center gap-10">
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Invested</p>
                                                <p className="text-sm font-bold text-slate-700 mt-0.5">
                                                    {formatINR(group.totalInvested)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Current</p>
                                                <p className="text-sm font-bold text-slate-700 mt-0.5">
                                                    {formatINR(group.totalCurrentValue)}
                                                </p>
                                            </div>
                                            <div className="text-right min-w-[100px]">
                                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">P&L</p>
                                                <p className={`text-sm font-bold mt-0.5 ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {isProfit ? '' : '-'}{formatINR(Math.abs(group.totalProfitLoss))}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sector Table - Collapsible content */}
                                {isExpanded && (
                                    <div className="overflow-x-auto border-t border-slate-100">
                                        <table className="w-full">
                                            {renderSectorTableHeader()}
                                            <tbody>
                                                {group.stocks.map((stock) => renderSectorStockRow(stock))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Grand Total Footer */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Portfolio Total</h3>
                        <p className="text-slate-400 text-sm mt-1">{filteredStocks.length} stocks across {sectorGroups.length} sectors</p>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Total Invested</p>
                            <p className="text-xl font-bold text-white mt-1">{formatINR(grandTotals.invested)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Current Value</p>
                            <p className="text-xl font-bold text-white mt-1">{formatINR(grandTotals.currentValue)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Total P&L</p>
                            <p className={`text-xl font-bold mt-1 ${grandTotals.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {grandTotals.profitLoss >= 0 ? '+' : '-'}{formatINR(Math.abs(grandTotals.profitLoss))}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Data Indicator */}
            <div className="flex items-center justify-center gap-2 py-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-slate-400">Live data • Updates every 15 seconds</span>
            </div>
        </div>
    );
}
