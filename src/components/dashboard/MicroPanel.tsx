"use client"

import { useEffect, useState } from "react"
import { GlassCard, GlassCardHeader, GlassCardBody } from "@/components/ui/GlassCard"
import { smcEngine } from "@/lib/ai/microEngine"
import { SMCStructure, FVG, OrderBlock, BOS, LiquiditySweep } from "@/types/ai"
import { motion } from "framer-motion"

function StructureLabel({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded bg-anvarr-900/40">
      <span className="text-[10px] font-mono text-anvarr-slate">{label}</span>
      <motion.span
        key={count}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className={`text-xs font-mono font-bold ${color}`}
      >
        {count}
      </motion.span>
    </div>
  )
}

export function MicroPanel() {
  const [structure, setStructure] = useState<SMCStructure>(() => smcEngine.getStructure("1h"))

  useEffect(() => {
    const interval = setInterval(() => {
      setStructure(smcEngine.getStructure("1h"))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const phaseColors = {
    accumulation: "text-anvarr-accent-green",
    manipulation: "text-anvarr-accent-orange",
    distribution: "text-anvarr-accent-red",
  }

  const structColors = {
    uptrend: "text-anvarr-accent-green",
    downtrend: "text-anvarr-accent-red",
    ranging: "text-anvarr-slate-light",
  }

  return (
    <GlassCard glowColor="blue" className="h-full">
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-semibold text-anvarr-accent-blue tracking-widest uppercase">
            SMC / ICT
          </span>
          <div className="flex gap-3 text-[9px] font-mono">
            <span className={structColors[structure.marketStructure]}>
              {structure.marketStructure.toUpperCase()}
            </span>
            <span className={phaseColors[structure.currentPhase]}>
              {structure.currentPhase.toUpperCase().slice(0, 5)}
            </span>
          </div>
        </div>
      </GlassCardHeader>
      <GlassCardBody>
        <div className="grid grid-cols-2 gap-1.5">
          <StructureLabel
            label="LIQ SWEEPS"
            count={structure.liquiditySweeps.length}
            color="text-anvarr-accent-orange"
          />
          <StructureLabel
            label="FVG"
            count={structure.fairValueGaps.filter((f: FVG) => !f.filled).length}
            color="text-anvarr-accent-blue"
          />
          <StructureLabel
            label="ORDER BLOCKS"
            count={structure.orderBlocks.filter((ob: OrderBlock) => !ob.tested).length}
            color="text-anvarr-accent-green"
          />
          <StructureLabel
            label="BOS / CHoCH"
            count={structure.breaksOfStructure.length}
            color="text-anvarr-gold-light"
          />
        </div>

        {structure.liquiditySweeps.length > 0 && (
          <div className="mt-3">
            <p className="text-[9px] font-mono text-anvarr-slate mb-1.5">RECENT SWEEPS</p>
            <div className="space-y-1">
              {structure.liquiditySweeps.slice(-3).reverse().map((s: LiquiditySweep, i: number) => (
                <div key={i} className="flex justify-between text-[9px] font-mono px-2 py-1 rounded bg-anvarr-900/30">
                  <span className={s.side === "buy" ? "text-anvarr-accent-green" : "text-anvarr-accent-red"}>
                    {s.side.toUpperCase()} @ {s.price.toFixed(2)}
                  </span>
                  <span className="text-anvarr-slate">{(s.magnitude * 100).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {structure.fairValueGaps.length > 0 && (
          <div className="mt-3 pt-2 border-t border-anvarr-700/50">
            <p className="text-[9px] font-mono text-anvarr-slate mb-1.5">FVG ZONES</p>
            <div className="space-y-1">
              {structure.fairValueGaps.filter((f: FVG) => !f.filled).slice(0, 2).map((fvg: FVG, i: number) => (
                <div key={i} className="flex justify-between text-[9px] font-mono px-2 py-1 rounded bg-anvarr-900/30">
                  <span className="text-anvarr-accent-blue">
                    {fvg.bottom.toFixed(2)} – {fvg.top.toFixed(2)}
                  </span>
                  <span className="text-anvarr-slate">{(fvg.strength * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCardBody>
    </GlassCard>
  )
}
