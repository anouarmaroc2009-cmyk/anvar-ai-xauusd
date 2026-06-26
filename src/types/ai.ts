export type DailyBias = "bullish" | "bearish" | "neutral"
export type ConfluenceLevel = "none" | "low" | "medium" | "high" | "critical"

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

export interface SMCStructure {
  marketStructure: "uptrend" | "downtrend" | "ranging"
  liquiditySweeps: LiquiditySweep[]
  fairValueGaps: FVG[]
  orderBlocks: OrderBlock[]
  breaksOfStructure: BOS[]
  currentPhase: "accumulation" | "manipulation" | "distribution"
  dominantTimeframe: Timeframe
}
import { Timeframe } from "./market"

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

export interface ConfluenceResult {
  canExecute: boolean
  confidence: number
  macroAlignment: number
  microAlignment: number
  quantAlignment: number
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
