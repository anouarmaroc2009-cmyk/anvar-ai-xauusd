"use client"

import { useEffect, useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMarketData } from "@/hooks/useMarketData"
import { macroEngine } from "@/lib/ai/macroEngine"
import { smcEngine } from "@/lib/ai/microEngine"
import { loadHistoricalData } from "@/lib/data/loadHistoricalData"
import { OHLCBar } from "@/types/market"
import { clsx } from "clsx"

import { MacroPanel } from "@/components/dashboard/MacroPanel"
import { MicroPanel } from "@/components/dashboard/MicroPanel"
import { MLPredictionPanel } from "@/components/dashboard/MLPredictionPanel"
import { ExecutionPanel } from "@/components/dashboard/ExecutionPanel"
import { OrderBookPanel } from "@/components/dashboard/OrderBook"
import { TradingViewChart } from "@/components/charts/TradingViewChart"
import { BiasBadge } from "@/components/ui/BiasBadge"
import { useAppStore } from "@/lib/store"

type ViewMode = "overview" | "chart" | "ai" | "execution"

interface CollapsiblePanelProps {
  id: string
  title: string
  defaultCollapsed?: boolean
  children: React.ReactNode
  className?: string
}

function CollapsiblePanel({ id, title, defaultCollapsed, children, className }: CollapsiblePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false)

  return (
    <div className={clsx("relative", className)}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-2 right-2 z-10 text-[8px] font-mono text-anvarr-500 hover:text-white transition-colors"
      >
        {collapsed ? "[+]" : "[\u2212]"}
      </button>
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            key={`${id}-open`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      {collapsed && (
        <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-anvarr-700/50 bg-anvarr-900/30">
          <span className="text-[9px] font-mono text-anvarr-500">{title} (hidden)</span>
        </div>
      )}
    </div>
  )
}

const views: { id: ViewMode; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "chart", label: "Chart" },
  { id: "ai", label: "AI" },
  { id: "execution", label: "Execution" },
]

function Header({ view, onViewChange, price, bars, historicalBars }: {
  view: ViewMode
  onViewChange: (v: ViewMode) => void
  price: any
  bars: OHLCBar[]
  historicalBars: OHLCBar[]
}) {
  const bias = macroEngine.analyze()
  const displayBars = bars.length > 0 ? bars : historicalBars
  const lastClose = displayBars.length > 0 ? displayBars[displayBars.length - 1].close : 0
  const prevClose = displayBars.length > 1 ? displayBars[displayBars.length - 2].close : lastClose
  const dailyChange = lastClose - prevClose
  const dailyChangePct = prevClose > 0 ? (dailyChange / prevClose) * 100 : 0

  return (
    <header className="flex flex-col border-b border-anvarr-800 bg-anvarr-950/90">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <a href="/" className="text-[9px] font-mono text-anvarr-500 hover:text-anvarr-slate-light transition-colors">
            ← LANDING
          </a>
          <div className="h-4 w-px bg-anvarr-700" />
          <h1 className="text-xs font-bold tracking-[0.2em] text-gradient-gold uppercase">ANVARR</h1>
          <div className="h-4 w-px bg-anvarr-700" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono text-white">${lastClose.toFixed(2)}</span>
            <span className={clsx(
              "text-[10px] font-mono font-semibold",
              dailyChange >= 0 ? "text-anvarr-accent-green" : "text-anvarr-accent-red"
            )}>
              {dailyChange >= 0 ? "+" : ""}{dailyChange.toFixed(2)} ({(dailyChangePct).toFixed(2)}%)
            </span>
          </div>
          {price && (
            <>
              <div className="h-4 w-px bg-anvarr-700" />
              <span className="text-[9px] font-mono text-anvarr-slate">
                ASK ${price.ask.toFixed(2)}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <BiasBadge bias={bias.dailyBias} confidence={bias.biasConfidence} size="sm" />
          <span className="w-1.5 h-1.5 rounded-full bg-anvarr-accent-green animate-pulse" />
        </div>
      </div>
      <nav className="flex gap-1 px-4 pb-1">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={clsx(
              "px-3 py-1 text-[10px] font-mono rounded-t transition-colors",
              view === v.id
                ? "bg-anvarr-800 text-white border-b-2 border-anvarr-gold"
                : "text-anvarr-500 hover:text-anvarr-slate-light hover:bg-anvarr-800/40"
            )}
          >
            {v.label}
          </button>
        ))}
      </nav>
    </header>
  )
}

function DashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full grid grid-cols-12 gap-3 p-3 auto-rows-fr"
    >
      {children}
    </motion.div>
  )
}

function OverviewView({ bars, historicalBars, orderBook }: { bars: OHLCBar[]; historicalBars: OHLCBar[]; orderBook: any }) {
  const obBids = orderBook?.bids
  const obAsks = orderBook?.asks
  const obMid = obBids?.[0] && obAsks?.[0] ? (obBids[0].price + obAsks[0].price) / 2 : undefined
  const obSpread = obBids?.[0] && obAsks?.[0] ? obAsks[0].price - obBids[0].price : undefined

  return (
    <DashboardGrid>
      <div className="col-span-12 lg:col-span-4 row-span-2">
        <TradingViewChart bars={bars.length > 0 ? bars : historicalBars.slice(-200)} height={320} />
      </div>
      <CollapsiblePanel id="macro" title="Macro" className="col-span-6 lg:col-span-2">
        <MacroPanel />
      </CollapsiblePanel>
      <CollapsiblePanel id="micro" title="SMC/ICT" className="col-span-6 lg:col-span-2">
        <MicroPanel />
      </CollapsiblePanel>
      <CollapsiblePanel id="orderbook" title="Order Book" className="col-span-6 lg:col-span-2">
        <OrderBookPanel bids={obBids} asks={obAsks} mid={obMid} spread={obSpread} />
      </CollapsiblePanel>
      <CollapsiblePanel id="execution" title="Execution" className="col-span-6 lg:col-span-2">
        <ExecutionPanel />
      </CollapsiblePanel>
      <CollapsiblePanel id="ml" title="AI Prediction" className="col-span-12 lg:col-span-4">
        <MLPredictionPanel />
      </CollapsiblePanel>
    </DashboardGrid>
  )
}

function ChartView({ bars, historicalBars, orderBook }: { bars: OHLCBar[]; historicalBars: OHLCBar[]; orderBook: any }) {
  const obBids = orderBook?.bids
  const obAsks = orderBook?.asks
  const obMid = obBids?.[0] && obAsks?.[0] ? (obBids[0].price + obAsks[0].price) / 2 : undefined
  const obSpread = obBids?.[0] && obAsks?.[0] ? obAsks[0].price - obBids[0].price : undefined

  return (
    <DashboardGrid>
      <div className="col-span-12 lg:col-span-8 row-span-2">
        <TradingViewChart bars={bars.length > 0 ? bars : historicalBars.slice(-400)} height={500} />
      </div>
      <div className="col-span-12 lg:col-span-4 row-span-2">
        <MLPredictionPanel />
      </div>
      <div className="col-span-6 lg:col-span-4">
        <MacroPanel />
      </div>
      <div className="col-span-6 lg:col-span-4">
        <MicroPanel />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <OrderBookPanel bids={obBids} asks={obAsks} mid={obMid} spread={obSpread} />
      </div>
    </DashboardGrid>
  )
}

function AIView() {
  return (
    <DashboardGrid>
      <div className="col-span-12 lg:col-span-6 row-span-2">
        <MLPredictionPanel />
      </div>
      <div className="col-span-12 lg:col-span-3">
        <MacroPanel />
      </div>
      <div className="col-span-12 lg:col-span-3">
        <MicroPanel />
      </div>
    </DashboardGrid>
  )
}

function ExecutionView() {
  return (
    <DashboardGrid>
      <div className="col-span-12 lg:col-span-4 row-span-2">
        <ExecutionPanel />
      </div>
      <div className="col-span-12 lg:col-span-4 row-span-2">
        <OrderBookPanel />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <MacroPanel />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <MicroPanel />
      </div>
    </DashboardGrid>
  )
}

export default function Dashboard() {
  const [historicalBars, setHistoricalBars] = useState<OHLCBar[]>([])
  const { price, bars, orderBook, recentOrders, generateMockPrice, historicalLoaded, state } = useMarketData(
    historicalBars.length > 0 ? historicalBars : undefined
  )
  const [view, setView] = useState<ViewMode>("overview")
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

  const viewComponents: Record<ViewMode, React.ReactNode> = {
    overview: <OverviewView bars={bars} historicalBars={historicalBars} orderBook={orderBook} />,
    chart: <ChartView bars={bars} historicalBars={historicalBars} orderBook={orderBook} />,
    ai: <AIView />,
    execution: <ExecutionView />,
  }

  return (
    <div className="h-screen flex flex-col bg-anvarr-950">
      <Header
        view={view}
        onViewChange={setView}
        price={price}
        bars={bars}
        historicalBars={historicalBars}
      />
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {viewComponents[view]}
          </motion.div>
        </AnimatePresence>
      </div>
      <footer className="flex items-center justify-between px-4 py-1 border-t border-anvarr-800 bg-anvarr-950/80">
        <div className="flex items-center gap-3 text-[8px] font-mono text-anvarr-500">
          <span>ANVARR v0.1.0</span>
          <span className={state === "connected" ? "text-anvarr-accent-green" : "text-anvarr-accent-orange"}>
            WS: {state.toUpperCase()}
          </span>
          <span>ENGINE: LOCAL</span>
          {historicalBars.length > 0 && (
            <span className="text-anvarr-accent-green">HIST: {historicalBars.length}D</span>
          )}
          <span className="text-anvarr-accent-blue">AI: XGBoost 57.4%</span>
        </div>
        <div className="flex items-center gap-3 text-[8px] font-mono text-anvarr-500">
          <span>{view.toUpperCase()} VIEW</span>
          <span className={`${state === "connected" ? "text-anvarr-accent-green" : "text-anvarr-gold/60"} animate-pulse`}>●</span>
        </div>
      </footer>
    </div>
  )
}
