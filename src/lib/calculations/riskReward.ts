export interface RiskRewardResult {
  rrr: number
  riskPercent: number
  rewardPercent: number
  riskPoints: number
  rewardPoints: number
  breakevenProbability: number
}

export function calculateRiskReward(
  entry: number,
  stopLoss: number,
  takeProfit: number
): RiskRewardResult {
  const riskPoints = Math.abs(entry - stopLoss)
  const rewardPoints = Math.abs(takeProfit - entry)
  const rrr = riskPoints > 0 ? rewardPoints / riskPoints : 0
  const riskPercent = riskPoints / entry
  const rewardPercent = rewardPoints / entry

  const breakevenProbability = rrr > 0 ? 1 / (1 + rrr) : 0.5

  return {
    rrr: Math.round(rrr * 100) / 100,
    riskPercent: Math.round(riskPercent * 10000) / 100,
    rewardPercent: Math.round(rewardPercent * 10000) / 100,
    riskPoints,
    rewardPoints,
    breakevenProbability: Math.round(breakevenProbability * 10000) / 100,
  }
}

export function calculateOptimalStopLoss(
  atr: number,
  multiplier: number = 1.5
): number {
  return atr * multiplier
}

export function calculatePositionRisk(
  entry: number,
  stopLoss: number,
  size: number
): number {
  return Math.abs(entry - stopLoss) * size
}

export function calculateRewardAtTarget(
  entry: number,
  target: number,
  size: number
): number {
  return Math.abs(target - entry) * size
}
