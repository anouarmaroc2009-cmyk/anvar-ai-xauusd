import { MacroAnalysis, MacroEvent, DailyBias, NewsAnalysis, SMCStructure } from "@/types/ai"
import { XAUUSDNewsItem } from "@/types/news"

const EVENT_WEIGHTS: Record<string, number> = {
  FOMC: 0.35,
  CPI: 0.25,
  NFP: 0.15,
  GDP: 0.1,
  Geopolitical: 0.3,
  CentralBank: 0.2,
}

const NEWS_CATEGORY_EVENT_MAP: Record<string, string> = {
  "economic": "CPI",
  "geopolitical": "Geopolitical",
  "central-bank": "CentralBank",
  "market": "Other",
  "supply-demand": "Other",
}

const DXY_CORRELATION = -0.85
const REAL_YIELD_CORRELATION = -0.7

export class MacroEngine {
  private events: MacroEvent[] = []
  private riskFreeRate = 4.25
  private dxyIndex = 104.5

  ingestEvent(event: MacroEvent) {
    this.events.push(event)
    if (this.events.length > 50) this.events.shift()
  }

  ingestNewsAsEvent(item: XAUUSDNewsItem) {
    const mappedType = NEWS_CATEGORY_EVENT_MAP[item.category] ?? "Other"
    const event: MacroEvent = {
      id: `news_${item.id}`,
      type: mappedType as MacroEvent["type"],
      title: item.headline,
      impact: item.relevance === "high" ? "high" : item.relevance === "medium" ? "medium" : "low",
      timestamp: item.timestamp,
      summary: item.summary,
      sentiment: item.sentiment,
    }
    this.ingestEvent(event)
  }

  ingestNewsAnalysis(analysis: NewsAnalysis) {
    for (const h of analysis.recentHeadlines) {
      if (h.relevance === "high" || h.relevance === "medium") {
        const mappedType = NEWS_CATEGORY_EVENT_MAP[h.category] ?? "Other"
        const event: MacroEvent = {
          id: `news_${h.timestamp}_${Math.random().toString(36).slice(2, 6)}`,
          type: mappedType as MacroEvent["type"],
          title: h.headline,
          impact: h.relevance === "high" ? "high" : "medium",
          timestamp: h.timestamp,
          summary: `News sentiment: ${h.sentiment}, category: ${h.category}`,
          sentiment: h.sentiment,
        }
        this.ingestEvent(event)
      }
    }
  }

  setMacroEnvironment(dxy: number, riskFreeRate: number) {
    this.dxyIndex = dxy
    this.riskFreeRate = riskFreeRate
  }

  analyze(microStructure?: SMCStructure, newsAnalysis?: NewsAnalysis): MacroAnalysis {
    const activeEvents = this.events.filter(
      (e) => Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1000
    )

    const scoredEvents = activeEvents.map((e) => ({
      event: e,
      score: (EVENT_WEIGHTS[e.type] ?? 0.1) * (e.impact === "high" ? 1 : e.impact === "medium" ? 0.5 : 0.2),
    }))

    const totalScore = scoredEvents.reduce((a, b) => a + b.score, 0)
    const bullishScore = scoredEvents
      .filter((s) => s.event.sentiment === "bullish")
      .reduce((a, b) => a + b.score, 0)
    const bearishScore = scoredEvents
      .filter((s) => s.event.sentiment === "bearish")
      .reduce((a, b) => a + b.score, 0)

    const dxyComponent = ((this.dxyIndex - 100) / 100) * DXY_CORRELATION * 0.4
    const rateComponent = ((this.riskFreeRate - 4) / 4) * REAL_YIELD_CORRELATION * 0.2

    let netScore = (bullishScore - bearishScore) / (totalScore || 1) + dxyComponent + rateComponent

    let newsBoost = 0
    if (newsAnalysis && newsAnalysis.headlineCount > 0) {
      newsBoost = newsAnalysis.sentimentScore * 0.15
      if (newsAnalysis.sentimentShift === "improving") newsBoost += 0.05
      else if (newsAnalysis.sentimentShift === "deteriorating") newsBoost -= 0.05
      netScore += newsBoost
    }

    let microBoost = 0
    if (microStructure) {
      const bullishMicro = microStructure.marketStructure === "uptrend" ? 0.1
        : microStructure.marketStructure === "downtrend" ? -0.1 : 0
      const phaseBoost = microStructure.currentPhase === "accumulation" ? 0.08
        : microStructure.currentPhase === "distribution" ? -0.08 : 0
      microBoost = bullishMicro + phaseBoost
      netScore += microBoost
    }

    const reasoning: string[] = []
    let dailyBias: DailyBias = "neutral"
    let biasConfidence = Math.abs(netScore)

    if (netScore > 0.15) {
      dailyBias = "bullish"
      reasoning.push(`Bullish confluence: ${activeEvents.length} events, DXY ${this.dxyIndex.toFixed(1)}`)
    } else if (netScore < -0.15) {
      dailyBias = "bearish"
      reasoning.push(`Bearish confluence: ${activeEvents.length} events, DXY ${this.dxyIndex.toFixed(1)}`)
    } else {
      reasoning.push(`Neutral: insufficient directional conviction (score: ${netScore.toFixed(3)})`)
    }

    if (newsAnalysis && newsAnalysis.headlineCount > 0) {
      reasoning.push(`News sentiment: ${newsAnalysis.overallSentiment} (${newsAnalysis.headlineCount} headlines, shift: ${newsAnalysis.sentimentShift})`)
    }
    if (microStructure) {
      reasoning.push(`Micro structure: ${microStructure.marketStructure}, phase: ${microStructure.currentPhase}`)
      if (microStructure.liquiditySweeps.length > 0) {
        reasoning.push(`${microStructure.liquiditySweeps.length} liquidity sweeps detected`)
      }
    }
    if (newsBoost !== 0) reasoning.push(`News influence: ${(newsBoost * 100).toFixed(1)}%`)
    if (microBoost !== 0) reasoning.push(`Micro influence: ${(microBoost * 100).toFixed(1)}%`)

    const riskEnvironment: "risk-on" | "risk-off" | "mixed" = totalScore > 0.5
      ? "risk-off"
      : totalScore < 0.15
        ? "risk-on"
        : "mixed"

    reasoning.push(`Risk environment: ${riskEnvironment}`)
    reasoning.push(`DXY correlation: ${(dxyComponent * 100).toFixed(1)}% impact`)

    return {
      dailyBias,
      biasConfidence: Math.min(biasConfidence, 1),
      keyEvents: activeEvents.slice(0, 5),
      reasoning,
      riskEnvironment,
    }
  }
}

export const macroEngine = new MacroEngine()
