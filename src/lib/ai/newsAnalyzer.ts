import { XAUUSDNewsItem } from "@/types/news"
import { NewsAnalysis, NewsSentiment, DailyBias, NewsCategory } from "@/types/ai"

const CATEGORY_EVENT_MAP: Record<string, string> = {
  "economic": "CPI",
  "geopolitical": "Geopolitical",
  "central-bank": "CentralBank",
  "market": "Other",
  "supply-demand": "Other",
}

export class NewsAnalyzer {
  private headlines: NewsSentiment[] = []
  private maxHeadlines = 100

  ingest(item: XAUUSDNewsItem) {
    this.headlines.push({
      headline: item.headline,
      sentiment: item.sentiment,
      category: item.category,
      relevance: item.relevance,
      timestamp: item.timestamp,
    })
    if (this.headlines.length > this.maxHeadlines) {
      this.headlines = this.headlines.slice(-this.maxHeadlines)
    }
  }

  ingestBatch(items: XAUUSDNewsItem[]) {
    for (const item of items) {
      this.ingest(item)
    }
  }

  analyze(): NewsAnalysis {
    const recent = this.headlines.filter(
      (h) => Date.now() - h.timestamp < 24 * 60 * 60 * 1000
    )
    if (recent.length === 0) {
      return {
        overallSentiment: "neutral",
        sentimentScore: 0,
        headlineCount: 0,
        recentHeadlines: [],
        bullishCount: 0,
        bearishCount: 0,
        dominantCategory: null,
        sentimentShift: "stable",
      }
    }

    const weighted = recent.map((h) => {
      const relevanceWeight = h.relevance === "high" ? 1 : h.relevance === "medium" ? 0.5 : 0.2
      const recencyWeight = Math.max(0, 1 - (Date.now() - h.timestamp) / (24 * 60 * 60 * 1000))
      const sentimentVal = h.sentiment === "bullish" ? 1 : h.sentiment === "bearish" ? -1 : 0
      return { ...h, weight: relevanceWeight * recencyWeight, sentimentVal }
    })

    const totalWeight = weighted.reduce((a, b) => a + b.weight, 0)
    const sentimentScore = totalWeight > 0
      ? weighted.reduce((a, b) => a + b.sentimentVal * b.weight, 0) / totalWeight
      : 0

    const bullishCount = weighted.filter((h) => h.sentiment === "bullish").length
    const bearishCount = weighted.filter((h) => h.sentiment === "bearish").length

    const categoryCounts: Record<string, number> = {}
    for (const h of weighted) {
      categoryCounts[h.category] = (categoryCounts[h.category] || 0) + 1
    }
    const dominantCategory = (Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as NewsCategory | null

    const half = Math.floor(recent.length / 2)
    const recentHalf = recent.slice(half)
    const olderHalf = recent.slice(0, half)
    const recentScore = recentHalf.reduce((a, h) => a + (h.sentiment === "bullish" ? 1 : h.sentiment === "bearish" ? -1 : 0), 0)
    const olderScore = olderHalf.reduce((a, h) => a + (h.sentiment === "bullish" ? 1 : h.sentiment === "bearish" ? -1 : 0), 0)
    const sentimentShift: "improving" | "deteriorating" | "stable" =
      recentScore > olderScore + 1 ? "improving"
        : recentScore < olderScore - 1 ? "deteriorating"
        : "stable"

    let overallSentiment: DailyBias = "neutral"
    if (sentimentScore > 0.15) overallSentiment = "bullish"
    else if (sentimentScore < -0.15) overallSentiment = "bearish"

    return {
      overallSentiment,
      sentimentScore,
      headlineCount: recent.length,
      recentHeadlines: recent.slice(-10).reverse(),
      bullishCount,
      bearishCount,
      dominantCategory,
      sentimentShift,
    }
  }

  getDominantMacroEventType(): string {
    const cats = this.headlines.map((h) => CATEGORY_EVENT_MAP[h.category] ?? "Other")
    const counts: Record<string, number> = {}
    for (const c of cats) counts[c] = (counts[c] || 0) + 1
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Other"
  }

  getRecentSentimentMomentum(): number {
    const recent = this.headlines.slice(-20)
    if (recent.length < 5) return 0
    const third = Math.floor(recent.length / 3)
    const latest = recent.slice(-third)
    const earliest = recent.slice(0, third)
    const latestScore = latest.reduce((a, h) => a + (h.sentiment === "bullish" ? 1 : h.sentiment === "bearish" ? -1 : 0), 0)
    const earliestScore = earliest.reduce((a, h) => a + (h.sentiment === "bullish" ? 1 : h.sentiment === "bearish" ? -1 : 0), 0)
    return latestScore - earliestScore
  }

  clear() {
    this.headlines = []
  }
}

export const newsAnalyzer = new NewsAnalyzer()
