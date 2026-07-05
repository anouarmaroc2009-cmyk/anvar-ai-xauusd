import { macroEngine, MacroEngine } from "./macroEngine"
import { smcEngine, SMCEngine } from "./microEngine"
import { newsAnalyzer, NewsAnalyzer } from "./newsAnalyzer"
import { confluenceFilter, ConfluenceFilter } from "./confluenceFilter"
import { UnifiedAnalysis, DailyBias, QuantitativeSignal } from "@/types/ai"
import { XAUUSDNewsItem } from "@/types/news"
import { OHLCBar } from "@/types/market"

export class AnalysisOrchestrator {
  private macro: MacroEngine
  private micro: SMCEngine
  private news: NewsAnalyzer
  private confluence: ConfluenceFilter

  constructor() {
    this.macro = macroEngine
    this.micro = smcEngine
    this.news = newsAnalyzer
    this.confluence = confluenceFilter
  }

  ingestNewsItem(item: XAUUSDNewsItem) {
    this.news.ingest(item)
    this.macro.ingestNewsAsEvent(item)
  }

  ingestNewsBatch(items: XAUUSDNewsItem[]) {
    for (const item of items) {
      this.ingestNewsItem(item)
    }
  }

  feedBars(timeframe: string, bars: OHLCBar[]) {
    this.micro.feedBars(timeframe as any, bars)
  }

  analyze(quantSignal?: QuantitativeSignal): UnifiedAnalysis {
    const newsAnalysis = this.news.analyze()
    const microStructure = this.micro.getStructure("1h")
    const macroAnalysis = this.macro.analyze(microStructure, newsAnalysis)

    const defaultQuant: QuantitativeSignal = quantSignal ?? {
      signal: "neutral",
      strength: 0,
      rsi: 50,
      momentum: 0,
      volumeProfile: "neutral",
      support: microStructure.fairValueGaps.length > 0
        ? microStructure.fairValueGaps[0].bottom
        : 0,
      resistance: microStructure.fairValueGaps.length > 0
        ? microStructure.fairValueGaps[0].top
        : 0,
    }

    const confluence = this.confluence.evaluate(macroAnalysis, microStructure, defaultQuant, newsAnalysis)

    const newsWeight = 0.2
    const macroWeight = 0.4
    const microWeight = 0.4

    const macroScore = macroAnalysis.dailyBias === "bullish" ? 1 : macroAnalysis.dailyBias === "bearish" ? -1 : 0
    const microScore = microStructure.marketStructure === "uptrend" ? 1 : microStructure.marketStructure === "downtrend" ? -1 : 0
    const newsScore = newsAnalysis.overallSentiment === "bullish" ? 1 : newsAnalysis.overallSentiment === "bearish" ? -1 : 0

    const weightedScore = macroScore * macroWeight + microScore * microWeight + newsScore * newsWeight
    let overallBias: DailyBias = "neutral"
    if (weightedScore > 0.15) overallBias = "bullish"
    else if (weightedScore < -0.15) overallBias = "bearish"

    const rawConfidence = Math.abs(weightedScore) * 0.7 + confluence.confidence * 0.3
    const biasConfidence = Math.min(rawConfidence, 1)

    const directionStrength: "strong" | "moderate" | "weak" =
      biasConfidence > 0.7 ? "strong"
        : biasConfidence > 0.4 ? "moderate"
        : "weak"

    const supports = [
      ...microStructure.fairValueGaps.filter((f) => !f.filled).map((f) => f.bottom),
      ...microStructure.orderBlocks.filter((ob) => ob.type === "bullish" && !ob.tested).map((ob) => ob.bottom),
    ]

    const resistances = [
      ...microStructure.fairValueGaps.filter((f) => !f.filled).map((f) => f.top),
      ...microStructure.orderBlocks.filter((ob) => ob.type === "bearish" && !ob.tested).map((ob) => ob.top),
    ]

    const reasons: string[] = [
      ...confluence.reasons,
      `Macro: ${macroAnalysis.dailyBias} (${(macroAnalysis.biasConfidence * 100).toFixed(0)}%)`,
      `Micro: ${microStructure.marketStructure} (${microStructure.currentPhase})`,
      `News: ${newsAnalysis.overallSentiment} (${newsAnalysis.bullishCount}B/${newsAnalysis.bearishCount}S)`,
    ]

    if (newsAnalysis.sentimentShift !== "stable") {
      reasons.push(`News momentum: ${newsAnalysis.sentimentShift}`)
    }
    if (macroAnalysis.keyEvents.length > 0) {
      reasons.push(`Key event: ${macroAnalysis.keyEvents[0].type} — ${macroAnalysis.keyEvents[0].sentiment}`)
    }

    let suggestedAction: UnifiedAnalysis["suggestedAction"] = "wait"
    if (confluence.canExecute && confluence.confidence > 0.7) {
      suggestedAction = overallBias === "bullish" ? "buy" : overallBias === "bearish" ? "sell" : "wait"
    } else if (confluence.canExecute) {
      suggestedAction = overallBias === "bullish" ? "buy" : overallBias === "bearish" ? "sell" : "wait"
    }

    return {
      timestamp: Date.now(),
      overallBias,
      biasConfidence,
      directionStrength,
      macro: macroAnalysis,
      micro: microStructure,
      news: newsAnalysis,
      keyLevels: {
        support: supports.length > 0 ? [...new Set(supports)].sort((a, b) => b - a).slice(0, 3) : [2350],
        resistance: resistances.length > 0 ? [...new Set(resistances)].sort((a, b) => a - b).slice(0, 3) : [2400],
        orderBlockZones: microStructure.orderBlocks.filter((ob) => !ob.tested).map((ob) => ({
          type: ob.type,
          top: ob.top,
          bottom: ob.bottom,
          strength: ob.strength,
        })),
        fvgZones: microStructure.fairValueGaps.filter((f) => !f.filled).map((f) => ({
          top: f.top,
          bottom: f.bottom,
          strength: f.strength,
          filled: f.filled,
        })),
      },
      entryBias: overallBias === "bullish" ? "buy" : overallBias === "bearish" ? "sell" : "neutral",
      entryConfidence: confluence.confidence,
      riskScore: confluence.riskScore,
      reasons: reasons.slice(0, 6),
      suggestedAction,
    }
  }
}

export const orchestrator = new AnalysisOrchestrator()
