export interface XAUUSDNewsItem {
  id: string
  headline: string
  summary: string
  source: string
  url: string
  timestamp: number
  sentiment: "bullish" | "bearish" | "neutral"
  relevance: "high" | "medium" | "low"
  category: "economic" | "geopolitical" | "central-bank" | "market" | "supply-demand"
}

export interface XAUUSDNewsState {
  items: XAUUSDNewsItem[]
  lastUpdated: number
  loading: boolean
  error: string | null
}
