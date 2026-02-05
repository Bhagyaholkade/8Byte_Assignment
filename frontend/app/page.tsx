'use client';

import { useEffect, useState } from 'react';
import { api, Stock } from '@/lib/api';
import StockCard from '@/components/StockCard';
import SummaryCards from '@/components/SummaryCards';
import PortfolioTable from '@/components/PortfolioTable';
import Analytics from '@/components/Analytics';

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'analytics'>('table');
  const [liveStatus, setLiveStatus] = useState<{
    yahooFinanceEnabled: boolean;
    stocksWithLiveData: number;
  } | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);

  // Auto-refresh every 15 seconds with countdown
  useEffect(() => {
    loadData();

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    // Data refresh interval
    const refreshInterval = setInterval(() => {
      if (backendAvailable) {
        loadData(true);
      }
    }, 15000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(refreshInterval);
    };
  }, [selectedSector, backendAvailable]);

  async function loadData(silent = false) {
    if (!silent) {
      setLoading(true);
    }
    setIsSyncing(true);
    setError(null);
    try {
      console.log('Loading data from API...');
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

      const [stocksData, summaryData, alertsData, sectorsData, liveStatusData] = await Promise.all([
        api.getStocks(selectedSector ? { sector: selectedSector } : undefined),
        api.getSummary(),
        api.getAlerts(),
        api.getSectors(),
        api.getLiveStatus().catch(() => null)
      ]);

      console.log('Stocks loaded:', stocksData?.length);
      console.log('Summary loaded:', summaryData);
      console.log('Alerts loaded:', alertsData);
      console.log('Sectors loaded:', sectorsData);

      setStocks(stocksData || []);
      setSummary(summaryData);
      setAlerts(alertsData);
      setSectors(sectorsData || []);
      setLiveStatus(liveStatusData);
      setLastUpdated(new Date());
      setCountdown(15);
      setBackendAvailable(true);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setBackendAvailable(false);
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setIsSyncing(false);
    }
  }

  const filteredStocks = stocks.filter(stock =>
    String(stock.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(stock.symbol || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show backend setup message if backend is not available
  if (!backendAvailable && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-blue-200">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-4xl">🚀</span>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Stock Portfolio Dashboard
              </h1>
              <p className="text-gray-600 font-medium">Frontend Successfully Deployed!</p>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">Backend Not Connected</h3>
                  <p className="text-yellow-700 mb-3">
                    The frontend is deployed successfully, but the backend API is not yet available.
                  </p>
                  <div className="bg-white/60 rounded-lg p-3 text-sm text-gray-700">
                    <p className="font-semibold mb-1">Current API URL:</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                <span>📋</span> Next Steps:
              </h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="font-semibold">Deploy your backend</p>
                    <p className="text-sm text-gray-600">Deploy the Node.js backend to Render, Railway, or any hosting service</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="font-semibold">Configure environment variable</p>
                    <p className="text-sm text-gray-600">Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> in Vercel Settings → Environment Variables</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="font-semibold">Redeploy</p>
                    <p className="text-sm text-gray-600">Trigger a new deployment in Vercel to apply the changes</p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => loadData()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                🔄 Retry Connection
              </button>
              <a
                href="https://vercel.com/docs/environment-variables"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:border-blue-400 transition-all"
              >
                📚 Docs
              </a>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Built with ❤️ using Next.js & Node.js
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b-2 border-gray-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-shrink-0">
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                💼 Financial Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1 font-medium">Portfolio Analytics & Insights</p>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search stocks by name or symbol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white/90 backdrop-blur-sm shadow-sm"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
              </div>
            </div>

            {/* Live Status Indicator */}
            <div className="flex items-center gap-4">
              {/* LIVE Badge with Time */}
              <div className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-4 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="font-bold text-gray-800">LIVE</span>
                </div>
                <span className="text-gray-600 font-mono">
                  {lastUpdated ? lastUpdated.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  }).toLowerCase() : '--:--:--'}
                </span>
              </div>

              {/* Syncing/Countdown Indicator */}
              <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-4 py-2 shadow-sm">
                {isSyncing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-blue-600 font-semibold">Syncing...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-gray-600 font-medium">Next sync in {countdown}s</span>
                  </>
                )}
              </div>

              {/* Manual Refresh Button */}
              <button
                onClick={() => loadData()}
                disabled={isSyncing}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-300 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">❌</span>
              <div>
                <h3 className="text-xl font-bold text-red-700">Error Loading Data</h3>
                <p className="text-red-600 mt-1">{error}</p>
                <p className="text-sm text-red-500 mt-2">
                  Make sure the backend server is running and NEXT_PUBLIC_API_URL is configured
                </p>
                <button
                  onClick={() => loadData()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-8 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-8 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-700 font-bold text-lg">Loading your portfolio...</p>
              <p className="text-gray-500 text-sm mt-2">Please wait</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && <SummaryCards summary={summary} />}

            {/* Alerts Section */}
            {alerts && (alerts.mustExit.length > 0 || alerts.stage2.length > 0) && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                      Portfolio Alerts
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Must Exit Section */}
                  {alerts.mustExit.length > 0 && (
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-100 via-orange-100 to-red-50 rounded-2xl blur-sm opacity-70"></div>
                      <div className="relative bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-red-300 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-red-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                              <span className="text-2xl">🚨</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-red-700">Must Exit</h3>
                              <p className="text-xs text-red-600 font-semibold">Immediate action required</p>
                            </div>
                          </div>
                          <div className="px-4 py-2 bg-red-500 text-white font-black rounded-full text-lg shadow-lg">
                            {alerts.mustExit.length}
                          </div>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                          {alerts.mustExit.map((stock: Stock, index: number) => (
                            <div
                              key={stock.id}
                              className="group/item p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 hover:border-red-400 hover:shadow-md transition-all cursor-pointer"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    <h4 className="font-bold text-gray-900 group-hover/item:text-red-700 transition-colors">
                                      {stock.name}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-gray-600 font-medium ml-4">
                                    {stock.symbol && (
                                      <span className="px-2 py-0.5 bg-white/60 rounded text-xs font-semibold mr-2">
                                        {stock.symbol}
                                      </span>
                                    )}
                                    {stock.notes}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs text-gray-500">Current</span>
                                  <span className="font-bold text-sm text-gray-900">
                                    ₹{Number(stock.currentPrice).toFixed(0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stage-2 Section */}
                  {alerts.stage2.length > 0 && (
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-emerald-100 to-green-50 rounded-2xl blur-sm opacity-70"></div>
                      <div className="relative bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-green-300 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-green-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-2xl">⭐</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-green-700">Stage-2 Stocks</h3>
                              <p className="text-xs text-green-600 font-semibold">Growth momentum detected</p>
                            </div>
                          </div>
                          <div className="px-4 py-2 bg-green-500 text-white font-black rounded-full text-lg shadow-lg">
                            {alerts.stage2.length}
                          </div>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                          {alerts.stage2.map((stock: Stock, index: number) => (
                            <div
                              key={stock.id}
                              className="group/item p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-400 hover:shadow-md transition-all cursor-pointer"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <h4 className="font-bold text-gray-900 group-hover/item:text-green-700 transition-colors">
                                      {stock.name}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-gray-600 font-medium ml-4">
                                    {stock.symbol && (
                                      <span className="px-2 py-0.5 bg-white/60 rounded text-xs font-semibold mr-2">
                                        {stock.symbol}
                                      </span>
                                    )}
                                    {stock.revenueGrowth3Y && (
                                      <span className="text-green-600 font-semibold">
                                        +{(stock.revenueGrowth3Y * 100).toFixed(1)}% growth
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs text-gray-500">Current</span>
                                  <span className="font-bold text-sm text-gray-900">
                                    ₹{Number(stock.currentPrice).toFixed(0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sector Filter & View Toggle */}
            <div className="mb-8 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-gray-200 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-black text-gray-800 text-lg">📊 Filter by Sector:</span>
                  <button
                    onClick={() => setSelectedSector('')}
                    className={`px-5 py-2.5 rounded-xl font-bold transition-all ${selectedSector === ''
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:shadow-md'
                      }`}
                  >
                    All Sectors
                  </button>
                  {sectors.map((sector) => (
                    <button
                      key={sector}
                      onClick={() => setSelectedSector(sector)}
                      className={`px-5 py-2.5 rounded-xl font-bold transition-all ${selectedSector === sector
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:shadow-md'
                        }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    📊 Table View
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${viewMode === 'cards'
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    🎴 Card View
                  </button>
                  <button
                    onClick={() => setViewMode('analytics')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${viewMode === 'analytics'
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    📈 Analytics View
                  </button>
                </div>
              </div>

              {/* Live Data Status */}
              <div className="text-sm text-gray-600 flex items-center gap-4 flex-wrap">
                {liveStatus && (
                  <div className="flex items-center gap-2">
                    {liveStatus.yahooFinanceEnabled ? (
                      <>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                          📡 Yahoo Finance Connected
                        </span>
                        <span className="text-xs text-gray-500">
                          ({liveStatus.stocksWithLiveData} stocks with live prices)
                        </span>
                      </>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold">
                        📊 Using Cached Data
                      </span>
                    )}
                  </div>
                )}
                <span className="text-xs text-gray-500">
                  Showing {stocks.length} stocks • {sectors.length} sectors
                </span>
              </div>
            </div>

            {/* Portfolio Table, Cards View, or Analytics */}
            {viewMode === 'analytics' ? (
              <Analytics stocks={stocks} summary={summary} />
            ) : viewMode === 'table' ? (
              <PortfolioTable
                stocks={filteredStocks}
                totalInvestment={summary?.totalInvested || 0}
              />
            ) : (
              <>
                {/* Stocks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStocks.map((stock) => (
                    <StockCard key={stock.id} stock={stock} />
                  ))}
                </div>
              </>
            )}

            {filteredStocks.length === 0 && stocks.length > 0 && (
              <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-gray-200">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-600 text-xl font-bold">No stocks found matching your criteria.</p>
                <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-gray-900 to-gray-800 border-t-2 border-gray-700 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-white font-bold text-lg mb-2">
            💼 Financial Dashboard
          </p>
          <p className="text-gray-400 text-sm">
            Built with ❤️ using Next.js & Node.js
          </p>
        </div>
      </footer>
    </div>
  );
}
