import { NextResponse } from "next/server"

let cachedPrice: number | null = null
let cacheTime = 0
const CACHE_TTL = 15000

export async function GET() {
  if (cachedPrice && Date.now() - cacheTime < CACHE_TTL) {
    return NextResponse.json({ price: cachedPrice, source: "cache" })
  }

  const urls = [
    "https://api.metals.live/v1/spot/gold",
    "https://www.goldapi.io/api/XAU/USD",
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, { next: { revalidate: 15 } })
      if (!res.ok) continue
      const data = await res.json()

      let price: number | null = null
      if (data?.gold?.price) price = data.gold.price
      else if (data?.price) price = data.price
      else if (Array.isArray(data) && data[0]?.price) price = data[0].price

      if (price && price > 1000) {
        cachedPrice = price
        cacheTime = Date.now()
        return NextResponse.json({ price, source: "api" })
      }
    } catch {
      continue
    }
  }

  if (cachedPrice) {
    return NextResponse.json({ price: cachedPrice, source: "stale-cache" })
  }

  return NextResponse.json({ price: null, source: "none" }, { status: 503 })
}
