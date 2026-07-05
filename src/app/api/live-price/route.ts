import { NextResponse } from "next/server"

let cachedPrice: number | null = null
let cachedBid: number | null = null
let cachedAsk: number | null = null
let cacheTime = 0
const CACHE_TTL = 12000

async function fetchAlphaVantage() {
  const key = process.env.ALPHA_VANTAGE_API_KEY
  if (!key) return null
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${key}`,
      { next: { revalidate: 12 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const rate = data?.["Realtime Currency Exchange Rate"]
    if (!rate) return null
    const price = parseFloat(rate["5. Exchange Rate"])
    if (isNaN(price) || price < 1000) return null
    return {
      price,
      bid: rate["8. Bid Price"] ? parseFloat(rate["8. Bid Price"]) : price - 0.3,
      ask: rate["9. Ask Price"] ? parseFloat(rate["9. Ask Price"]) : price + 0.3,
    }
  } catch {
    return null
  }
}

async function fetchMetalsLive() {
  try {
    const res = await fetch("https://api.metals.live/v1/spot/gold")
    if (!res.ok) return null
    const data = await res.json()
    const price = data?.gold?.price ?? data?.price ?? data?.[0]?.price
    if (price && price > 1000) return { price, bid: price - 0.15, ask: price + 0.15 }
  } catch {}
  return null
}

export async function GET() {
  if (cachedPrice && Date.now() - cacheTime < CACHE_TTL) {
    return NextResponse.json({ bid: cachedBid, ask: cachedAsk, price: cachedPrice, source: "cache" })
  }

  const result = (await fetchAlphaVantage()) || (await fetchMetalsLive())

  if (result) {
    cachedPrice = result.price
    cachedBid = result.bid
    cachedAsk = result.ask
    cacheTime = Date.now()
    return NextResponse.json({ ...result, source: "api" })
  }

  if (cachedPrice && Date.now() - cacheTime < 60000) {
    return NextResponse.json({ bid: cachedBid, ask: cachedAsk, price: cachedPrice, source: "stale-cache" })
  }

  return NextResponse.json({ bid: null, ask: null, price: null, source: "none" }, { status: 503 })
}
