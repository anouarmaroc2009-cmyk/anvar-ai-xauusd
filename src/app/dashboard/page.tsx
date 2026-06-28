"use client"

import { useEffect, useCallback, useState } from "react"
import { useMarketData } from "@/hooks/useMarketData"
import { macroEngine } from "@/lib/ai/macroEngine"
import { smcEngine } from "@/lib/ai/microEngine"
import { loadHistoricalData } from "@/lib/data/loadHistoricalData"
import { OHLCBar } from "@/types/market"

import { PriceTicker } from "@/components/dashboard/PriceTicker"
import { MacroPanel } from "@/components/dashboard/MacroPanel"
import { MicroPanel } from "@/components/dashboard/MicroPanel"
import { MLPredictionPanel } from "@/components/dashboard/MLPredictionPanel"
import { ExecutionPanel } from "@/components/dashboard/ExecutionPanel"
import { OrderBookPanel } from "@/components/dashboard/OrderBook"
import { TradingViewChart } from "@/components/charts/TradingViewChart"
import { GlassCard } from "@/components/ui/GlassCard"
import { BiasBadge } from "@/components/ui/BiasBadge"
import { useAppStore } from "@/lib/store"

function Header() {
  const bias = macroEngine.analyze()

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-anvarr-800">
      <div className="flex items-center gap-4">
        <a href="/" className="flex items-center gap-2 text-[9px] font-mono text-anvarr-500 hover:text-anvarr-slate-light transition-colors">
          ← LANDING
        </a>
        <div className="h-4 w-px bg-anvarr-700" />
        <h1 className="text-sm font-bold tracking-[0.2em] text-gradient-gold uppercase">
          ANVARR
        </h1>
        <div className="h-4 w-px bg-anvarr-700" />
        <span className="text-[10px] font-mono text-anvarr-slate tracking-wider">
          XAUUSD Trading Intelligence
        </span>
      </div>
      <div className="flex items-center gap-4">
        <BiasBadge bias={bias.dailyBias} confidence={bias.biasConfidence} size="sm" />
        <div className="flex items-center gap-2 text-[9px] font-mono text-anvarr-slate">
          <span className="w-1.5 h-1.5 rounded-full bg-anvarr-accent-green animate-pulse" />
          SYSTEM NOMINAL
        </div>
      </div>
    </header>
  )
}

function StatusBar({ historicalBarsCount }: { historicalBarsCount: number }) {
  return (
    <footer className="flex items-center justify-between px-6 py-1.5 border-t border-anvarr-800 bg-anvarr-950/80">
      <div className="flex items-center gap-4 text-[8px] font-mono text-anvarr-500">
        <span>ANVARR v0.1.0</span>
        <span>WS: STANDBY</span>
        <span>ENGINE: LOCAL</span>
        {historicalBarsCount > 0 && (
          <span className="text-anvarr-accent-green">
            HIST: {historicalBarsCount}D
          </span>
        )}
        <span className="text-anvarr-accent-blue">AI: XGBoost 57.4%</span>
      </div>
      <div className="flex items-center gap-3 text-[8px] font-mono text-anvarr-500">
        <span>XAUUSD REAL-TIME</span>
        <span className="text-anvarr-gold/60">●</span>
        <span>LATENCY: —</span>
      </div>
    </footer>
  )
}

export default function Dashboard() {
  const [historicalBars, setHistoricalBars] = useState<OHLCBar[]>([])
  const { price, bars, generateMockPrice, historicalLoaded } = useMarketData(historicalBars.length > 0 ? historicalBars : undefined)
  const deepFocusMode = useAppStore((s) => s.deepFocusMode)
  const toggleDeepFocus = useAppStore((s) => s.toggleDeepFocus)

  useEffect(() => {
    loadHistoricalData().then((dailyBars) => {
      if (dailyBars.length === 0) return
      setHistoricalBars(dailyBars)
      smcEngine.feedBars("D", dailyBars)
      macroEngine.setMacroEnvironment(104.5, 4.25)
    })
  }, [])

  const startMockData = useCallback(() => {
    const interval = setInterval(() => {
      const p = generateMockPrice()

      if (Math.random() > 0.85) {
        macroEngine.ingestEvent({
          id: `evt_${Date.now()}`,
          type: Math.random() > 0.7 ? "FOMC" : Math.random() > 0.5 ? "CPI" : "Geopolitical",
          title: "Macro Event Update",
          impact: Math.random() > 0.7 ? "high" : "medium",
          timestamp: Date.now(),
          summary: "Automated macro event for simulation",
          sentiment: Math.random() > 0.5 ? "bullish" : "bearish",
        })
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [generateMockPrice])

  if (deepFocusMode) {
    return (
      <div className="h-screen flex flex-col bg-anvarr-950">
        <Header />
        <div className="flex-1 p-3">
          <div className="relative">
            <button
              onClick={toggleDeepFocus}
              className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg bg-anvarr-800/80 border border-anvarr-700/50 text-[9px] font-mono text-anvarr-slate hover:text-white transition-colors"
            >
              EXIT DEEP FOCUS
            </button>
            <TradingViewChart bars={bars} height={700} />
          </div>
        </div>
        <StatusBar historicalBarsCount={historicalBars.length} />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-anvarr-950">
      <Header />

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-3 p-3 auto-rows-fr">
          <div className="col-span-12">
            <GlassCard className="!p-0 !bg-transparent !border-none !shadow-none">
              <PriceTicker price={price} />
            </GlassCard>
          </div>

          <div className="col-span-12 lg:col-span-4 row-span-2">
            <TradingViewChart bars={bars.length > 0 ? bars : historicalBars.slice(-200)} height={320} />
          </div>

          <div className="col-span-6 lg:col-span-2">
            <MacroPanel />
          </div>

          <div className="col-span-6 lg:col-span-2">
            <MicroPanel />
          </div>

          <div className="col-span-6 lg:col-span-2">
            <OrderBookPanel />
          </div>

          <div className="col-span-6 lg:col-span-2">
            <ExecutionPanel />
          </div>

          <div className="col-span-12 lg:col-span-4">
            <MLPredictionPanel />
          </div>
        </div>
      </div>

      <StatusBar historicalBarsCount={historicalBars.length} />
    </div>
  )
}
