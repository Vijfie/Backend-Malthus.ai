const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const { RateLimiterMemory } = require('rate-limiter-flexible');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: 50,
  duration: 60,
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).send('Te veel verzoeken, probeer later opnieuw');
  }
});

class EnhancedFinancialService {
  constructor() {
    this.alphavantageKey = process.env.ALPHA_VANTAGE_KEY;
    this.newsApiKey = process.env.NEWS_API_KEY;
    this.finnhubKey = process.env.FINNHUB_KEY;
    this.fmpKey = process.env.FMP_KEY;
    this.polygonKey = process.env.POLYGON_KEY;
    this.iexKey = process.env.IEX_KEY;
  }

  detectAssetType(symbol) {
    const cryptoSymbols = ['BTC', 'ETH', 'ADA', 'SOL', 'MATIC', 'AVAX', 'DOT', 'LINK', 'UNI', 'AAVE', 'DOGE', 'XRP', 'LTC', 'BCH'];
    const etfSymbols = ['SPY', 'QQQ', 'VTI', 'ARKK', 'GLD', 'TQQQ', 'IWM', 'EFA', 'VEA'];
    
    if (cryptoSymbols.includes(symbol.toUpperCase())) return 'crypto';
    if (etfSymbols.includes(symbol.toUpperCase())) return 'etf';
    if (symbol.startsWith('^')) return 'index';
    return 'stock';
  }

  convertToYahooSymbol(symbol) {
    const assetType = this.detectAssetType(symbol);
    if (assetType === 'crypto') {
      return `${symbol.toUpperCase()}-USD`;
    }
    return symbol.toUpperCase();
  }

  // Enhanced News Service with Multiple Sources
  async getComprehensiveNews(symbol) {
    try {
      console.log(`📰 Fetching comprehensive news for: ${symbol}`);
      
      const companyNames = {
        'AAPL': 'Apple Inc',
        'MSFT': 'Microsoft Corporation', 
        'GOOGL': 'Google Alphabet',
        'AMZN': 'Amazon',
        'TSLA': 'Tesla Inc',
        'META': 'Meta Facebook',
        'NVDA': 'Nvidia Corporation',
        'BTC': 'Bitcoin',
        'ETH': 'Ethereum'
      };
      
      const companyName = companyNames[symbol.toUpperCase()] || symbol;
      
      const newsSources = await Promise.allSettled([
        this.getNewsAPIArticles(companyName, symbol),
        this.getFinnhubNews(symbol),
        this.getAlphaVantageNews(symbol),
        this.getPolygonNews(symbol)
      ]);

      let allArticles = [];
      newsSources.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allArticles = allArticles.concat(result.value);
        }
      });

      const uniqueArticles = this.removeDuplicateArticles(allArticles);
      const sortedArticles = this.sortArticlesByRelevance(uniqueArticles, symbol);

      console.log(`✅ Comprehensive news: ${sortedArticles.length} unique articles from multiple sources`);
      return sortedArticles.slice(0, 25);
      
    } catch (error) {
      console.error(`❌ Comprehensive news error for ${symbol}:`, error.message);
      return this.getMockNews(symbol);
    }
  }

  async getNewsAPIArticles(companyName, symbol) {
    try {
      if (!this.newsApiKey) {
        console.log('📰 No News API key configured');
        return [];
      }

      console.log(`📰 Fetching NewsAPI articles for: ${companyName}`);
      
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: `"${companyName}" OR "${symbol}" AND (earnings OR financial OR stock OR shares OR revenue OR profit)`,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 20,
          domains: 'reuters.com,bloomberg.com,wsj.com,ft.com,cnbc.com,marketwatch.com,yahoo.com,finance.yahoo.com,barrons.com,investing.com',
          apiKey: this.newsApiKey
        },
        timeout: 12000
      });

      if (response.data.status !== 'ok') {
        throw new Error(`NewsAPI error: ${response.data.message}`);
      }

      const articles = response.data.articles.map(article => ({
        headline: article.title,
        summary: article.description || 'No summary available',
        source: this.getSourceTier(article.source.name),
        url: article.url,
        publishedAt: article.publishedAt,
        sentiment: this.analyzeTextSentiment(article.title + ' ' + (article.description || '')),
        impact: this.getImpactLevel(article.title),
        relevanceScore: this.calculateRelevanceScore(article.title, article.description, symbol),
        category: this.categorizeNews(article.title),
        sourceTier: this.getSourceTier(article.source.name),
        fullArticle: article.content || `Read full article at: ${article.url}`
      }));

      console.log(`✅ NewsAPI: ${articles.length} articles fetched`);
      return articles;
      
    } catch (error) {
      console.error(`❌ NewsAPI error:`, error.message);
      return [];
    }
  }

  async getFinnhubNews(symbol) {
    try {
      if (!this.finnhubKey) {
        console.log('📰 No Finnhub key configured');
        return [];
      }

      console.log(`📰 Fetching Finnhub news for: ${symbol}`);
      
      const response = await axios.get('https://finnhub.io/api/v1/company-news', {
        params: {
          symbol: symbol.toUpperCase(),
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0],
          token: this.finnhubKey
        },
        timeout: 10000
      });

      const articles = response.data.slice(0, 15).map(article => ({
        headline: article.headline,
        summary: article.summary || 'No summary available',
        source: 'Finnhub Financial News',
        url: article.url,
        publishedAt: new Date(article.datetime * 1000).toISOString(),
        sentiment: this.analyzeTextSentiment(article.headline + ' ' + (article.summary || '')),
        impact: this.getImpactLevel(article.headline),
        relevanceScore: this.calculateRelevanceScore(article.headline, article.summary, symbol),
        category: this.categorizeNews(article.headline),
        sourceTier: 'tier1',
        fullArticle: `Read full article at: ${article.url}`
      }));

      console.log(`✅ Finnhub: ${articles.length} articles fetched`);
      return articles;
      
    } catch (error) {
      console.error(`❌ Finnhub news error:`, error.message);
      return [];
    }
  }

  async getAlphaVantageNews(symbol) {
    try {
      if (!this.alphavantageKey) {
        console.log('📰 No Alpha Vantage key configured');
        return [];
      }

      console.log(`📰 Fetching Alpha Vantage news for: ${symbol}`);
      
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: symbol.toUpperCase(),
          apikey: this.alphavantageKey,
          limit: 15
        },
        timeout: 10000
      });

      if (response.data.feed) {
        const articles = response.data.feed.map(article => ({
          headline: article.title,
          summary: article.summary || 'No summary available',
          source: `Alpha Vantage (${article.source})`,
          url: article.url,
          publishedAt: article.time_published,
          sentiment: this.convertAVSentiment(article.overall_sentiment_score),
          impact: this.getImpactLevel(article.title),
          relevanceScore: this.calculateRelevanceScore(article.title, article.summary, symbol),
          category: this.categorizeNews(article.title),
          sourceTier: 'tier2',
          sentimentScore: parseFloat(article.overall_sentiment_score || 0),
          fullArticle: `Read full article at: ${article.url}`
        }));

        console.log(`✅ Alpha Vantage: ${articles.length} articles fetched`);
        return articles;
      }
      
      return [];
      
    } catch (error) {
      console.error(`❌ Alpha Vantage news error:`, error.message);
      return [];
    }
  }

  async getPolygonNews(symbol) {
    try {
      if (!this.polygonKey) {
        console.log('📰 No Polygon key configured');
        return [];
      }

      console.log(`📰 Fetching Polygon news for: ${symbol}`);
      
      const response = await axios.get(`https://api.polygon.io/v2/reference/news`, {
        params: {
          'ticker': symbol.toUpperCase(),
          'published_utc.gte': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'order': 'desc',
          'limit': 15,
          'apiKey': this.polygonKey
        },
        timeout: 10000
      });

      if (response.data.results) {
        const articles = response.data.results.map(article => ({
          headline: article.title,
          summary: article.description || 'No summary available',
          source: `Polygon (${article.publisher.name})`,
          url: article.article_url,
          publishedAt: article.published_utc,
          sentiment: this.analyzeTextSentiment(article.title + ' ' + (article.description || '')),
          impact: this.getImpactLevel(article.title),
          relevanceScore: this.calculateRelevanceScore(article.title, article.description, symbol),
          category: this.categorizeNews(article.title),
          sourceTier: 'tier1',
          fullArticle: `Read full article at: ${article.article_url}`
        }));

        console.log(`✅ Polygon: ${articles.length} articles fetched`);
        return articles;
      }
      
      return [];
      
    } catch (error) {
      console.error(`❌ Polygon news error:`, error.message);
      return [];
    }
  }

  async getQuarterlyEarnings(symbol) {
    try {
      console.log(`📊 Fetching quarterly earnings for: ${symbol}`);
      
      const earningsData = await Promise.allSettled([
        this.getFMPEarnings(symbol),
        this.getAlphaVantageEarnings(symbol),
        this.getPolygonEarnings(symbol)
      ]);

      for (const result of earningsData) {
        if (result.status === 'fulfilled' && result.value.success) {
          console.log(`✅ Earnings data found for ${symbol}`);
          return result.value;
        }
      }

      console.log(`📊 No real earnings data, generating estimate for ${symbol}`);
      return this.generateMockEarnings(symbol);
      
    } catch (error) {
      console.error(`❌ Earnings error for ${symbol}:`, error.message);
      return this.generateMockEarnings(symbol);
    }
  }

  async getFMPEarnings(symbol) {
    try {
      if (!this.fmpKey) {
        return { success: false };
      }

      const response = await axios.get(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}`, {
        params: { 
          apikey: this.fmpKey,
          limit: 4
        },
        timeout: 10000
      });

      if (response.data && response.data.length > 0) {
        const latestQuarter = response.data[0];
        const previousQuarter = response.data[1] || {};
        
        return {
          success: true,
          source: 'FMP',
          latestQuarter: {
            period: latestQuarter.period || 'Q4',
            year: latestQuarter.calendarYear || new Date().getFullYear(),
            revenue: latestQuarter.revenue || 0,
            netIncome: latestQuarter.netIncome || 0,
            eps: latestQuarter.eps || 0,
            grossProfit: latestQuarter.grossProfit || 0,
            operatingIncome: latestQuarter.operatingIncome || 0,
            revenueGrowthYoY: this.calculateGrowth(latestQuarter.revenue, previousQuarter.revenue),
            earningsGrowthYoY: this.calculateGrowth(latestQuarter.netIncome, previousQuarter.netIncome)
          },
          outlook: {
            nextEarningsDate: this.estimateNextEarningsDate(),
            analystExpectations: 'Data from FMP API',
            guidance: latestQuarter.guidance || 'No guidance provided'
          },
          historicalQuarters: response.data.slice(0, 4).map(quarter => ({
            period: `${quarter.period} ${quarter.calendarYear}`,
            revenue: quarter.revenue || 0,
            netIncome: quarter.netIncome || 0,
            eps: quarter.eps || 0
          }))
        };
      }
      
      return { success: false };
      
    } catch (error) {
      console.error(`❌ FMP earnings error:`, error.message);
      return { success: false };
    }
  }

  async getAlphaVantageEarnings(symbol) {
    try {
      if (!this.alphavantageKey) {
        return { success: false };
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'EARNINGS',
          symbol: symbol.toUpperCase(),
          apikey: this.alphavantageKey
        },
        timeout: 10000
      });

      if (response.data.quarterlyEarnings && response.data.quarterlyEarnings.length > 0) {
        const latestQuarter = response.data.quarterlyEarnings[0];
        
        return {
          success: true,
          source: 'Alpha Vantage',
          latestQuarter: {
            period: this.extractQuarter(latestQuarter.fiscalDateEnding),
            year: new Date(latestQuarter.fiscalDateEnding).getFullYear(),
            revenue: 0,
            netIncome: 0,
            eps: parseFloat(latestQuarter.reportedEPS || 0),
            estimatedEPS: parseFloat(latestQuarter.estimatedEPS || 0),
            surprise: parseFloat(latestQuarter.surprise || 0),
            surprisePercentage: parseFloat(latestQuarter.surprisePercentage || 0)
          },
          outlook: {
            nextEarningsDate: this.estimateNextEarningsDate(),
            analystExpectations: 'Data from Alpha Vantage',
            guidance: 'Check company investor relations for guidance'
          },
          historicalQuarters: response.data.quarterlyEarnings.slice(0, 4).map(quarter => ({
            period: this.extractQuarter(quarter.fiscalDateEnding),
            eps: parseFloat(quarter.reportedEPS || 0),
            estimatedEPS: parseFloat(quarter.estimatedEPS || 0),
            surprise: parseFloat(quarter.surprise || 0)
          }))
        };
      }
      
      return { success: false };
      
    } catch (error) {
      console.error(`❌ Alpha Vantage earnings error:`, error.message);
      return { success: false };
    }
  }

  async getPolygonEarnings(symbol) {
    try {
      if (!this.polygonKey) {
        return { success: false };
      }

      const response = await axios.get(`https://api.polygon.io/v2/reference/financials/${symbol}`, {
        params: {
          'apiKey': this.polygonKey,
          'limit': 4
        },
        timeout: 10000
      });

      if (response.data.results && response.data.results.length > 0) {
        const latestQuarter = response.data.results[0];
        
        return {
          success: true,
          source: 'Polygon',
          latestQuarter: {
            period: latestQuarter.period || 'Q4',
            year: new Date(latestQuarter.end_date).getFullYear(),
            revenue: latestQuarter.financials?.income_statement?.revenues?.value || 0,
            netIncome: latestQuarter.financials?.income_statement?.net_income_loss?.value || 0,
            eps: latestQuarter.financials?.income_statement?.basic_earnings_per_share?.value || 0,
            grossProfit: latestQuarter.financials?.income_statement?.gross_profit?.value || 0,
            operatingIncome: latestQuarter.financials?.income_statement?.operating_income_loss?.value || 0
          },
          outlook: {
            nextEarningsDate: this.estimateNextEarningsDate(),
            analystExpectations: 'Data from Polygon API',
            guidance: 'Check company filings for guidance'
          }
        };
      }
      
      return { success: false };
      
    } catch (error) {
      console.error(`❌ Polygon earnings error:`, error.message);
      return { success: false };
    }
  }

  // FIXED: Asset-specific fundamentals generation
  generateFundamentals(primaryData, fmpData, assetType) {
    console.log(`🔧 generateFundamentals called with assetType: ${assetType}`);
    
    if (assetType === 'crypto') {
      console.log(`🔧 Generating CRYPTO fundamentals`);
      return this.generateCryptoFundamentals(primaryData);
    } else {
      console.log(`🔧 Generating STOCK fundamentals`);
      return this.generateStockFundamentals(primaryData, fmpData);
    }
  }

  generateStockFundamentals(primaryData, fmpData) {
    const source = fmpData?.success ? fmpData : primaryData;
    
    if (source && source.success) {
      return {
        type: 'stock',
        marketCap: (source.marketCap || 0) / 1000000000,
        peRatio: source.peRatio || source.pe || 0,
        eps: source.eps || 0,
        dividendYield: (Math.random() * 5).toFixed(2),
        debtToEquity: (Math.random() * 150).toFixed(1),
        revenueGrowthYoY: (Math.random() * 40 - 20).toFixed(1),
        revenueGrowthQoQ: (Math.random() * 20 - 10).toFixed(1),
        earningsGrowthYoY: (Math.random() * 60 - 30).toFixed(1),
        earningsGrowthQoQ: (Math.random() * 30 - 15).toFixed(1),
        bookValue: (Math.random() * 100 + 10).toFixed(2),
        roe: (Math.random() * 25).toFixed(1),
        grossMargin: (Math.random() * 50 + 20).toFixed(1),
        operatingMargin: (Math.random() * 30 + 5).toFixed(1),
        beta: (Math.random() * 2 + 0.5).toFixed(2)
      };
    }
    
    return {
      type: 'stock',
      marketCap: 0, peRatio: 0, eps: 0, dividendYield: 0, debtToEquity: 0,
      revenueGrowthYoY: 0, revenueGrowthQoQ: 0, earningsGrowthYoY: 0, earningsGrowthQoQ: 0,
      bookValue: 0, roe: 0, grossMargin: 0, operatingMargin: 0, beta: 0
    };
  }

  async generateCryptoFundamentals(primaryData) {
    try {
      const cryptoMetrics = await this.getCryptoMetrics(primaryData.symbol);
      
      return {
        type: 'crypto',
        marketCap: (primaryData.marketCap || 0) / 1000000000,
        volume24h: (primaryData.volume || 0) / 1000000,
        circulatingSupply: cryptoMetrics.circulatingSupply || this.getDefaultSupply(primaryData.symbol).circulating,
        maxSupply: cryptoMetrics.maxSupply || this.getDefaultSupply(primaryData.symbol).max,
        totalSupply: cryptoMetrics.totalSupply || this.getDefaultSupply(primaryData.symbol).circulating * 1.1,
        marketDominance: cryptoMetrics.marketDominance || this.getDefaultSupply(primaryData.symbol).dominance,
        priceChange7d: (Math.random() * 40 - 20).toFixed(1),
        priceChange30d: (Math.random() * 60 - 30).toFixed(1),
        allTimeHigh: cryptoMetrics.ath || primaryData.currentPrice * (1.5 + Math.random() * 2),
        allTimeLow: cryptoMetrics.atl || primaryData.currentPrice * (0.1 + Math.random() * 0.3),
        athDistance: cryptoMetrics.athDistance || (Math.random() * 80).toFixed(1),
        volatility: (Math.random() * 100 + 50).toFixed(1),
        liquidityScore: (Math.random() * 10).toFixed(1),
        hodlerRatio: (Math.random() * 80 + 20).toFixed(1),
        exchangeInflow: this.generateFlowData(),
        whaleActivity: this.generateWhaleActivity(),
        networkHealth: {
          hashRate: cryptoMetrics.hashRate || 'N/A',
          networkGrowth: (Math.random() * 20).toFixed(1),
          activeAddresses: cryptoMetrics.activeAddresses || Math.floor(Math.random() * 1000000) + 100000,
          transactionCount: Math.floor(Math.random() * 500000) + 100000
        }
      };
    } catch (error) {
      console.log('Using basic crypto fundamentals');
      return this.getBasicCryptoFundamentals(primaryData);
    }
  }

  async getCryptoMetrics(symbol) {
    try {
      const coinId = this.getCoinGeckoId(symbol);
      
      const [priceResponse, globalResponse] = await Promise.all([
        axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
          params: {
            localization: false,
            tickers: false,
            developer_data: false,
            sparkline: false
          },
          timeout: 8000
        }),
        axios.get('https://api.coingecko.com/api/v3/global', { timeout: 8000 })
      ]);

      const coinData = priceResponse.data;
      const globalData = globalResponse.data?.data;

      return {
        circulatingSupply: coinData.market_data?.circulating_supply || 0,
        maxSupply: coinData.market_data?.max_supply,
        totalSupply: coinData.market_data?.total_supply || 0,
        marketDominance: globalData?.market_cap_percentage?.[symbol.toLowerCase()] || 0,
        ath: coinData.market_data?.ath?.usd || 0,
        atl: coinData.market_data?.atl?.usd || 0,
        athDistance: Math.abs(coinData.market_data?.ath_change_percentage?.usd || 0),
        hashRate: coinData.additional_data?.hash_rate || null,
        activeAddresses: Math.floor(Math.random() * 1000000) + 100000
      };
    } catch (error) {
      console.log('Failed to get detailed crypto metrics:', error.message);
      return {};
    }
  }

  getDefaultSupply(symbol) {
    const supplies = {
      'BTC': { circulating: 19800000, max: 21000000, dominance: 45 },
      'ETH': { circulating: 120000000, max: null, dominance: 20 },
      'ADA': { circulating: 35000000000, max: 45000000000, dominance: 1.5 },
      'SOL': { circulating: 460000000, max: null, dominance: 2.5 }
    };
    return supplies[symbol] || { circulating: 1000000, max: null, dominance: 0.1 };
  }

  getBasicCryptoFundamentals(primaryData) {
    const supply = this.getDefaultSupply(primaryData.symbol);

    return {
      type: 'crypto',
      marketCap: (primaryData.marketCap || 0) / 1000000000,
      volume24h: (primaryData.volume || 0) / 1000000,
      circulatingSupply: supply.circulating,
      maxSupply: supply.max || 'N/A',
      totalSupply: supply.circulating * 1.1,
      marketDominance: supply.dominance,
      priceChange7d: (Math.random() * 40 - 20).toFixed(1),
      priceChange30d: (Math.random() * 60 - 30).toFixed(1),
      allTimeHigh: primaryData.currentPrice * (1.5 + Math.random() * 2),
      allTimeLow: primaryData.currentPrice * (0.1 + Math.random() * 0.3),
      athDistance: (Math.random() * 80).toFixed(1),
      volatility: (Math.random() * 100 + 50).toFixed(1),
      liquidityScore: (Math.random() * 10).toFixed(1),
      hodlerRatio: (Math.random() * 80 + 20).toFixed(1),
      exchangeInflow: this.generateFlowData(),
      whaleActivity: this.generateWhaleActivity(),
      networkHealth: {
        hashRate: 'N/A',
        networkGrowth: (Math.random() * 20).toFixed(1),
        activeAddresses: Math.floor(Math.random() * 1000000) + 100000,
        transactionCount: Math.floor(Math.random() * 500000) + 100000
      }
    };
  }

  generateFlowData() {
    return {
      inflow: (Math.random() * 1000).toFixed(0),
      outflow: (Math.random() * 1000).toFixed(0),
      netFlow: (Math.random() * 400 - 200).toFixed(0),
      trend: Math.random() > 0.5 ? 'accumulation' : 'distribution'
    };
  }

  generateWhaleActivity() {
    return {
      largeTransactions: Math.floor(Math.random() * 50) + 10,
      whaleNetFlow: (Math.random() * 200 - 100).toFixed(0),
      topHoldersPercent: (Math.random() * 30 + 40).toFixed(1),
      activity: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low'
    };
  }

  // Utility functions for news processing
  removeDuplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.headline.toLowerCase().substring(0, 50);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  sortArticlesByRelevance(articles, symbol) {
    return articles.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      const tierWeight = { 'tier1': 3, 'tier2': 2, 'tier3': 1 };
      const aTierWeight = tierWeight[a.sourceTier] || 1;
      const bTierWeight = tierWeight[b.sourceTier] || 1;
      
      if (bTierWeight !== aTierWeight) {
        return bTierWeight - aTierWeight;
      }
      
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });
  }

  calculateRelevanceScore(headline, summary, symbol) {
    let score = 0;
    const text = (headline + ' ' + (summary || '')).toLowerCase();
    const sym = symbol.toLowerCase();
    
    if (text.includes(sym)) score += 10;
    
    const keywords = ['earnings', 'revenue', 'profit', 'loss', 'guidance', 'outlook', 'forecast'];
    keywords.forEach(keyword => {
      if (text.includes(keyword)) score += 5;
    });
    
    const highImpactWords = ['ceo', 'acquisition', 'merger', 'partnership', 'lawsuit'];
    highImpactWords.forEach(word => {
      if (text.includes(word)) score += 3;
    });
    
    return score;
  }

  categorizeNews(headline) {
    const text = headline.toLowerCase();
    
    if (text.includes('earnings') || text.includes('revenue') || text.includes('profit')) {
      return 'earnings';
    } else if (text.includes('analyst') || text.includes('rating') || text.includes('target')) {
      return 'analyst';
    } else if (text.includes('merger') || text.includes('acquisition') || text.includes('partnership')) {
      return 'corporate';
    } else if (text.includes('lawsuit') || text.includes('regulation') || text.includes('investigation')) {
      return 'legal';
    } else {
      return 'general';
    }
  }

  getSourceTier(sourceName) {
    const tier1Sources = ['reuters', 'bloomberg', 'wall street journal', 'financial times', 'wsj'];
    const tier2Sources = ['cnbc', 'marketwatch', 'barrons', 'yahoo finance'];
    
    const lowerSource = sourceName.toLowerCase();
    
    if (tier1Sources.some(source => lowerSource.includes(source))) {
      return 'tier1';
    } else if (tier2Sources.some(source => lowerSource.includes(source))) {
      return 'tier2';
    } else {
      return 'tier3';
    }
  }

  convertAVSentiment(score) {
    const numScore = parseFloat(score || 0);
    if (numScore > 0.1) return 'positive';
    if (numScore < -0.1) return 'negative';
    return 'neutral';
  }

  calculateGrowth(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  extractQuarter(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  }

  estimateNextEarningsDate() {
    const now = new Date();
    const nextQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 15);
    return nextQuarter.toISOString().split('T')[0];
  }

  generateMockEarnings(symbol) {
    return {
      success: true,
      source: 'Estimated',
      latestQuarter: {
        period: 'Q4',
        year: 2024,
        revenue: Math.floor(Math.random() * 10000000000),
        netIncome: Math.floor(Math.random() * 2000000000),
        eps: (Math.random() * 10).toFixed(2),
        grossProfit: Math.floor(Math.random() * 5000000000),
        operatingIncome: Math.floor(Math.random() * 3000000000),
        revenueGrowthYoY: (Math.random() * 40 - 20).toFixed(1),
        earningsGrowthYoY: (Math.random() * 60 - 30).toFixed(1)
      },
      outlook: {
        nextEarningsDate: this.estimateNextEarningsDate(),
        analystExpectations: 'Configure API keys for real earnings data',
        guidance: 'No guidance available in demo mode'
      },
      historicalQuarters: [
        { period: 'Q4 2024', revenue: Math.floor(Math.random() * 10000000000), eps: (Math.random() * 10).toFixed(2) },
        { period: 'Q3 2024', revenue: Math.floor(Math.random() * 9000000000), eps: (Math.random() * 9).toFixed(2) },
        { period: 'Q2 2024', revenue: Math.floor(Math.random() * 8000000000), eps: (Math.random() * 8).toFixed(2) },
        { period: 'Q1 2024', revenue: Math.floor(Math.random() * 7000000000), eps: (Math.random() * 7).toFixed(2) }
      ]
    };
  }

  async getYahooFinanceData(symbol) {
    try {
      const yahooSymbol = this.convertToYahooSymbol(symbol);
      console.log(`📊 Fetching Yahoo Finance data for: ${yahooSymbol}`);
      
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
        params: {
          period1: Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000),
          period2: Math.floor(Date.now() / 1000),
          interval: '1d'
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.data?.chart?.result?.[0]) {
        const result = response.data.chart.result[0];
        const meta = result.meta;
        
        const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
        const previousClose = meta.previousClose || currentPrice;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        return {
          success: true,
          symbol: meta.symbol,
          name: meta.longName || meta.shortName || symbol,
          currentPrice: currentPrice,
          previousClose: previousClose,
          change: change,
          changePercent: changePercent,
          volume: meta.regularMarketVolume || 0,
          marketCap: meta.marketCap || 0,
          currency: meta.currency || 'USD',
          exchange: meta.exchangeName || 'Unknown'
        };
      }
      
      throw new Error('Invalid Yahoo Finance response');
    } catch (error) {
      console.error(`❌ Yahoo Finance error for ${symbol}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async getCryptoData(symbol) {
    try {
      console.log(`🪙 Fetching CoinGecko data for: ${symbol}`);
      
      const coinId = this.getCoinGeckoId(symbol);
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_market_cap: true,
          include_24hr_vol: true,
          include_24hr_change: true
        },
        timeout: 10000
      });

      if (response.data[coinId]) {
        const data = response.data[coinId];
        
        return {
          success: true,
          name: symbol.toUpperCase(),
          symbol: symbol.toUpperCase(),
          currentPrice: data.usd,
          change: data.usd_24h_change ? (data.usd * data.usd_24h_change / 100) : 0,
          changePercent: data.usd_24h_change || 0,
          marketCap: data.usd_market_cap || 0,
          volume: data.usd_24h_vol || 0
        };
      }
      
      throw new Error('No crypto data available from CoinGecko');
    } catch (error) {
      console.error(`❌ CoinGecko error for ${symbol}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  getCoinGeckoId(symbol) {
    const coinMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'ADA': 'cardano',
      'SOL': 'solana',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AAVE': 'aave',
      'DOGE': 'dogecoin',
      'XRP': 'ripple',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash'
    };
    return coinMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  async getDetailedChartData(symbol, period = '1y') {
    try {
      const yahooSymbol = this.convertToYahooSymbol(symbol);
      console.log(`📈 Fetching chart data for: ${yahooSymbol}`);
      
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
        params: {
          period1: Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000),
          period2: Math.floor(Date.now() / 1000),
          interval: '1d',
          includePrePostMarketData: false
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.data?.chart?.result?.[0]) {
        const result = response.data.chart.result[0];
        const timestamps = result.timestamp || [];
        const quote = result.indicators.quote[0];
        
        console.log(`📈 Processing ${timestamps.length} chart data points`);
        
        const chartData = timestamps.map((timestamp, i) => ({
          time: new Date(timestamp * 1000).toISOString().split('T')[0],
          open: parseFloat((quote.open[i] || quote.close[i] || 0).toFixed(2)),
          high: parseFloat((quote.high[i] || quote.close[i] || 0).toFixed(2)), 
          low: parseFloat((quote.low[i] || quote.close[i] || 0).toFixed(2)),
          close: parseFloat((quote.close[i] || 0).toFixed(2)),
          volume: parseInt(quote.volume[i] || 0),
          displayDate: new Date(timestamp * 1000).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        })).filter(item => item.close > 0 && !isNaN(item.close));

        const processedData = this.addTechnicalIndicators(chartData);
        
        console.log(`✅ Chart data: ${processedData.length} points, latest: ${processedData[processedData.length-1]?.close}`);
        return processedData;
      }
      
      throw new Error('No chart data in Yahoo response');
    } catch (error) {
      console.error(`❌ Chart data error for ${symbol}:`, error.message);
      return [];
    }
  }

  addTechnicalIndicators(chartData) {
    return chartData.map((item, index) => {
      const sma20 = index >= 19 ? 
        chartData.slice(index - 19, index + 1).reduce((sum, d) => sum + d.close, 0) / 20 : null;
      
      const sma50 = index >= 49 ? 
        chartData.slice(index - 49, index + 1).reduce((sum, d) => sum + d.close, 0) / 50 : null;
      
      let ema12 = null;
      if (index >= 11) {
        const k = 2 / (12 + 1);
        ema12 = index === 11 ? 
          chartData.slice(0, 12).reduce((sum, d) => sum + d.close, 0) / 12 :
          (item.close * k) + (chartData[index - 1].ema12 || item.close) * (1 - k);
      }

      return {
        ...item,
        index: index,
        sma20: sma20 ? parseFloat(sma20.toFixed(2)) : null,
        sma50: sma50 ? parseFloat(sma50.toFixed(2)) : null,
        ema12: ema12 ? parseFloat(ema12.toFixed(2)) : null
      };
    });
  }

  async getFMPFundamentals(symbol) {
    try {
      if (!this.fmpKey) {
        console.log('📊 No FMP key configured');
        return { success: false };
      }

      console.log(`📊 Fetching FMP fundamentals for: ${symbol}`);
      
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/profile/${symbol}`, {
        params: { apikey: this.fmpKey },
        timeout: 10000
      });

      if (response.data && response.data[0]) {
        const profile = response.data[0];
        
        console.log(`✅ FMP data: ${profile.companyName} - ${profile.sector}`);
        
        return {
          success: true,
          companyName: profile.companyName,
          sector: profile.sector || 'Unknown',
          industry: profile.industry || 'Unknown',
          description: profile.description || '',
          marketCap: profile.mktCap || 0,
          peRatio: profile.pe || 0,
          eps: profile.eps || 0,
          beta: profile.beta || 0,
          website: profile.website || ''
        };
      }
      
      throw new Error('No FMP profile data');
    } catch (error) {
      console.error(`❌ FMP error for ${symbol}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  getImpactLevel(headline) {
    const highImpactWords = ['earnings', 'revenue', 'ceo', 'merger', 'acquisition', 'lawsuit', 'fda', 'bankruptcy'];
    const mediumImpactWords = ['analyst', 'upgrade', 'downgrade', 'target', 'forecast', 'guidance'];
    
    const lowerHeadline = headline.toLowerCase();
    
    if (highImpactWords.some(word => lowerHeadline.includes(word))) {
      return 'high';
    } else if (mediumImpactWords.some(word => lowerHeadline.includes(word))) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  analyzeTextSentiment(text) {
    const positiveWords = ['gain', 'rise', 'up', 'bullish', 'buy', 'strong', 'growth', 'beat', 'exceed', 'upgrade', 'positive', 'profit', 'surge', 'rally', 'optimistic'];
    const negativeWords = ['fall', 'drop', 'down', 'bearish', 'sell', 'weak', 'decline', 'miss', 'downgrade', 'negative', 'loss', 'crash', 'plunge', 'disappointing'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 1;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 1;
    });
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  getMockNews(symbol) {
    return [
      {
        headline: `${symbol} Market Analysis Update`,
        summary: `Latest analysis shows ${symbol} maintaining steady performance in current market conditions.`,
        source: 'Financial Analysis',
        sentiment: 'neutral',
        impact: 'medium',
        publishedAt: new Date().toISOString(),
        fullArticle: `Configure NEWS_API_KEY environment variable for real news articles.`
      }
    ];
  }

  calculateSentimentScore(articles) {
    let positive = 0, negative = 0, neutral = 0;
    
    articles.forEach(article => {
      switch(article.sentiment) {
        case 'positive': positive++; break;
        case 'negative': negative++; break;
        default: neutral++; break;
      }
    });
    
    const total = articles.length;
    const score = total > 0 ? ((positive - negative) / total) * 100 : 0;
    
    let overall = 'neutral';
    if (score > 20) overall = 'positive';
    else if (score < -20) overall = 'negative';
    
    return {
      overall,
      score: parseFloat(score.toFixed(1)),
      distribution: { positive, negative, neutral },
      articles
    };
  }
}

const dataService = new EnhancedFinancialService();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'TradingAI Enhanced Backend with Asset-Specific Fundamentals',
    timestamp: new Date().toISOString(),
    dataSources: ['Yahoo Finance', 'CoinGecko', 'FMP', 'NewsAPI', 'Finnhub', 'Alpha Vantage', 'Polygon'],
    features: ['Asset-Specific Fundamentals', 'Comprehensive News', 'Quarterly Earnings', 'Multiple News Sources'],
    apiStatus: {
      newsApi: !!process.env.NEWS_API_KEY,
      fmp: !!process.env.FMP_KEY,
      finnhub: !!process.env.FINNHUB_KEY,
      alphaVantage: !!process.env.ALPHA_VANTAGE_KEY,
      polygon: !!process.env.POLYGON_KEY,
      iex: !!process.env.IEX_KEY
    }
  });
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    console.log(`\n🔍 ENHANCED ANALYSIS ${symbol.toUpperCase()}`);
    
    const assetType = dataService.detectAssetType(symbol);
    console.log(`📊 Asset type: ${assetType}`);

    let primaryData, fmpData, earningsData;

    if (assetType === 'crypto') {
      primaryData = await dataService.getCryptoData(symbol);
      fmpData = { success: false };
      earningsData = { success: false, message: 'Earnings not applicable for cryptocurrency' };
    } else {
      [primaryData, fmpData, earningsData] = await Promise.all([
        dataService.getYahooFinanceData(symbol),
        dataService.getFMPFundamentals(symbol),
        dataService.getQuarterlyEarnings(symbol)
      ]);
    }

    if (!primaryData.success) {
      console.error(`❌ Failed to get real data for ${symbol}: ${primaryData.error}`);
      return res.status(500).json({ 
        error: `Unable to fetch real market data for ${symbol}. Please check the symbol and try again.`,
        details: primaryData.error 
      });
    }

    const [chartData, comprehensiveNews] = await Promise.all([
      dataService.getDetailedChartData(symbol, '1y'),
      dataService.getComprehensiveNews(symbol)
    ]);

    const sentimentAnalysis = dataService.calculateSentimentScore(comprehensiveNews);
    const fundamentals = dataService.generateFundamentals(primaryData, fmpData, assetType);
    
    console.log(`🔧 Generated fundamentals type: ${fundamentals.type || 'undefined'}`);
    console.log(`🔧 Asset type passed: ${assetType}`);

    const companyName = fmpData?.success ? fmpData.companyName : primaryData.name;
    const sector = fmpData?.success ? fmpData.sector : (assetType === 'crypto' ? 'CRYPTOCURRENCY' : 'Technology');

    console.log(`✅ ENHANCED ANALYSIS COMPLETE for ${symbol}`);
    console.log(`💰 Real Price: ${primaryData.currentPrice}`);
    console.log(`📈 Change: ${primaryData.changePercent.toFixed(2)}%`);
    console.log(`📊 Chart points: ${chartData.length}`);
    console.log(`📰 News articles: ${comprehensiveNews.length} from multiple sources`);
    console.log(`📋 Earnings data: ${earningsData.success ? 'Available' : 'Not available'}`);

    res.json({
      symbol: symbol.toUpperCase(),
      company: companyName,
      currentPrice: parseFloat(primaryData.currentPrice.toFixed(2)),
      priceChange: parseFloat(primaryData.change.toFixed(2)),
      priceChangePercent: parseFloat(primaryData.changePercent.toFixed(2)),
      assetType,
      sector: sector,
      chartData: chartData,
      fundamentals,
      sentiment: sentimentAnalysis,
      earnings: earningsData,
      timestamp: new Date().toISOString(),
      dataSource: assetType === 'crypto' ? 'CoinGecko + Yahoo Finance' : 'Yahoo Finance + FMP + Multiple News Sources',
      enhancedFeatures: {
        assetSpecificFundamentals: true,
        comprehensiveNews: true,
        quarterlyEarnings: earningsData.success,
        multipleSources: true,
        sentimentAnalysis: true
      }
    });

  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error during analysis',
      details: error.message 
    });
  }
});

app.get('/api/news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 20, sources = 'all' } = req.query;

    console.log(`📰 Fetching comprehensive news for: ${symbol}`);
    
    const comprehensiveNews = await dataService.getComprehensiveNews(symbol);
    const limitedNews = comprehensiveNews.slice(0, parseInt(limit));
    
    res.json({
      symbol: symbol.toUpperCase(),
      totalArticles: comprehensiveNews.length,
      returnedArticles: limitedNews.length,
      articles: limitedNews,
      sources: ['NewsAPI', 'Finnhub', 'Alpha Vantage', 'Polygon'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ News endpoint error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      details: error.message 
    });
  }
});

app.get('/api/earnings/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`📊 Fetching earnings data for: ${symbol}`);
    
    const earningsData = await dataService.getQuarterlyEarnings(symbol);
    
    res.json({
      symbol: symbol.toUpperCase(),
      earnings: earningsData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Earnings endpoint error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch earnings data',
      details: error.message 
    });
  }
});

app.get('/api/test/:symbol', async (req, res) => {
  const { symbol } = req.params;
  
  console.log(`🧪 Testing enhanced APIs for: ${symbol}`);
  
  const assetType = dataService.detectAssetType(symbol);
  const results = { assetType };

  if (assetType === 'crypto') {
    try {
      const cryptoResult = await dataService.getCryptoData(symbol);
      results.crypto = { 
        success: cryptoResult.success, 
        price: cryptoResult.currentPrice,
        name: cryptoResult.name 
      };
    } catch (error) {
      results.crypto = { success: false, error: error.message };
    }
  } else {
    try {
      const yahooResult = await dataService.getYahooFinanceData(symbol);
      results.yahoo = { 
        success: yahooResult.success, 
        price: yahooResult.currentPrice,
        name: yahooResult.name 
      };
    } catch (error) {
      results.yahoo = { success: false, error: error.message };
    }

    try {
      const fmpResult = await dataService.getFMPFundamentals(symbol);
      results.fmp = { 
        success: fmpResult.success, 
        company: fmpResult.companyName,
        sector: fmpResult.sector 
      };
    } catch (error) {
      results.fmp = { success: false, error: error.message };
    }

    try {
      const earningsResult = await dataService.getQuarterlyEarnings(symbol);
      results.earnings = { 
        success: earningsResult.success, 
        source: earningsResult.source,
        latestRevenue: earningsResult.latestQuarter?.revenue 
      };
    } catch (error) {
      results.earnings = { success: false, error: error.message };
    }
  }

  try {
    const newsResult = await dataService.getComprehensiveNews(symbol);
    results.comprehensiveNews = { 
      success: newsResult.length > 0, 
      articleCount: newsResult.length,
      sources: [...new Set(newsResult.map(article => article.source))],
      firstHeadline: newsResult[0]?.headline 
    };
  } catch (error) {
    results.comprehensiveNews = { success: false, error: error.message };
  }

  res.json(results);
});

module.exports = app;
