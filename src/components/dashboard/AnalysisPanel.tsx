"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard, GlassCardHeader, GlassCardBody } from "@/components/ui/GlassCard"
import { orchestrator } from "@/lib/ai/orchestrator"
import { UnifiedAnalysis } from "@/types/ai"
import { clsx } from "clsx"

const biasColors: Record<string, string> = {
  bullish: "text-anvarr-accent-green border-anvarr-accent-green/40 bg-anvarr-accent-green/10",
  bearish: "text-anvarr-accent-red border-anvarr-accent-red/40 bg-anvarr-accent-red/10",
  neutral: "text-anvarr-slate-light border-anvarr-slate/30 bg-anvarr-slate-dark/20",
}

const actionColors: Record<string, string> = {
  buy: "text-anvarr-accent-green border-anvarr-accent-green/30",
  sell: "text-anvarr-accent-red border-anvarr-accent-red/30",
  wait: "text-anvarr-slate-light border-anvarr-slate/30",
  "close-long": "text-anvarr-accent-orange border-anvarr-accent-orange/30",
  "close-short": "text-anvarr-accent-orange border-anvarr-accent-orange/30",
}

const textToBg: Record<string, string> = {
  "text-anvarr-gold": "bg-anvarr-gold",
  "text-anvarr-accent-blue": "bg-anvarr-accent-blue",
  "text-anvarr-accent-green": "bg-anvarr-accent-green",
  "text-anvarr-accent-red": "bg-anvarr-accent-red",
  "text-anvarr-slate-light": "bg-anvarr-slate",
  "text-anvarr-slate": "bg-anvarr-slate",
}

function SignalBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-mono">
        <span className="text-anvarr-slate">{label}</span>
        <span className={color}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-anvarr-900 rounded-full overflow-hidden">
        <motion.div
          className={clsx("h-full rounded-full transition-all", textToBg[color] || "bg-anvarr-slate")}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value * 100, 100)}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

export function AnalysisPanel() {
  const [analysis, setAnalysis] = useState<UnifiedAnalysis | null>(null)

  useEffect(() => {
    const update = () => setAnalysis(orchestrator.analyze())
    update()
    const interval = setInterval(update, 2000)
    return () => clearInterval(interval)
  }, [])

  if (!analysis) {
    return (
      <GlassCard className="h-full">
        <GlassCardBody>
          <div className="flex items-center justify-center h-20">
            <span className="text-[9px] font-mono text-anvarr-500 animate-pulse">INITIALIZING ANALYSIS...</span>
          </div>
        </GlassCardBody>
      </GlassCard>
    )
  }

  return (
    <GlassCard glowColor="gold" className="h-full flex flex-col">
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-semibold text-anvarr-gold tracking-widest uppercase">
            AI Analysis
          </span>
          <div className="flex items-center gap-2">
            <span className={clsx("text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", biasColors[analysis.overallBias])}>
              {analysis.overallBias} {analysis.overallBias === "bullish" ? "▲" : analysis.overallBias === "bearish" ? "▼" : "◆"}
            </span>
            <span className={clsx(
              "text-[8px] font-mono px-1.5 py-0.5 rounded border",
              analysis.directionStrength === "strong" ? "text-anvarr-accent-green border-anvarr-accent-green/30" :
                analysis.directionStrength === "moderate" ? "text-anvarr-gold border-anvarr-gold/30" :
                  "text-anvarr-slate border-anvarr-slate/30"
            )}>
              {analysis.directionStrength.toUpperCase()}
            </span>
          </div>
        </div>
      </GlassCardHeader>

      <GlassCardBody className="flex-1 overflow-y-auto min-h-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={clsx("text-xs font-mono font-bold px-3 py-1 rounded-lg border", actionColors[analysis.suggestedAction])}>
              {analysis.suggestedAction.toUpperCase()}
            </span>
            <span className="text-[9px] font-mono text-anvarr-slate">
              Confidence: {(analysis.entryConfidence * 100).toFixed(0)}%
            </span>
            <span className="text-[9px] font-mono text-anvarr-slate">
              Risk: {(analysis.riskScore * 100).toFixed(0)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
            <div className="bg-anvarr-900/50 rounded p-2">
              <span className="text-anvarr-500">MACRO</span>
              <p className={clsx("text-xs font-bold mt-0.5", biasColors[analysis.macro.dailyBias].split(" ")[0])}>
                {analysis.macro.dailyBias.toUpperCase()}
              </p>
            </div>
            <div className="bg-anvarr-900/50 rounded p-2">
              <span className="text-anvarr-500">MICRO</span>
              <p className="text-xs font-bold text-anvarr-accent-blue mt-0.5">
                {analysis.micro.marketStructure.toUpperCase()}
              </p>
            </div>
            <div className="bg-anvarr-900/50 rounded p-2">
              <span className="text-anvarr-500">NEWS</span>
              <p className={clsx("text-xs font-bold mt-0.5", biasColors[analysis.news.overallSentiment].split(" ")[0])}>
                {analysis.news.overallSentiment.toUpperCase()} ({analysis.news.bullishCount}/{analysis.news.bearishCount})
              </p>
            </div>
            <div className="bg-anvarr-900/50 rounded p-2">
              <span className="text-anvarr-500">PHASE</span>
              <p className="text-xs font-bold text-anvarr-accent-orange mt-0.5 uppercase">
                {analysis.micro.currentPhase}
              </p>
            </div>
          </div>

          <div className="space-y-2 bg-anvarr-900/30 rounded-lg p-3">
            <p className="text-[8px] font-mono text-anvarr-500 uppercase tracking-wider">Confluence Signals</p>
            <SignalBar label="Macro Alignment" value={analysis.macro.biasConfidence} color="text-anvarr-gold" />
            <SignalBar label="Structure Alignment" value={analysis.micro.breaksOfStructure.length > 0 ? 0.7 : 0.4} color="text-anvarr-accent-blue" />
            <SignalBar label="News Alignment" value={Math.abs(analysis.news.sentimentScore) * 0.5 + 0.5} color="text-anvarr-accent-green" />
          </div>

          {analysis.keyLevels.support.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-anvarr-900/50 rounded p-2">
                <p className="text-[8px] font-mono text-anvarr-accent-green uppercase">Support</p>
                {analysis.keyLevels.support.map((s, i) => (
                  <p key={i} className="text-[11px] font-mono text-white">${s.toFixed(2)}</p>
                ))}
              </div>
              <div className="bg-anvarr-900/50 rounded p-2">
                <p className="text-[8px] font-mono text-anvarr-accent-red uppercase">Resistance</p>
                {analysis.keyLevels.resistance.map((r, i) => (
                  <p key={i} className="text-[11px] font-mono text-white">${r.toFixed(2)}</p>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1 border-t border-anvarr-700/30">
            <p className="text-[8px] font-mono text-anvarr-500 mb-1 uppercase tracking-wider">Reasoning</p>
            <ul className="space-y-0.5">
              {analysis.reasons.map((r, i) => (
                <li key={i} className="text-[8px] font-mono text-anvarr-slate leading-tight">▸ {r}</li>
              ))}
            </ul>
          </div>

          {analysis.news.sentimentShift !== "stable" && (
            <div className={clsx(
              "px-2 py-1 rounded text-[8px] font-mono border",
              analysis.news.sentimentShift === "improving"
                ? "bg-anvarr-accent-green/5 border-anvarr-accent-green/20 text-anvarr-accent-green"
                : "bg-anvarr-accent-red/5 border-anvarr-accent-red/20 text-anvarr-accent-red"
            )}>
              News momentum: {analysis.news.sentimentShift.toUpperCase()}
            </div>
          )}
        </div>
      </GlassCardBody>
    </GlassCard>
  )
}
