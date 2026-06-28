import { OHLCBar, Timeframe } from "@/types/market"
import { MacroEvent } from "@/types/ai"
import { smcEngine } from "@/lib/ai/microEngine"
import { macroEngine } from "@/lib/ai/macroEngine"

function parseDate(dateStr: string): number {
  return new Date(dateStr + "T00:00:00Z").getTime()
}

function parseCSV(csvText: string): OHLCBar[] {
  const lines = csvText.trim().split("\n")
  const bars: OHLCBar[] = []

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",")
    if (parts.length < 5) continue
    const [dateStr, openStr, highStr, lowStr, closeStr] = parts
    const time = parseDate(dateStr.trim())
    const open = parseFloat(openStr)
    const high = parseFloat(highStr)
    const low = parseFloat(lowStr)
    const close = parseFloat(closeStr)

    if (isNaN(time) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue

    bars.push({ time, open, high, low, close, volume: 0 })
  }

  return bars
}

function deriveMacroEvents(bars: OHLCBar[]): MacroEvent[] {
  const events: MacroEvent[] = []

  for (let i = 1; i < bars.length; i++) {
    const bar = bars[i]
    const prevClose = bars[i - 1].close
    const changePct = (bar.close - prevClose) / prevClose

    if (changePct > 0.02) {
      events.push({
        id: `hist_bull_${i}`,
        type: "Geopolitical",
        title: `Historical +${(changePct * 100).toFixed(1)}% daily move`,
        impact: changePct > 0.03 ? "high" : "medium",
        timestamp: bar.time,
        summary: `Gold surged ${(changePct * 100).toFixed(1)}% — potential macro catalyst`,
        sentiment: "bullish",
      })
    } else if (changePct < -0.02) {
      events.push({
        id: `hist_bear_${i}`,
        type: "Geopolitical",
        title: `Historical ${(changePct * 100).toFixed(1)}% daily drop`,
        impact: changePct < -0.03 ? "high" : "medium",
        timestamp: bar.time,
        summary: `Gold dropped ${(changePct * 100).toFixed(1)}% — potential macro shock`,
        sentiment: "bearish",
      })
    }
  }

  return events
}

function aggregateToWeekly(bars: OHLCBar[]): OHLCBar[] {
  const weekly: OHLCBar[] = []
  let weekStart = bars[0]
  let weekHigh = bars[0].high
  let weekLow = bars[0].low
  let weekVolume = 0

  for (let i = 1; i < bars.length; i++) {
    const bar = bars[i]
    const barDate = new Date(bar.time)
    const startDate = new Date(weekStart.time)
    const dayDiff = (bar.time - weekStart.time) / (1000 * 60 * 60 * 24)

    if (dayDiff >= 5 || barDate.getUTCDay() < startDate.getUTCDay()) {
      weekly.push({
        time: weekStart.time,
        open: weekStart.open,
        high: weekHigh,
        low: weekLow,
        close: bars[i - 1].close,
        volume: weekVolume,
      })
      weekStart = bar
      weekHigh = bar.high
      weekLow = bar.low
      weekVolume = bar.volume
    } else {
      weekHigh = Math.max(weekHigh, bar.high)
      weekLow = Math.min(weekLow, bar.low)
      weekVolume += bar.volume
    }
  }

  weekly.push({
    time: weekStart.time,
    open: weekStart.open,
    high: weekHigh,
    low: weekLow,
    close: bars[bars.length - 1].close,
    volume: weekVolume,
  })

  return weekly
}

export async function loadHistoricalData(): Promise<OHLCBar[]> {
  const response = await fetch("/data/xauusd-daily.csv")
  const csvText = await response.text()
  const dailyBars = parseCSV(csvText)

  if (dailyBars.length === 0) return []

  smcEngine.feedBars("D", dailyBars)

  const weeklyBars = aggregateToWeekly(dailyBars)
  if (weeklyBars.length >= 20) {
    smcEngine.feedBars("W", weeklyBars)
  }

  const macroEvents = deriveMacroEvents(dailyBars)
  const recentEvents = macroEvents.slice(-50)
  for (const event of recentEvents) {
    macroEngine.ingestEvent(event)
  }

  macroEngine.ingestEvent({
    id: "hist_init",
    type: "Other",
    title: `Loaded ${dailyBars.length} days of historical data`,
    impact: "medium",
    timestamp: Date.now(),
    summary: `Historical XAUUSD data from ${new Date(dailyBars[0].time).toISOString().split("T")[0]} to ${new Date(dailyBars[dailyBars.length - 1].time).toISOString().split("T")[0]}`,
    sentiment: "neutral",
  })

  return dailyBars
}
