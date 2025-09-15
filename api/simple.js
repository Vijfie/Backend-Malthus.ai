export default function handler(req, res) {
  if (req.method === 'POST') {
    const { symbol } = req.body || {};
    
    // Simpele mock response zonder externe calls
    res.json({
      symbol: symbol || 'TEST',
      company: `${symbol || 'Test'} Inc.`,
      currentPrice: 150.25,
      priceChangePercent: 2.34,
      assetType: 'stock',
      sector: 'Technology',
      sentiment: { overall: 'positive', score: 15 },
      fundamentals: { type: 'stock', peRatio: 18.5, marketCap: 2.8 },
      timestamp: new Date().toISOString()
    });
  } else {
    res.json({ message: 'Simple backend working!' });
  }
}