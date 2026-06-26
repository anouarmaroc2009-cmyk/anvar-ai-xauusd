"use client"

import { motion } from "framer-motion"
import { clsx } from "clsx"
import { ConfluenceResult } from "@/types/ai"

interface ConfluenceIndicatorProps {
  confluence: ConfluenceResult
  compact?: boolean
}

function Bar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-anvarr-slate w-16 text-right">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-anvarr-700/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={clsx("h-full rounded-full", color)}
        />
      </div>
      <span className="text-[10px] font-mono text-anvarr-slate-light w-8">{(value * 100).toFixed(0)}%</span>
    </div>
  )
}

export function ConfluenceIndicator({ confluence, compact }: ConfluenceIndicatorProps) {
  if (compact) {
    const score = (confluence.confidence * 100).toFixed(0)
    const color = confluence.canExecute ? "text-anvarr-accent-green" : "text-anvarr-accent-orange"
    return (
      <div className={clsx("font-mono text-sm font-bold", color)}>
        {score}% CONF
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-semibold text-anvarr-slate-light uppercase tracking-wider">
          Confluence Score
        </span>
        <motion.span
          key={confluence.confidence}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className={clsx(
            "text-lg font-mono font-bold",
            confluence.confidence >= 0.65 ? "text-anvarr-accent-green" :
              confluence.confidence >= 0.4 ? "text-anvarr-accent-orange" : "text-anvarr-accent-red"
          )}
        >
          {(confluence.confidence * 100).toFixed(0)}%
        </motion.span>
      </div>

      <Bar value={confluence.macroAlignment} label="MACRO" color="bg-anvarr-gold" />
      <Bar value={confluence.microAlignment} label="SMC" color="bg-anvarr-accent-blue" />
      <Bar value={confluence.quantAlignment} label="QUANT" color="bg-anvarr-accent-green" />

      {confluence.reasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-anvarr-700/50 space-y-1">
          {confluence.reasons.map((r, i) => (
            <p key={i} className="text-[10px] font-mono text-anvarr-slate leading-tight">▸ {r}</p>
          ))}
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-anvarr-700/50 flex justify-between text-[10px] font-mono text-anvarr-slate">
        <span>RISK: {(confluence.riskScore * 100).toFixed(0)}%</span>
        <span className={confluence.canExecute ? "text-anvarr-accent-green" : "text-anvarr-accent-orange"}>
          {confluence.canExecute ? "✓ EXECUTABLE" : "● HOLDING"}
        </span>
      </div>
    </div>
  )
}
