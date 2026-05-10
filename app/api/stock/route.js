import { NextResponse } from 'next/server'

// Yahoo Finance proxy — returns % change from filing date to current price
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const rawTicker = (searchParams.get('ticker') || '').trim().toUpperCase()
  const date = (searchParams.get('date') || '').trim()  // e.g. "2025-01-17"

  if (!rawTicker || !/^[A-Z]{1,6}$/.test(rawTicker)) {
    return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${rawTicker}?interval=1d&range=2y`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CivicWatch/1.0; +https://civicwatch.app)',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json({ ticker: rawTicker, pct: null, error: 'Data unavailable' })
    }

    const json = await res.json()
    const result = json.chart?.result?.[0]
    if (!result) return NextResponse.json({ ticker: rawTicker, pct: null })

    const timestamps = result.timestamp || []
    const closes = result.indicators?.quote?.[0]?.close || []

    // Find last valid closing price
    let currentPrice = null
    for (let i = closes.length - 1; i >= 0; i--) {
      if (closes[i] != null) { currentPrice = closes[i]; break }
    }

    // Find price on or nearest to the filing date
    let filingDatePrice = null
    if (date) {
      const targetTs = new Date(date).getTime() / 1000
      if (!isNaN(targetTs)) {
        let minDiff = Infinity
        for (let i = 0; i < timestamps.length; i++) {
          if (closes[i] == null) continue
          const diff = Math.abs(timestamps[i] - targetTs)
          if (diff < minDiff) { minDiff = diff; filingDatePrice = closes[i] }
        }
      }
    }

    const pct =
      filingDatePrice && currentPrice && filingDatePrice > 0
        ? ((currentPrice - filingDatePrice) / filingDatePrice * 100).toFixed(1)
        : null

    return NextResponse.json({ ticker: rawTicker, currentPrice, filingDatePrice, pct })
  } catch {
    return NextResponse.json({ ticker: rawTicker, pct: null, error: 'Fetch failed' })
  }
}
