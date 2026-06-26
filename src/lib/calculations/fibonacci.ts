export interface FibonacciLevel {
  level: number
  ratio: number
  price: number
  type: "support" | "resistance" | "entry" | "target"
}

export const FIBONACCI_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.414, 1.618]

export function calculateFibonacciLevels(
  high: number,
  low: number,
  direction: "retracement" | "extension"
): FibonacciLevel[] {
  const range = high - low
  const isUptrend = direction === "retracement"

  const levels: FibonacciLevel[] = FIBONACCI_RATIOS.map((ratio) => {
    let price: number
    let type: FibonacciLevel["type"]

    if (isUptrend) {
      price = high - range * ratio
      if (ratio <= 0.382) type = "resistance"
      else if (ratio <= 0.618) type = "entry"
      else type = "support"
    } else {
      price = low + range * ratio
      if (ratio <= 0.382) type = "support"
      else if (ratio <= 0.618) type = "entry"
      else type = "resistance"
    }

    if (ratio >= 1) type = "target"

    return { level: ratio, ratio, price: Math.round(price * 100) / 100, type }
  })

  return levels
}

export function findFibonacciConfluence(
  swingHighs: number[],
  swingLows: number[],
  currentPrice: number
): FibonacciLevel[] {
  const levels: FibonacciLevel[] = []

  for (let i = 0; i < Math.min(swingHighs.length, swingLows.length, 3); i++) {
    const high = swingHighs[i]
    const low = swingLows[i]
    const retracementLevels = calculateFibonacciLevels(high, low, "retracement")

    for (const level of retracementLevels) {
      const distance = Math.abs(level.price - currentPrice) / currentPrice
      if (distance < 0.005) {
        levels.push(level)
      }
    }
  }

  return levels
}

export function findNearestFibLevel(
  levels: FibonacciLevel[],
  price: number
): FibonacciLevel | null {
  let nearest: FibonacciLevel | null = null
  let minDist = Infinity

  for (const level of levels) {
    const dist = Math.abs(level.price - price)
    if (dist < minDist) {
      minDist = dist
      nearest = level
    }
  }

  return nearest
}
