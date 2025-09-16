// /api/analyze.js  — Vercel Serverless Function (POST only)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', message: 'Only POST requests are allowed' });
  }

  try {
    const { symbol } = req.body || {};
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol required', message: 'Provide JSON body: { "symbol": "AAPL" }' });
    }

    // --- echte data ophalen (met timeouts) ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // Yahoo Finance chart endpoint (publiek, maar kan soms haperen)
    const yfResp = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
    }).catch(err => { throw new Error('Price fetch failed: ' + err.message); });

    clearTimeout(timeoutId);

    let priceBlock = null;
    if (yfResp.ok) {
      const json = await yfResp.json();
      const result = json?.chart?.result?.[0];
      const meta = result?.meta;
      if (meta) {
        priceBlock = {
          symbol: symbol.toUpperCase(),
          company: meta.longName || `${symbol.toUpperCase()} Inc.`,
          currentPrice: meta.regularMarketPrice ?? null,
          previousClose: meta.previousClose ?? null,
          priceChangePercent: meta.previousClose && meta.regularMarketPrice
            ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
            : null,
          trailingPE: meta.trailingPE ?? null,
          marketCap: meta.marketCap ?? null,
          trailingEps: meta.trailingEps ?? null,
        };
      }
    }

    // Fallback naar mock als Yahoo faalt
    if (!priceBlock) {
      priceBlock = {
        symbol: symbol.toUpperCase(),
        company: `${symbol.toUpperCase()} Inc.`,
        currentPrice: 150.25,
        previousClose: 146.58,
        priceChangePercent: 2.5,
        trailingPE: 25.4,
        marketCap: 2_500_000_000_000,
        trailingEps: 6.12,
      };
    }

    // (optioneel) mini news mock (voeg later echte news call toe)
    const news = [
      { headline: `${symbol.toUpperCase()} shows strong quarterly results`, source: 'MockWire' },
      { headline: `Analysts upgrade ${symbol.toUpperCase()} price target`, source: 'MockWire' },
    ];

    return res.status(200).json({
      ...priceBlock,
      assetType: 'stock',
      sector: 'Technology',
      sentiment: { overall: 'neutral', score: 0, articles: news },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Analyze error:', err);
    return res.status(500).json({ error: 'Analysis failed', details: String(err?.message || err) });
  }
}
