// api/analyze.js - Vercel Serverless Function
const axios = require('axios');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed' 
    });
  }

  const { symbol } = req.body;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol required' });
  }

  try {
    console.log(`Analyzing ${symbol}`);
    
    // Parallelle calls met strikte timeouts
    const [priceData, newsData] = await Promise.allSettled([
      fetchPriceData(symbol),
      fetchNewsData(symbol)
    ]);

    const price = priceData.status === 'fulfilled' ? priceData.value : null;
    const news = newsData.status === 'fulfilled' ? newsData.value : [];

    if (!price) {
      throw new Error('Unable to fetch price data');
    }

    res.json({
      symbol: symbol.toUpperCase(),
      company: price.longName || `${symbol.toUpperCase()} Inc.`,
      currentPrice: price.regularMarketPrice,
      priceChangePercent: price.changePercent,
      assetType: 'stock',
      sector: 'Technology',
      sentiment: {
        overall: news.length > 0 ? 'neutral' : 'neutral',
        score: 0,
        articles: news.slice(0, 3)
      },
      fundamentals: {
        type: 'stock',
        peRatio: price.trailingPE || 0,
        marketCap: (price.marketCap || 0) / 1000000000,
        eps: price.trailingEps || 0,
        roe: 15.2
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ 
      error: 'Unable to analyze symbol', 
      details: error.message 
    });
  }
}

async function fetchPriceData(symbol) {
  const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
    timeout: 6000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  
  const result = response.data.chart.result[0];
  const meta = result.meta;
  
  return {
    regularMarketPrice: meta.regularMarketPrice,
    longName: meta.longName,
    changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
    trailingPE: meta.trailingPE,
    marketCap: meta.marketCap,
    trailingEps: meta.trailingEps
  };
}

async function fetchNewsData(symbol) {
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v1/finance/search`, {
      params: { q: symbol, quotesCount: 1, newsCount: 5 },
      timeout: 3000
    });
    
    return response.data.news || [];
  } catch (error) {
    return [];
  }
}
