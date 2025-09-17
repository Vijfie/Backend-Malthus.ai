import React, { useState, useMemo } from 'react';
import { TrendingUp, Clock, CheckCircle, BarChart3, Zap, AlertCircle, Activity, Volume2, DollarSign, Building2, Target, Percent, Shield, Coins, Globe, TrendingDown, Users } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  displayDate?: string;
  index?: number;
  sma20?: number | null;
  sma50?: number | null;
  ema12?: number | null;
}

interface StockFundamentals {
  type: 'stock';
  marketCap: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  debtToEquity: number;
  revenueGrowthYoY: number;
  revenueGrowthQoQ: number;
  earningsGrowthYoY: number;
  earningsGrowthQoQ: number;
  bookValue: number;
  roe: number;
  grossMargin?: number;
  operatingMargin?: number;
  beta?: number;
}

interface CryptoFundamentals {
  type: 'crypto';
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  maxSupply: number | string;
  totalSupply: number;
  marketDominance: number;
  priceChange7d: string;
  priceChange30d: string;
  allTimeHigh: number;
  allTimeLow: number;
  athDistance: string;
  volatility: string;
  liquidityScore: string;
  hodlerRatio: string;
  exchangeInflow?: {
    inflow: string;
    outflow: string;
    netFlow: string;
    trend: string;
  };
  whaleActivity?: {
    largeTransactions: number;
    whaleNetFlow: string;
    topHoldersPercent: string;
    activity: string;
  };
  networkHealth?: {
    hashRate: string;
    networkGrowth: string;
    activeAddresses: number;
    transactionCount: number;
  };
}

type FundamentalData = StockFundamentals | CryptoFundamentals;

interface SentimentData {
  distribution: { positive: number; neutral: number; negative: number };
  overall: string;
  score: number;
  articles: Array<{
    headline: string;
    summary: string;
    source: string;
    sentiment: string;
    publishedAt: string;
    impact: 'high' | 'medium' | 'low';
    url?: string;
  }>;
}

interface AnalysisData {
  symbol: string;
  company: string;
  currentPrice: number;
  chartData: ChartData[];
  fundamentals: FundamentalData;
  sentiment: SentimentData;
  assetType: string;
  sector: string;
  priceChange: number;
  priceChangePercent: number;
  dataSource: string;
  timestamp: string;
}

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'fundamentals'>('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y'>('1Y');

  const filteredChartData = useMemo(() => {
    if (!analysis?.chartData) return [];
    const ranges = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    return analysis.chartData.slice(-ranges[selectedTimeRange]);
  }, [analysis?.chartData, selectedTimeRange]);

  const analyzeStock = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: input.trim().toUpperCase() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze symbol');
      }

      const data = await response.json();
      const processedData: AnalysisData = {
        ...data,
        chartData: data.chartData?.map((item: any, index: number) => ({
          ...item,
          displayDate: new Date(item.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          open: parseFloat(item.open?.toString() || '0'),
          high: parseFloat(item.high?.toString() || '0'),
          low: parseFloat(item.low?.toString() || '0'),
          close: parseFloat(item.close?.toString() || '0'),
          volume: parseInt(item.volume?.toString() || '0'),
          index,
          sma20: item.sma20,
          sma50: item.sma50,
          ema12: item.ema12
        })) || []
      };
      
      setAnalysis(processedData);
      setInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze symbol');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}T`;
    if (value >= 1) return `${value.toFixed(1)}B`;
    return `${(value * 1000).toFixed(0)}M`;
  };

  const formatPercent = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const renderStockFundamentals = (fundamentals: StockFundamentals) => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Market Cap', value: formatCurrency(fundamentals.marketCap), icon: DollarSign, color: 'blue' },
          { label: 'P/E Ratio', value: fundamentals.peRatio.toFixed(1), icon: Target, color: 'green' },
          { label: 'EPS', value: `$${fundamentals.eps.toFixed(2)}`, icon: Percent, color: 'yellow' },
          { label: 'Dividend Yield', value: `${fundamentals.dividendYield.toFixed(2)}%`, icon: Percent, color: 'purple' }
        ].map((metric, i) => (
          <div key={i} className={`bg-gradient-to-br from-${metric.color}-50 to-${metric.color}-100 p-6 rounded-2xl border border-${metric.color}-200`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 bg-${metric.color}-500 rounded-xl flex items-center justify-center`}>
                <metric.icon size={20} className="text-white" />
              </div>
              <h4 className="text-gray-800 font-semibold">{metric.label}</h4>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { title: 'Revenue Growth', icon: TrendingUp, data: [
            { label: 'Year over Year', value: fundamentals.revenueGrowthYoY },
            { label: 'Quarter over Quarter', value: fundamentals.revenueGrowthQoQ }
          ]},
          { title: 'Earnings Growth', icon: BarChart3, data: [
            { label: 'Year over Year', value: fundamentals.earningsGrowthYoY },
            { label: 'Quarter over Quarter', value: fundamentals.earningsGrowthQoQ }
          ]}
        ].map((section, i) => (
          <div key={i} className="bg-gray-50 p-6 rounded-2xl">
            <h4 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <section.icon size={20} className={i === 0 ? 'text-green-500' : 'text-blue-500'} />
              {section.title}
            </h4>
            <div className="space-y-4">
              {section.data.map((item, j) => (
                <div key={j} className="flex justify-between items-center">
                  <span className="text-gray-600">{item.label}:</span>
                  <span className={`font-bold text-lg ${item.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatPercent(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderCryptoFundamentals = (fundamentals: CryptoFundamentals) => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Market Cap', value: formatCurrency(fundamentals.marketCap), icon: DollarSign, color: 'blue' },
          { label: '24h Volume', value: `${fundamentals.volume24h.toFixed(0)}M`, icon: Activity, color: 'green' },
          { label: 'Market Dominance', value: `${fundamentals.marketDominance.toFixed(1)}%`, icon: Globe, color: 'purple' },
          { label: 'Circulating Supply', value: formatLargeNumber(fundamentals.circulatingSupply), icon: Coins, color: 'yellow' }
        ].map((metric, i) => (
          <div key={i} className={`bg-gradient-to-br from-${metric.color}-50 to-${metric.color}-100 p-6 rounded-2xl border border-${metric.color}-200`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 bg-${metric.color}-500 rounded-xl flex items-center justify-center`}>
                <metric.icon size={20} className="text-white" />
              </div>
              <h4 className="text-gray-800 font-semibold">{metric.label}</h4>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
          <h4 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
            <Target size={20} className="text-blue-600" />
            Supply Metrics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-blue-700">Max Supply:</span>
              <span className="font-bold text-blue-900">
                {typeof fundamentals.maxSupply === 'string' ? fundamentals.maxSupply : formatLargeNumber(fundamentals.maxSupply)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Total Supply:</span>
              <span className="font-bold text-blue-900">{formatLargeNumber(fundamentals.totalSupply)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">HODL Ratio:</span>
              <span className="font-bold text-blue-900">{fundamentals.hodlerRatio}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
          <h4 className="text-lg font-semibold mb-4 text-green-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" />
            Price Performance
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-green-700">7D Change:</span>
              <span className={`font-bold ${parseFloat(fundamentals.priceChange7d) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(fundamentals.priceChange7d)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">30D Change:</span>
              <span className={`font-bold ${parseFloat(fundamentals.priceChange30d) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(fundamentals.priceChange30d)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">ATH Distance:</span>
              <span className="font-bold text-red-600">-{fundamentals.athDistance}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
          <h4 className="text-lg font-semibold mb-4 text-purple-800 flex items-center gap-2">
            <Shield size={20} className="text-purple-600" />
            Risk Metrics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-purple-700">Volatility:</span>
              <span className="font-bold text-purple-900">{fundamentals.volatility}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Liquidity Score:</span>
              <span className="font-bold text-purple-900">{fundamentals.liquidityScore}/10</span>
            </div>
            {fundamentals.whaleActivity && (
              <div className="flex justify-between">
                <span className="text-purple-700">Whale Activity:</span>
                <span className={`font-bold capitalize ${
                  fundamentals.whaleActivity.activity === 'high' ? 'text-red-600' : 
                  fundamentals.whaleActivity.activity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {fundamentals.whaleActivity.activity}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {fundamentals.networkHealth && (
        <div className="bg-gray-50 p-6 rounded-2xl">
          <h4 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Activity size={20} className="text-indigo-500" />
            Network Health
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{fundamentals.networkHealth.hashRate}</div>
              <div className="text-sm text-gray-600">Hash Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatPercent(fundamentals.networkHealth.networkGrowth)}</div>
              <div className="text-sm text-gray-600">Network Growth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatLargeNumber(fundamentals.networkHealth.activeAddresses)}</div>
              <div className="text-sm text-gray-600">Active Addresses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatLargeNumber(fundamentals.networkHealth.transactionCount)}</div>
              <div className="text-sm text-gray-600">Daily Transactions</div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">TradingAI Pro</h1>
                <p className="text-sm text-gray-500">Advanced Financial Analysis Platform</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50 transition-colors">Login</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">Start Free</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent mb-4">AI Analysis Engine</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Get professional analyses for stocks and crypto within seconds. Powered by real-time data and advanced AI.</p>

          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-left">Enter Symbol</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && analyzeStock()}
                  placeholder="e.g. AAPL, BTC"
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg font-mono uppercase"
                />
                <button
                  onClick={analyzeStock}
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all"
                >
                  {loading ? <><Clock className="w-5 h-5 animate-spin" />Analyzing...</> : <><Zap className="w-5 h-5" />Analyze</>}
                </button>
              </div>
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {analysis && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-green-500 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{analysis.company}</h2>
                    <p className="text-blue-100">{analysis.symbol} • {analysis.sector}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">${analysis.currentPrice?.toFixed(2)}</div>
                    <div className={`flex items-center gap-2 mt-1 ${analysis.priceChangePercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      <span className="text-sm">{formatPercent(analysis.priceChangePercent)}</span>
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Live Data</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'overview', label: 'Overview & Technical Analysis', icon: BarChart3 },
                  { id: 'fundamentals', label: 'Fundamentals', icon: Building2 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                      activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <tab.icon size={20} />
                      {tab.label}
                    </div>
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && analysis.chartData?.length > 0 && (
                <div className="p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Price & Technical Analysis</h3>
                      <p className="text-gray-600 text-lg">Interactive charts • {analysis.chartData.length} data points</p>
                    </div>
                    <div className="flex bg-gray-100 rounded-xl p-1 mt-4 sm:mt-0">
                      {(['1D', '1W', '1M', '3M', '6M', '1Y'] as const).map(range => (
                        <button
                          key={range}
                          onClick={() => setSelectedTimeRange(range)}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                            selectedTimeRange === range ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600 hover:bg-white'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="h-96 border-2 border-gray-200 rounded-xl p-4 bg-gray-50 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={filteredChartData}>
                        <XAxis dataKey="displayDate" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} tickFormatter={v => `$${v.toFixed(2)}`} />
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.[0]) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 border-2 border-blue-500 rounded-xl shadow-lg">
                              <p className="font-bold mb-2">Date: {data.displayDate}</p>
                              <div className="text-sm space-y-1">
                                <div>Open: ${data.open?.toFixed(2)}</div>
                                <div>High: ${data.high?.toFixed(2)}</div>
                                <div>Low: ${data.low?.toFixed(2)}</div>
                                <div>Close: ${data.close?.toFixed(2)}</div>
                                <div>Volume: {data.volume?.toLocaleString()}</div>
                              </div>
                            </div>
                          );
                        }} />
                        <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={3} dot={false} />
                        {selectedTimeRange !== '1D' && <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" />}
                        {!['1D', '1W'].includes(selectedTimeRange) && <Line type="monotone" dataKey="sma50" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" />}
                        <Line type="monotone" dataKey="ema12" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'fundamentals' && analysis.fundamentals && (
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-gray-800">
                    {analysis.fundamentals.type === 'crypto' ? 'Crypto Fundamentals' : 'Stock Fundamentals'}
                  </h3>
                  
                  {analysis.fundamentals.type === 'crypto' 
                    ? renderCryptoFundamentals(analysis.fundamentals)
                    : renderStockFundamentals(analysis.fundamentals)
                  }
                </div>
              )}
            </div>

            {analysis.sentiment && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">AI Sentiment Analysis</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className={`p-6 rounded-2xl border-2 ${
                    analysis.sentiment.overall === 'positive' ? 'bg-green-50 border-green-300' : 
                    analysis.sentiment.overall === 'negative' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="mb-4">
                      <span className="text-sm font-semibold">Overall Sentiment</span>
                      <div className={`inline-block ml-3 px-3 py-1 rounded-full text-xs font-bold uppercase text-white ${
                        analysis.sentiment.overall === 'positive' ? 'bg-green-500' : 
                        analysis.sentiment.overall === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                      }`}>
                        {analysis.sentiment.overall}
                      </div>
                    </div>
                    <div className={`text-3xl font-bold ${
                      analysis.sentiment.overall === 'positive' ? 'text-green-600' : 
                      analysis.sentiment.overall === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {analysis.sentiment.score.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Sentiment Score (-100 to +100)</div>
                  </div>

                  <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200">
                    <div className="text-sm font-semibold mb-4">Sentiment Distribution</div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            dataKey="value"
                            data={[
                              { name: 'Positive', value: analysis.sentiment.distribution.positive, fill: '#10b981' },
                              { name: 'Neutral', value: analysis.sentiment.distribution.neutral, fill: '#6b7280' },
                              { name: 'Negative', value: analysis.sentiment.distribution.negative, fill: '#ef4444' }
                            ]}
                            cx="50%" cy="50%" innerRadius={30} outerRadius={70} paddingAngle={2}
                          >
                            {[
                              { fill: '#10b981' }, { fill: '#6b7280' }, { fill: '#ef4444' }
                            ].map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string) => [`${value} articles`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-semibold mb-5 text-gray-800">Latest Headlines ({analysis.sentiment.articles.length} sources)</h4>
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {analysis.sentiment.articles.slice(0, 10).map((article, index) => (
                      <div 
                        key={index} 
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                          article.sentiment === 'positive' ? 'bg-green-50 border-green-200' : 
                          article.sentiment === 'negative' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => window.open(article.url || `https://www.google.com/search?q=${encodeURIComponent(article.headline)}`, '_blank')}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold text-gray-800 leading-tight pr-4">{article.headline}</h5>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                              article.impact === 'high' ? 'bg-red-500' : article.impact === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}>
                              {article.impact}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                              article.sentiment === 'positive' ? 'bg-green-500' : 
                              article.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                            }`}>
                              {article.sentiment}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{article.summary}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{article.source} • {new Date(article.publishedAt).toLocaleDateString()}</span>
                          <span className="text-blue-500">Click to open →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!analysis && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Professional Analysis Engine</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">Get institutional-level analyses for stocks and crypto with real-time data, interactive charts, technical indicators, sentiment analysis and evidence-based recommendations.</p>
            
            <div className="bg-gray-50 rounded-2xl p-6">
              <p className="text-gray-600 mb-4"><strong>Popular symbols to test:</strong></p>
              <div className="flex flex-wrap justify-center gap-2">
                {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'BTC', 'ETH'].map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => setInput(symbol)}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white border-t mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">TradingAI Pro</span>
            </div>
            <p className="text-gray-500 text-sm">© 2025 TradingAI Pro. Professional AI-powered analysis.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;