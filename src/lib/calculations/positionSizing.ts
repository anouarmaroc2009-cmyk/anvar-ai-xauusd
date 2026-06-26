export interface PositionSizingResult {
  size: number
  riskAmount: number
  riskPercent: number
  maxSize: number
  recommendedLeverage: number
}

export interface SizingParams {
  equity: number
  riskPercent: number
  entryPrice: number
  stopLoss: number
  maxRiskPercent?: number
  leverage?: number
}

const DEFAULT_MAX_RISK = 2
const DEFAULT_LEVERAGE = 1

export function calculatePositionSize(params: SizingParams): PositionSizingResult {
  const maxRisk = params.maxRiskPercent ?? DEFAULT_MAX_RISK
  const leverage = params.leverage ?? DEFAULT_LEVERAGE
  const riskPercent = Math.min(params.riskPercent, maxRisk)
  const riskAmount = params.equity * (riskPercent / 100)
  const priceRisk = Math.abs(params.entryPrice - params.stopLoss)

  if (priceRisk === 0) {
    return { size: 0, riskAmount: 0, riskPercent: 0, maxSize: 0, recommendedLeverage: 0 }
  }

  const size = (riskAmount / priceRisk) * leverage
  const maxSize = (params.equity * (maxRisk / 100) / priceRisk) * leverage

  const kellyFraction = calculateKellyFraction(
    params.entryPrice,
    params.stopLoss
  )

  const recommendedLeverage = kellyFraction > 0
    ? Math.min(Math.max(Math.round(kellyFraction * 10) / 10, 1), 5)
    : 1

  return {
    size: Math.round(size * 100) / 100,
    riskAmount: Math.round(riskAmount * 100) / 100,
    riskPercent: Math.round(riskPercent * 100) / 100,
    maxSize: Math.round(maxSize * 100) / 100,
    recommendedLeverage,
  }
}

export function calculateKellyFraction(
  entryPrice: number,
  stopLoss: number
): number {
  const presumedReward = Math.abs(entryPrice - stopLoss) * 1.5
  const winProbability = 0.55
  const lossProbability = 0.45
  const b = presumedReward / Math.abs(entryPrice - stopLoss)

  if (b <= 0) return 0
  return (winProbability * b - lossProbability) / b
}

export function calculateMaxDrawdown(
  equity: number,
  positions: { size: number; entry: number; sl: number }[]
): number {
  let totalRisk = 0
  for (const pos of positions) {
    totalRisk += Math.abs(pos.entry - pos.sl) * pos.size
  }
  return (totalRisk / equity) * 100
}
