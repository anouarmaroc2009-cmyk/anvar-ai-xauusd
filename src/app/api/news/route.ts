import { NextResponse } from "next/server"

const NEWS_API_URL = "https://newsapi.org/v2/everything"
const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query"

const FALLBACK_NEWS = [
  { headline: "Gold Steady as Markets Digest Fed Commentary", sentiment: "neutral", category: "central-bank", summary: "Gold prices hold steady as traders assess latest Federal Reserve commentary on monetary policy trajectory." },
  { headline: "XAUUSD Technicals Point to Breakout Above Resistance", sentiment: "bullish", category: "market", summary: "Gold chart patterns suggest potential upside breakout as key resistance level weakens." },
  { headline: "Central Bank Gold Reserves Expand Across Emerging Markets", sentiment: "bullish", category: "central-bank", summary: "Multiple central banks continue strategic gold accumulation, supporting long-term price outlook." },
  { headline: "Gold Volatility Drops Ahead of Key Economic Data", sentiment: "neutral", category: "economic", summary: "Implied volatility in gold options declines as market awaits employment and inflation reports." },
  { headline: "Physical Gold Premiums Rise in India on Festival Demand", sentiment: "bullish", category: "supply-demand", summary: "Gold demand surges in India during wedding and festival season, lifting physical premiums." },
]

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY
  const avKey = process.env.ALPHA_VANTAGE_KEY

  if (apiKey) {
    try {
      const url = `${NEWS_API_URL}?q=${encodeURIComponent("gold XAUUSD")}&language=en&sortBy=publishedAt&pageSize=15&apiKey=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 120 } })
      if (res.ok) {
        const data = await res.json()
        const articles = data.articles?.map((a: any, i: number) => ({
          id: `api_${i}`,
          headline: a.title,
          summary: a.description || a.content || "",
          source: a.source?.name || "News",
          url: a.url,
          timestamp: new Date(a.publishedAt).getTime(),
          sentiment: inferSentiment(a.title),
          relevance: "medium",
          category: "market" as const,
        })) ?? []
        if (articles.length > 0) return NextResponse.json({ items: articles, source: "newsapi" })
      }
    } catch {}
  }

  if (avKey) {
    try {
      const url = `${ALPHA_VANTAGE_URL}?function=NEWS_SENTIMENT&tickers=XAUUSD&apikey=${avKey}&limit=15`
      const res = await fetch(url, { next: { revalidate: 120 } })
      if (res.ok) {
        const data = await res.json()
        const articles = data.feed?.map((a: any, i: number) => ({
          id: `av_${i}`,
          headline: a.title,
          summary: a.summary,
          source: a.source,
          url: a.url,
          timestamp: new Date(a.time_published).getTime(),
          sentiment: a.overall_sentiment_label === "Bullish" ? "bullish" : a.overall_sentiment_label === "Bearish" ? "bearish" : "neutral",
          relevance: a.overall_sentiment_score > 0.25 ? "high" : a.overall_sentiment_score > 0.1 ? "medium" : "low",
          category: "market" as const,
        })) ?? []
        if (articles.length > 0) return NextResponse.json({ items: articles, source: "alphavantage" })
      }
    } catch {}
  }

  const mockNews = FALLBACK_NEWS.map((n, i) => ({
    ...n,
    id: `fallback_${i}`,
    source: "Gold Market Wire",
    url: "#",
    timestamp: Date.now() - i * 900000,
    relevance: "medium" as const,
  }))

  return NextResponse.json({ items: mockNews, source: "fallback" })
}

function inferSentiment(title: string): "bullish" | "bearish" | "neutral" {
  const t = title?.toLowerCase() ?? ""
  if (/\b(surge|rally|gain|breakout|bullish|upside|jump|soar|climb|high|support|accumulation)\b/.test(t)) return "bullish"
  if (/\b(slide|drop|fall|decline|bearish|downside|plunge|selloff|low|resist|pressure|retreat)\b/.test(t)) return "bearish"
  return "neutral"
}
