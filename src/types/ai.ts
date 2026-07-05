export type DailyBias = "bullish" | "bearish" | "neutral"
export type ConfluenceLevel = "none" | "low" | "medium" | "high" | "critical"
export type NewsCategory = "economic" | "geopolitical" | "central-bank" | "market" | "supply-demand"

export interface MacroEvent {
  id: string
  type: "CPI" | "FOMC" | "NFP" | "GDP" | "Geopolitical" | "CentralBank" | "Other"
  title: string
  impact: "low" | "medium" | "high"
  timestamp: number
  summary: string
  sentiment: "bullish" | "bearish" | "neutral"
}

export interface MacroAnalysis {
  dailyBias: DailyBias
  biasConfidence: number
  keyEvents: MacroEvent[]
  reasoning: string[]
  riskEnvironment: "risk-on" | "risk-off" | "mixed"
}

import { Timeframe } from "./market"

export interface SMCStructure {
  marketStructure: "uptrend" | "downtrend" | "ranging"
  liquiditySweeps: LiquiditySweep[]
  fairValueGaps: FVG[]
  orderBlocks: OrderBlock[]
  breaksOfStructure: BOS[]
  currentPhase: "accumulation" | "manipulation" | "distribution"
  dominantTimeframe: Timeframe
}

export interface LiquiditySweep {
  timestamp: number
  price: number
  side: "buy" | "sell"
  magnitude: number
  sweptLevel: number
}

export interface FVG {
  timestamp: number
  top: number
  bottom: number
  strength: number
  filled: boolean
  timeframe: Timeframe
}

export interface OrderBlock {
  timestamp: number
  top: number
  bottom: number
  type: "bullish" | "bearish"
  strength: number
  tested: boolean
}

export interface BOS {
  timestamp: number
  price: number
  direction: "bullish" | "bearish"
  magnitude: number
}

export interface QuantitativeSignal {
  signal: "buy" | "sell" | "neutral"
  strength: number
  rsi: number
  momentum: number
  volumeProfile: "accumulating" | "distributing" | "neutral"
  support: number
  resistance: number
}

export interface NewsSentiment {
  headline: string
  sentiment: "bullish" | "bearish" | "neutral"
  category: NewsCategory
  relevance: "high" | "medium" | "low"
  timestamp: number
}

export interface NewsAnalysis {
  overallSentiment: DailyBias
  sentimentScore: number
  headlineCount: number
  recentHeadlines: NewsSentiment[]
  bullishCount: number
  bearishCount: number
  dominantCategory: NewsCategory | null
  sentimentShift: "improving" | "deteriorating" | "stable"
}

export interface UnifiedAnalysis {
  timestamp: number
  overallBias: DailyBias
  biasConfidence: number
  directionStrength: "strong" | "moderate" | "weak"
  macro: MacroAnalysis
  micro: SMCStructure
  news: NewsAnalysis
  keyLevels: {
    support: number[]
    resistance: number[]
    orderBlockZones: { type: "bullish" | "bearish"; top: number; bottom: number; strength: number }[]
    fvgZones: { top: number; bottom: number; strength: number; filled: boolean }[]
  }
  entryBias: "buy" | "sell" | "neutral"
  entryConfidence: number
  riskScore: number
  reasons: string[]
  suggestedAction: "wait" | "buy" | "sell" | "close-long" | "close-short"
}

export interface ConfluenceResult {
  canExecute: boolean
  confidence: number
  macroAlignment: number
  microAlignment: number
  quantAlignment: number
  newsAlignment: number
  riskScore: number
  reasons: string[]
}

export interface ExecutionOrder {
  id: string
  type: "market" | "limit" | "stop"
  side: "buy" | "sell"
  size: number
  price: number
  stopLoss: number
  takeProfit: number
  riskPercent: number
  rrr: number
  confluenceScore: number
  status: "pending" | "active" | "filled" | "cancelled" | "rejected"
  created: number
}
