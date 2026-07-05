"use client"

import { useEffect, useState } from "react"
import { GlassCard, GlassCardHeader, GlassCardBody } from "@/components/ui/GlassCard"
import { GoldButton } from "@/components/ui/GoldButton"
import { ConfluenceIndicator } from "@/components/ui/ConfluenceIndicator"
import { executionManager } from "@/lib/ai/executionManager"
import { confluenceFilter } from "@/lib/ai/confluenceFilter"
import { macroEngine } from "@/lib/ai/macroEngine"
import { smcEngine } from "@/lib/ai/microEngine"
import { ConfluenceResult, ExecutionOrder, QuantitativeSignal } from "@/types/ai"
import { motion, AnimatePresence } from "framer-motion"

export function ExecutionPanel() {
  const [result, setResult] = useState<{ confluence: ConfluenceResult } | null>(null)
  const [orders, setOrders] = useState<ExecutionOrder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setOrders([...executionManager.getOrders()])
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const runEvaluation = () => {
    setLoading(true)
    const signal = confluenceFilter.evaluate(macroEngine.analyze(), smcEngine.getStructure("1h"), {
      signal: "neutral",
      strength: 0,
      rsi: 50,
      momentum: 0,
      volumeProfile: "neutral",
      support: 0,
      resistance: 0,
    })
    const side = signal.macroAlignment > 0.5 ? "buy" : signal.macroAlignment < -0.5 ? "sell" : "neutral"
    const mockQuant: QuantitativeSignal = {
      signal: side as "buy" | "sell" | "neutral",
      strength: signal.confidence,
      rsi: 50 + Math.round((signal.confidence - 0.5) * 40),
      momentum: (signal.confidence - 0.5) * 2,
      volumeProfile: signal.macroAlignment > 0.3 ? "accumulating" : signal.macroAlignment < -0.3 ? "distributing" : "neutral",
      support: 2340,
      resistance: 2360,
    }

    const macro = macroEngine.analyze()
    const micro = smcEngine.getStructure("1h")
    const confluence = confluenceFilter.evaluate(macro, micro, mockQuant)
    setResult({ confluence })

    executionManager.evaluateOrder({
      equity: 10000,
      riskPercent: 1,
      entryPrice: 2350,
      stopLoss: 2335,
      takeProfit: 2380,
      side: mockQuant.signal === "buy" ? "buy" : "sell",
      quantSignal: mockQuant,
    })

    setTimeout(() => setLoading(false), 600)
  }

  return (
    <GlassCard glowColor={result?.confluence.canExecute ? "gold" : "none"} className="h-full">
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-semibold text-anvarr-slate-light tracking-widest uppercase">
            Execution Engine
          </span>
          {result && (
            <ConfluenceIndicator confluence={result.confluence} compact />
          )}
        </div>
      </GlassCardHeader>
      <GlassCardBody className="flex flex-col h-[calc(100%-48px)]">
        <div className="flex-1">
          {result ? (
            <ConfluenceIndicator confluence={result.confluence} />
          ) : (
            <div className="flex items-center justify-center h-full text-[10px] font-mono text-anvarr-slate">
              Run evaluation to check confluence
            </div>
          )}
        </div>

        <div className="mt-3 space-y-3">
          <GoldButton
            variant="primary"
            size="md"
            className="w-full"
            loading={loading}
            onClick={runEvaluation}
          >
            Evaluate Confluence
          </GoldButton>

          {orders.length > 0 && (
            <div>
              <p className="text-[9px] font-mono text-anvarr-slate tracking-wider uppercase mb-1.5">
                Orders ({orders.length})
              </p>
              <AnimatePresence>
                {orders.slice(-3).reverse().map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center justify-between px-2 py-1.5 rounded bg-anvarr-900/40 mb-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono font-bold ${
                        order.side === "buy" ? "text-anvarr-accent-green" : "text-anvarr-accent-red"
                      }`}>
                        {order.side.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-mono text-white">{order.size} oz</span>
                      <span className="text-[9px] font-mono text-anvarr-slate">@{order.price.toFixed(2)}</span>
                    </div>
                    <span className={`text-[8px] font-mono uppercase ${
                      order.status === "active" ? "text-anvarr-accent-green" :
                        order.status === "pending" ? "text-anvarr-accent-orange" :
                          order.status === "filled" ? "text-anvarr-accent-blue" : "text-anvarr-slate"
                    }`}>
                      {order.status}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </GlassCardBody>
    </GlassCard>
  )
}
