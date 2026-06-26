import { SMCStructure, LiquiditySweep, FVG, OrderBlock, BOS } from "@/types/ai"
import { OHLCBar, Timeframe } from "@/types/market"

const SWEEP_THRESHOLD_PERCENT = 0.0015
const FVG_MIN_SIZE_PIPS = 2

export class SMCEngine {
  private bars: Map<Timeframe, OHLCBar[]> = new Map()
  private structures = new Map<Timeframe, SMCStructure>()

  feedBars(timeframe: Timeframe, bars: OHLCBar[]) {
    this.bars.set(timeframe, bars)
    this.analyzeTimeframe(timeframe)
  }

  private analyzeTimeframe(tf: Timeframe) {
    const bars = this.bars.get(tf)
    if (!bars || bars.length < 20) return

    const liquiditySweeps = this.detectLiquiditySweeps(bars, tf)
    const fairValueGaps = this.detectFVGs(bars, tf)
    const orderBlocks = this.detectOrderBlocks(bars)
    const breaksOfStructure = this.detectBOS(bars)

    const currentPrice = bars[bars.length - 1].close
    const prevClose = bars[bars.length - 3]?.close ?? currentPrice

    let marketStructure: "uptrend" | "downtrend" | "ranging"
    const recentHighs = bars.slice(-10).map((b) => b.high)
    const recentLows = bars.slice(-10).map((b) => b.low)
    const avgHigh = recentHighs.reduce((a, b) => a + b, 0) / recentHighs.length
    const avgLow = recentLows.reduce((a, b) => a + b, 0) / recentLows.length
    const range = avgHigh - avgLow
    const avgPrice = (avgHigh + avgLow) / 2
    const rangePercent = range / avgPrice

    if (rangePercent < 0.01) {
      marketStructure = "ranging"
    } else if (currentPrice > prevClose) {
      marketStructure = "uptrend"
    } else {
      marketStructure = "downtrend"
    }

    const dominantTimeframe = this.determineDominantTF()

    this.structures.set(tf, {
      marketStructure,
      liquiditySweeps,
      fairValueGaps,
      orderBlocks,
      breaksOfStructure,
      currentPhase: this.determinePhase(bars),
      dominantTimeframe,
    })
  }

  private detectLiquiditySweeps(bars: OHLCBar[], _tf: Timeframe): LiquiditySweep[] {
    const sweeps: LiquiditySweep[] = []
    for (let i = 5; i < bars.length; i++) {
      const prevHigh = Math.max(...bars.slice(i - 5, i).map((b) => b.high))
      const prevLow = Math.min(...bars.slice(i - 5, i).map((b) => b.low))
      const bar = bars[i]

      if (bar.high > prevHigh && bar.close < prevHigh) {
        sweeps.push({
          timestamp: bar.time,
          price: bar.high,
          side: "buy",
          magnitude: (bar.high - prevHigh) / prevHigh,
          sweptLevel: prevHigh,
        })
      }
      if (bar.low < prevLow && bar.close > prevLow) {
        sweeps.push({
          timestamp: bar.time,
          price: bar.low,
          side: "sell",
          magnitude: (prevLow - bar.low) / prevLow,
          sweptLevel: prevLow,
        })
      }
    }
    return sweeps.slice(-10)
  }

  private detectFVGs(bars: OHLCBar[], _tf: Timeframe): FVG[] {
    const fvgs: FVG[] = []
    for (let i = 2; i < bars.length; i++) {
      const prevBar = bars[i - 2]
      const currentBar = bars[i]
      const fvgTop = Math.min(prevBar.low, currentBar.low)
      const fvgBottom = Math.max(prevBar.high, currentBar.high)

      if (fvgTop > fvgBottom) {
        const size = (fvgTop - fvgBottom) / fvgBottom
        if (size > FVG_MIN_SIZE_PIPS * 0.0001) {
          const filled = bars.slice(i + 1).some((b) => b.low <= fvgTop && b.high >= fvgBottom)
          fvgs.push({
            timestamp: currentBar.time,
            top: fvgTop,
            bottom: fvgBottom,
            strength: Math.min(size * 10000, 1),
            filled,
            timeframe: _tf,
          })
        }
      }
    }
    return fvgs.slice(-5)
  }

  private detectOrderBlocks(bars: OHLCBar[]): OrderBlock[] {
    const blocks: OrderBlock[] = []
    for (let i = 3; i < bars.length; i++) {
      const prevBar = bars[i - 1]
      const currentBar = bars[i]

      if (currentBar.close > currentBar.open && prevBar.close < prevBar.open) {
        blocks.push({
          timestamp: currentBar.time,
          top: Math.max(prevBar.open, prevBar.close),
          bottom: Math.min(prevBar.open, prevBar.close),
          type: "bullish",
          strength: (currentBar.close - prevBar.low) / prevBar.low,
          tested: false,
        })
      } else if (currentBar.close < currentBar.open && prevBar.close > prevBar.open) {
        blocks.push({
          timestamp: currentBar.time,
          top: Math.max(prevBar.open, prevBar.close),
          bottom: Math.min(prevBar.open, prevBar.close),
          type: "bearish",
          strength: (prevBar.high - currentBar.close) / currentBar.close,
          tested: false,
        })
      }
    }
    return blocks.slice(-5)
  }

  private detectBOS(bars: OHLCBar[]): BOS[] {
    const breaks: BOS[] = []
    for (let i = 10; i < bars.length; i++) {
      const swingHighs = bars.slice(i - 10, i).filter((_, j, arr) => {
        return j > 0 && j < arr.length - 1 && arr[j].high > arr[j - 1].high && arr[j].high > arr[j + 1].high
      })
      const swingLows = bars.slice(i - 10, i).filter((_, j, arr) => {
        return j > 0 && j < arr.length - 1 && arr[j].low < arr[j - 1].low && arr[j].low < arr[j + 1].low
      })

      const bar = bars[i]
      if (swingHighs.length > 0 && bar.close > swingHighs[swingHighs.length - 1].high) {
        breaks.push({
          timestamp: bar.time,
          price: bar.close,
          direction: "bullish",
          magnitude: (bar.close - swingHighs[swingHighs.length - 1].high) / swingHighs[swingHighs.length - 1].high,
        })
      }
      if (swingLows.length > 0 && bar.close < swingLows[swingLows.length - 1].low) {
        breaks.push({
          timestamp: bar.time,
          price: bar.close,
          direction: "bearish",
          magnitude: (swingLows[swingLows.length - 1].low - bar.close) / swingLows[swingLows.length - 1].low,
        })
      }
    }
    return breaks.slice(-5)
  }

  private determinePhase(bars: OHLCBar[]): "accumulation" | "manipulation" | "distribution" {
    const recent = bars.slice(-5)
    const volumeAvg = recent.reduce((a, b) => a + b.volume, 0) / recent.length
    const priceChange = (recent[recent.length - 1].close - recent[0].open) / recent[0].open

    if (priceChange > 0.005 && volumeAvg > 0) return "distribution"
    if (priceChange < -0.005 && volumeAvg > 0) return "accumulation"
    return "manipulation"
  }

  private determineDominantTF(): Timeframe {
    return "1h"
  }

  getStructure(timeframe: Timeframe = "1h"): SMCStructure {
    return this.structures.get(timeframe) ?? {
      marketStructure: "ranging",
      liquiditySweeps: [],
      fairValueGaps: [],
      orderBlocks: [],
      breaksOfStructure: [],
      currentPhase: "manipulation",
      dominantTimeframe: timeframe,
    }
  }

  getAllStructures(): Map<Timeframe, SMCStructure> {
    return this.structures
  }
}

export const smcEngine = new SMCEngine()
