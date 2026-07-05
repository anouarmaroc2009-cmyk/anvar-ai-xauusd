"use client"

import { useState } from "react"
import { GlassCard, GlassCardHeader, GlassCardBody } from "@/components/ui/GlassCard"
import { GoldButton } from "@/components/ui/GoldButton"
import { calculatePositionSize } from "@/lib/calculations/positionSizing"
import { calculateRiskReward } from "@/lib/calculations/riskReward"
import { calculateFibonacciLevels } from "@/lib/calculations/fibonacci"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { motion } from "framer-motion"

export function CalculatorPanel() {
  const [equity, setEquity] = useState(10000)
  const [riskPct, setRiskPct] = useState(1)
  const [entry, setEntry] = useState(2350.0)
  const [stopLoss, setStopLoss] = useState(2340.0)
  const [takeProfit, setTakeProfit] = useState(2370.0)
  const [swingHigh, setSwingHigh] = useState(2400.0)
  const [swingLow, setSwingLow] = useState(2300.0)

  const sizing = calculatePositionSize({ equity, riskPercent: riskPct, entryPrice: entry, stopLoss })
  const rr = calculateRiskReward(entry, stopLoss, takeProfit)
  const fibLevels = calculateFibonacciLevels(swingHigh, swingLow, "retracement")

  return (
    <GlassCard glowColor="gold" className="h-full">
      <GlassCardHeader>
        <span className="text-[10px] font-mono font-semibold text-anvarr-gold tracking-widest uppercase">
          Calculation Suite
        </span>
      </GlassCardHeader>
      <GlassCardBody>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-[9px] font-mono text-anvarr-slate tracking-wider uppercase">Position Sizing</p>
            <div className="space-y-1.5">
              <Input label="Equity $" value={equity} onChange={setEquity} step={100} />
              <Input label="Risk %" value={riskPct} onChange={setRiskPct} step={0.1} />
              <Input label="Entry" value={entry} onChange={setEntry} step={0.1} />
              <Input label="Stop Loss" value={stopLoss} onChange={setStopLoss} step={0.1} />
              <Input label="Take Profit" value={takeProfit} onChange={setTakeProfit} step={0.1} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[9px] font-mono text-anvarr-slate tracking-wider uppercase">Results</p>
            <div className="space-y-1.5">
              <ResultRow label="SIZE" value={sizing.size.toFixed(2)} color="text-white" />
              <ResultRow label="RISK $" value={`$${sizing.riskAmount.toFixed(2)}`} color="text-anvarr-accent-red" />
              <ResultRow label="R:R" value={rr.rrr.toFixed(2)} color={rr.rrr >= 2 ? "text-anvarr-accent-green" : "text-anvarr-accent-orange"} />
              <ResultRow label="RISK/ENTRY" value={`${rr.riskPercent.toFixed(2)}%`} color="text-anvarr-slate-light" />
              <ResultRow label="REWARD" value={`${rr.rewardPercent.toFixed(2)}%`} color="text-anvarr-accent-green" />
              <ResultRow label="KELLY LEV" value={`${sizing.recommendedLeverage}x`} color="text-anvarr-gold-light" />
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-anvarr-700/50">
          <p className="text-[9px] font-mono text-anvarr-slate tracking-wider uppercase mb-1.5">Fibonacci Levels</p>
          <div className="grid grid-cols-5 gap-1">
            {fibLevels.map((level) => (
              <motion.div
                key={level.ratio}
                whileHover={{ scale: 1.05 }}
                className="text-center px-1 py-1.5 rounded bg-anvarr-900/40 cursor-default"
              >
                <p className="text-[9px] font-mono font-bold text-anvarr-gold">{level.price.toFixed(1)}</p>
                <p className="text-[8px] font-mono text-anvarr-slate">{(level.ratio * 100).toFixed(0)}%</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <GoldButton variant="primary" size="sm" className="w-full" onClick={() => {
            window.dispatchEvent(new CustomEvent("apply-calc", { detail: { entry, stopLoss, takeProfit, equity, riskPct } }))
          }}>
            Apply to Execution
          </GoldButton>
        </div>
      </GlassCardBody>
    </GlassCard>
  )
}

function Input({
  label,
  value,
  onChange,
  step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step: number
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-anvarr-slate w-20 text-right">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        className="flex-1 bg-anvarr-900/60 border border-anvarr-700/50 rounded px-2 py-1 text-[10px] font-mono text-white text-right outline-none focus:border-anvarr-gold/50 transition-colors"
      />
    </div>
  )
}

function ResultRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[9px] font-mono text-anvarr-slate">{label}</span>
      <span className={`text-[10px] font-mono font-bold ${color}`}>{value}</span>
    </div>
  )
}
