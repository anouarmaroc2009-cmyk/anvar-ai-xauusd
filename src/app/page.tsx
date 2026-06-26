"use client"

import { useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { useMarketData } from "@/hooks/useMarketData"
import { macroEngine } from "@/lib/ai/macroEngine"
import { smcEngine } from "@/lib/ai/microEngine"

import { PriceTicker } from "@/components/dashboard/PriceTicker"
import { MacroPanel } from "@/components/dashboard/MacroPanel"
import { MicroPanel } from "@/components/dashboard/MicroPanel"
import { CalculatorPanel } from "@/components/dashboard/CalculatorPanel"
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

function StatusBar() {
  return (
    <footer className="flex items-center justify-between px-6 py-1.5 border-t border-anvarr-800 bg-anvarr-950/80">
      <div className="flex items-center gap-4 text-[8px] font-mono text-anvarr-500">
        <span>ANVARR v0.1.0</span>
        <span>WS: STANDBY</span>
        <span>ENGINE: LOCAL</span>
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
  const { price, bars, generateMockPrice } = useMarketData()
  const deepFocusMode = useAppStore((s) => s.deepFocusMode)
  const toggleDeepFocus = useAppStore((s) => s.toggleDeepFocus)

  const startMockData = useCallback(() => {
    const interval = setInterval(() => {
      const p = generateMockPrice()

      macroEngine.ingestEvent({
        id: `evt_${Date.now()}`,
        type: Math.random() > 0.7 ? "FOMC" : Math.random() > 0.5 ? "CPI" : "Geopolitical",
        title: "Macro Event Update",
        impact: Math.random() > 0.7 ? "high" : "medium",
        timestamp: Date.now(),
        summary: "Automated macro event for simulation",
        sentiment: Math.random() > 0.5 ? "bullish" : "bearish",
      })

      for (let i = 0; i < bars.length; i++) {
        const mockBar = {
          time: Date.now() - (bars.length - i) * 60000,
          open: p.bid + (Math.random() - 0.5) * 2,
          high: p.bid + Math.random() * 3,
          low: p.bid - Math.random() * 3,
          close: p.bid,
          volume: Math.round(Math.random() * 5000),
        }
        smcEngine.feedBars("1h", [mockBar])
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [generateMockPrice, bars.length])

  useEffect(() => {
    const cleanup = startMockData()
    return cleanup
  }, [startMockData])

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
        <StatusBar />
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
            <TradingViewChart bars={bars} height={320} />
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
            <CalculatorPanel />
          </div>
        </div>
      </div>

      <StatusBar />
    </div>
  )
}
