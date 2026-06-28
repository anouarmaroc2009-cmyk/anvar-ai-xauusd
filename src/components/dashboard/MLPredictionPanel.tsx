"use client"

import { useEffect, useState } from "react"
import { GlassCard, GlassCardHeader, GlassCardBody } from "@/components/ui/GlassCard"
import { MLPrediction } from "@/types/predictions"
import { loadPredictions } from "@/lib/data/loadPredictions"

export function MLPredictionPanel() {
  const [prediction, setPrediction] = useState<MLPrediction | null>(null)

  useEffect(() => {
    loadPredictions().then(setPrediction)
  }, [])

  if (!prediction) {
    return (
      <GlassCard glowColor="blue" className="h-full">
        <GlassCardHeader>
          <span className="text-[10px] font-mono font-semibold text-anvarr-slate tracking-widest uppercase">
            AI Prediction
          </span>
        </GlassCardHeader>
        <GlassCardBody>
          <div className="flex items-center justify-center h-20">
            <span className="text-[9px] font-mono text-anvarr-500 animate-pulse">
              LOADING MODEL...
            </span>
          </div>
        </GlassCardBody>
      </GlassCard>
    )
  }

  const dirColor = prediction.direction === "up" ? "text-anvarr-accent-green" : "text-anvarr-accent-red"
  const strengthColor = prediction.signal_strength === "strong"
    ? "text-anvarr-accent-green"
    : prediction.signal_strength === "moderate"
      ? "text-anvarr-gold"
      : "text-anvarr-slate"

  const confPct = (prediction.confidence / 100)

  return (
    <GlassCard glowColor="blue" className="h-full">
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-semibold text-anvarr-accent-blue tracking-widest uppercase">
            AI Prediction
          </span>
          <span className={`text-[9px] font-mono uppercase ${strengthColor}`}>
            {prediction.signal_strength}
          </span>
        </div>
      </GlassCardHeader>
      <GlassCardBody>
        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <span className={`text-lg font-mono font-bold ${dirColor}`}>
              {prediction.direction.toUpperCase()}
            </span>
            <span className="text-[11px] font-mono text-anvarr-slate-light">
              {prediction.price_change_pct >= 0 ? "+" : ""}{prediction.price_change_pct.toFixed(2)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
            <div className="bg-anvarr-900/50 rounded p-2">
              <span className="text-anvarr-500">TARGET</span>
              <p className="text-white text-[11px] mt-0.5">
                ${prediction.next_close_prediction.toFixed(2)}
              </p>
            </div>
            <div className="bg-anvarr-900/50 rounded p-2">
              <span className="text-anvarr-500">CURRENT</span>
              <p className="text-white text-[11px] mt-0.5">
                ${prediction.current_price.toFixed(2)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[9px] font-mono text-anvarr-500 mb-1">
              <span>CONFIDENCE</span>
              <span>{prediction.confidence.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-anvarr-900 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${confPct * 100}%`,
                  backgroundColor: confPct > 0.7
                    ? "#22c55e"
                    : confPct > 0.5
                      ? "#d4a030"
                      : "#ef4444",
                }}
              />
            </div>
          </div>

          <div className="pt-1 border-t border-anvarr-700/50">
            <p className="text-[8px] font-mono text-anvarr-500 mb-1.5">
              TOP FEATURES
            </p>
            <div className="space-y-1">
              {prediction.top_features.slice(0, 5).map((f) => (
                <div key={f.feature} className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-anvarr-slate w-20 truncate">
                    {f.feature}
                  </span>
                  <div className="flex-1 h-1 bg-anvarr-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-anvarr-accent-blue/60 rounded-full"
                      style={{ width: `${f.importance * 1500}%` }}
                    />
                  </div>
                  <span className="text-[7px] font-mono text-anvarr-500 w-8 text-right">
                    {(f.importance * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[8px] font-mono text-anvarr-600 pt-1">
            XGBoost · 10yr daily data · {prediction.top_features.length} features
          </p>
        </div>
      </GlassCardBody>
    </GlassCard>
  )
}
