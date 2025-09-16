// api/analyze.js - Vercel Serverless Function (Fixed)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
    
    // Use fetch instead of axios (built into Node.js 18+)
    const [priceData, newsData] = await Promise.allSettled([
      fetchPriceData(symbol),
      fetchNewsData(symbol)
    ]);

    const price = priceData.status === 'fulfilled' ? priceData.value : null;
    const news = newsData.status === 'fulfilled' ? newsData.value : [];

    if (!price) {
      console.log('Price data failed, using mock data');
      // Fallback to mock data if real API fails
      return res.json({
        symbol: symbol.toUpperCase(),
        company: `${symbol.toUpperCase()} Inc.`,
        currentPrice: 150.25,
        priceChangePercent: 2.5,
        assetType: 'stock',
        sector: 'Technology',
        sentiment: {
          overall: 'positive',
          score: 0.75,
          articles: [
            { headline: `${symbol} shows strong quarterly results` },
            { headline: `Analysts upgrade ${symbol} price target` }
          ]
        },
        fundamentals: {
          type: 'stock',
          peRatio: 25.4,
          marketCap: 2500.5,
          eps: 6.12,
          roe: 15.2
        },
        timestamp: new Date().toISOString(),
        source: 'mock-fallback'
      });
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
      timestamp: new Date().toISOString(),
      source: 'yahoo-finance'
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
  try {
    // Use built-in fetch instead of axios
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      method: 'GET',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      // Add timeout using AbortSignal
      signal: AbortSignal.timeout(8000) // 8 second timeout
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data?.chart?.result?.[0]) {
      throw new Error('Invalid response from Yahoo Finance');
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    
    return {
      regularMarketPrice: meta.regularMarketPrice || 0,
      longName: meta.longName || 'Unknown Company',
      changePercent: meta.previousClose ? 
        ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 : 0,
      trailingPE: meta.trailingPE || 0,
      marketCap: meta.marketCap || 0,
      trailingEps: meta.trailingEps || 0
    };
  } catch (error) {
    console.error('Price fetch error:', error.message);
    throw error;
  }
}

async function fetchNewsData(symbol) {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}&quotesCount=1&newsCount=5`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.news || [];
  } catch (error) {
    console.error('News fetch error:', error.message);
    return [];
  }
}
