"use client"

import { motion } from "framer-motion"
import { clsx } from "clsx"
import { DailyBias } from "@/types/ai"

const biasConfig: Record<DailyBias, { label: string; color: string; bg: string }> = {
  bullish: { label: "BULLISH ▲", color: "text-anvarr-accent-green", bg: "bg-anvarr-accent-green/10 border-anvarr-accent-green/30" },
  bearish: { label: "BEARISH ▼", color: "text-anvarr-accent-red", bg: "bg-anvarr-accent-red/10 border-anvarr-accent-red/30" },
  neutral: { label: "NEUTRAL ◆", color: "text-anvarr-slate-light", bg: "bg-anvarr-slate-dark/20 border-anvarr-slate/30" },
}

interface BiasBadgeProps {
  bias: DailyBias
  confidence?: number
  pulse?: boolean
  size?: "sm" | "md" | "lg"
}

export function BiasBadge({ bias, confidence, pulse = true, size = "md" }: BiasBadgeProps) {
  const cfg = biasConfig[bias]
  const sizeCls = size === "sm" ? "text-xs px-2 py-0.5" : size === "lg" ? "text-sm px-4 py-1.5" : "text-xs px-3 py-1"

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border font-mono font-semibold",
        cfg.bg,
        cfg.color,
        sizeCls,
        pulse && "animate-pulse-glow"
      )}
    >
      <span className="tracking-wider">{cfg.label}</span>
      {confidence !== undefined && (
        <span className="opacity-60 text-[10px]">{(confidence * 100).toFixed(0)}%</span>
      )}
    </motion.div>
  )
}
