"use client"

import { motion } from "framer-motion"
import { XAUUSDPrice } from "@/types/market"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"

interface PriceTickerProps {
  price: XAUUSDPrice | null
}

export function PriceTicker({ price }: PriceTickerProps) {
  return (
    <div className="flex items-center gap-6 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-semibold text-anvarr-gold tracking-widest uppercase">XAUUSD</span>
        <div className="h-3 w-px bg-anvarr-600" />
        <AnimatedNumber
          value={price?.bid ?? 0}
          decimals={2}
          prefix="$"
          className="text-lg font-bold tracking-tight"
          duration={0.4}
        />
      </div>
      <div className="flex items-center gap-3 text-[10px] font-mono text-anvarr-slate">
        <span>ASK <AnimatedNumber value={price?.ask ?? 0} decimals={2} className="text-white" duration={0.4} /></span>
        <span className="text-anvarr-500">|</span>
        <span>SPR <span className="text-anvarr-slate-light">{(price?.spread ?? 0).toFixed(1)}</span></span>
        <span className="text-anvarr-500">|</span>
        <span>VOL <span className="text-anvarr-slate-light">{price?.volume ?? 0}</span></span>
      </div>
    </div>
  )
}
