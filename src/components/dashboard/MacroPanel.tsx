"use client"

import { useEffect, useState } from "react"
import { GlassCard, GlassCardHeader, GlassCardBody } from "@/components/ui/GlassCard"
import { BiasBadge } from "@/components/ui/BiasBadge"
import { macroEngine } from "@/lib/ai/macroEngine"
import { MacroAnalysis, MacroEvent } from "@/types/ai"
import { motion, AnimatePresence } from "framer-motion"

const eventColors: Record<string, string> = {
  FOMC: "border-anvarr-accent-blue bg-anvarr-accent-blue/5",
  CPI: "border-anvarr-accent-orange bg-anvarr-accent-orange/5",
  NFP: "border-anvarr-accent-green bg-anvarr-accent-green/5",
  GDP: "border-anvarr-slate bg-anvarr-slate-dark/20",
  Geopolitical: "border-anvarr-accent-red bg-anvarr-accent-red/5",
  CentralBank: "border-anvarr-gold bg-anvarr-gold/5",
}

export function MacroPanel() {
  const [analysis, setAnalysis] = useState<MacroAnalysis>(() => macroEngine.analyze())

  useEffect(() => {
    const interval = setInterval(() => {
      setAnalysis(macroEngine.analyze())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <GlassCard glowColor="gold" className="h-full">
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-semibold text-anvarr-gold tracking-widest uppercase">
            Macro Analysis
          </span>
          <BiasBadge bias={analysis.dailyBias} confidence={analysis.biasConfidence} size="sm" />
        </div>
      </GlassCardHeader>
      <GlassCardBody>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[10px] font-mono text-anvarr-slate">
            <span>ENV: <span className="text-anvarr-slate-light uppercase">{analysis.riskEnvironment}</span></span>
            <span>EVENTS: <span className="text-white">{analysis.keyEvents.length}</span></span>
          </div>

          <AnimatePresence mode="popLayout">
            {analysis.keyEvents.map((event: MacroEvent) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`flex items-start gap-2 p-2 rounded-lg border-l-2 ${
                  eventColors[event.type] ?? "border-anvarr-600 bg-anvarr-700/20"
                }`}
              >
                <span className="text-[9px] font-mono font-bold text-anvarr-slate-light uppercase whitespace-nowrap mt-0.5">
                  {event.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white truncate">{event.title}</p>
                  <p className="text-[9px] text-anvarr-slate mt-0.5 line-clamp-2">{event.summary}</p>
                </div>
                <span className={`text-[9px] font-mono font-bold ${
                  event.sentiment === "bullish" ? "text-anvarr-accent-green" :
                    event.sentiment === "bearish" ? "text-anvarr-accent-red" : "text-anvarr-slate-light"
                }`}>
                  {event.sentiment.toUpperCase().slice(0, 3)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {analysis.reasoning.length > 0 && (
            <div className="mt-2 pt-2 border-t border-anvarr-700/50 space-y-1">
              {analysis.reasoning.slice(0, 2).map((r, i) => (
                <p key={i} className="text-[9px] font-mono text-anvarr-slate leading-tight">▸ {r}</p>
              ))}
            </div>
          )}
        </div>
      </GlassCardBody>
    </GlassCard>
  )
}
