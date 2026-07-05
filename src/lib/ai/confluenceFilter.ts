import { MacroAnalysis, SMCStructure, QuantitativeSignal, ConfluenceResult, NewsAnalysis } from "@/types/ai"

const MACRO_WEIGHT = 0.25
const MICRO_WEIGHT = 0.3
const QUANT_WEIGHT = 0.25
const NEWS_WEIGHT = 0.2
const MIN_CONFIDENCE = 0.65

export class ConfluenceFilter {
  evaluate(
    macro: MacroAnalysis,
    micro: SMCStructure,
    quant: QuantitativeSignal,
    news?: NewsAnalysis,
  ): ConfluenceResult {
    const macroAlignment = this.scoreMacro(macro, quant)
    const microAlignment = this.scoreMicro(micro, quant)
    const quantAlignment = this.scoreQuant(quant)
    const newsAlignment = news ? this.scoreNews(news, macro) : 0.5

    const weightedScore =
      macroAlignment * MACRO_WEIGHT +
      microAlignment * MICRO_WEIGHT +
      quantAlignment * QUANT_WEIGHT +
      newsAlignment * NEWS_WEIGHT

    const score = weightedScore / (MACRO_WEIGHT + MICRO_WEIGHT + QUANT_WEIGHT + NEWS_WEIGHT)

    const reasons: string[] = []
    if (macroAlignment > 0.6) reasons.push("Macro bias aligns with quantitative direction")
    if (microAlignment > 0.6) reasons.push("SMC structure confirms institutional positioning")
    if (quantAlignment > 0.6) reasons.push("Quantitative triggers at confluence zone")
    if (newsAlignment > 0.6) reasons.push("News sentiment aligns with directional bias")
    if (score > 0.8) reasons.push("High confluence: all engines aligned")
    if (macroAlignment < 0.3) reasons.push("Macro headwind: conflicting directional bias")
    if (microAlignment < 0.3) reasons.push("Micro chop: no clear SMC structure")
    if (quantAlignment < 0.3) reasons.push("Quant neutral: awaiting momentum trigger")
    if (news && newsAlignment < 0.3) reasons.push("News headwind: sentiment diverges from technicals")

    const canExecute = score >= MIN_CONFIDENCE && macroAlignment > 0.3
    const riskScore = this.calculateRiskScore(macro, micro, quant, news)

    return {
      canExecute,
      confidence: score,
      macroAlignment,
      microAlignment,
      quantAlignment,
      newsAlignment,
      riskScore,
      reasons: reasons.slice(0, 5),
    }
  }

  private scoreMacro(macro: MacroAnalysis, quant: QuantitativeSignal): number {
    let score = 0.5
    if (macro.dailyBias === "bullish" && quant.signal === "buy") score += 0.4
    else if (macro.dailyBias === "bearish" && quant.signal === "sell") score += 0.4
    else if (macro.dailyBias === "neutral") score += 0.0
    else score -= 0.2
    return Math.min(Math.max(score, 0), 1)
  }

  private scoreMicro(micro: SMCStructure, quant: QuantitativeSignal): number {
    let score = 0.5
    const hasSweep = micro.liquiditySweeps.length > 0
    const hasFVG = micro.fairValueGaps.some((f) => !f.filled)
    const hasOB = micro.orderBlocks.some((ob) => !ob.tested)
    const hasBOS = micro.breaksOfStructure.length > 0

    if (hasSweep) score += 0.15
    if (hasFVG) score += 0.15
    if (hasOB) score += 0.15
    if (hasBOS) score += 0.15

    if (
      (micro.marketStructure === "uptrend" && quant.signal === "sell") ||
      (micro.marketStructure === "downtrend" && quant.signal === "buy")
    ) {
      score -= 0.4
    }

    return Math.min(Math.max(score, 0), 1)
  }

  private scoreQuant(quant: QuantitativeSignal): number {
    let score = 0.5
    if (quant.signal === "buy" || quant.signal === "sell") score += 0.25
    if (quant.strength > 0.7) score += 0.15
    if (quant.volumeProfile !== "neutral") score += 0.1
    return Math.min(Math.max(score, 0), 1)
  }

  private scoreNews(news: NewsAnalysis, macro: MacroAnalysis): number {
    let score = 0.5
    if (news.headlineCount === 0) return 0.5

    const bias = macro.dailyBias
    if (news.overallSentiment === bias) score += 0.3
    else if (news.overallSentiment === "neutral") score += 0
    else score -= 0.2

    if (news.sentimentShift === "improving" && bias === "bullish") score += 0.1
    else if (news.sentimentShift === "deteriorating" && bias === "bearish") score += 0.1
    else if (news.sentimentShift !== "stable") score -= 0.05

    if (news.headlineCount > 5) score += 0.1

    return Math.min(Math.max(score, 0), 1)
  }

  private calculateRiskScore(
    macro: MacroAnalysis,
    micro: SMCStructure,
    quant: QuantitativeSignal,
    news?: NewsAnalysis,
  ): number {
    let risk = 0.5
    if (macro.riskEnvironment === "risk-off") risk += 0.2
    if (micro.currentPhase === "manipulation") risk += 0.15
    if (quant.volumeProfile === "neutral") risk += 0.1
    if (macro.biasConfidence < 0.4) risk += 0.1

    if (news) {
      if (news.sentimentShift !== "stable") risk += 0.1
      if (news.overallSentiment !== macro.dailyBias) risk += 0.1
    }
    return Math.min(risk, 1)
  }
}

export const confluenceFilter = new ConfluenceFilter()
