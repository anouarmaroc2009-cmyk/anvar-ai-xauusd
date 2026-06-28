"use client"

import { GlassCard, GlassCardHeader, GlassCardBody } from "@/components/ui/GlassCard"
import { motion } from "framer-motion"

interface OrderLevel {
  price: number
  size: number
}

interface OrderBookPanelProps {
  bids?: OrderLevel[]
  asks?: OrderLevel[]
  spread?: number
  mid?: number
}

const defaultBids = [
  { price: 2349.8, size: 12.4 },
  { price: 2349.5, size: 8.7 },
  { price: 2349.2, size: 15.2 },
  { price: 2348.9, size: 5.1 },
  { price: 2348.5, size: 20.3 },
  { price: 2348.0, size: 11.6 },
  { price: 2347.5, size: 7.8 },
  { price: 2347.0, size: 9.2 },
]

const defaultAsks = [
  { price: 2350.2, size: 10.1 },
  { price: 2350.5, size: 14.3 },
  { price: 2350.8, size: 6.5 },
  { price: 2351.2, size: 18.7 },
  { price: 2351.6, size: 9.4 },
  { price: 2352.0, size: 12.8 },
  { price: 2352.5, size: 7.2 },
  { price: 2353.0, size: 15.9 },
]

function OrderRow({ price, size, side, max }: { price: number; size: number; side: "bid" | "ask"; max: number }) {
  const pct = (size / max) * 100
  return (
    <div className="flex items-center gap-2 py-0.5 group relative">
      <div className="flex-1 relative h-4 flex items-center">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`absolute left-0 top-0 bottom-0 rounded-sm ${
            side === "bid" ? "bg-anvarr-accent-green/15" : "bg-anvarr-accent-red/15"
          }`}
        />
        {side === "ask" && (
          <div className="flex w-full items-center justify-between relative z-10 px-1">
            <span className="text-[10px] font-mono text-anvarr-accent-red tabular-nums">{size.toFixed(1)}</span>
            <span className="text-[10px] font-mono text-white tabular-nums">{price.toFixed(1)}</span>
          </div>
        )}
        {side === "bid" && (
          <div className="flex w-full items-center justify-between relative z-10 px-1">
            <span className="text-[10px] font-mono text-white tabular-nums">{price.toFixed(1)}</span>
            <span className="text-[10px] font-mono text-anvarr-accent-green tabular-nums">{size.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function OrderBookPanel({ bids: liveBids, asks: liveAsks, spread: liveSpread, mid: liveMid }: OrderBookPanelProps) {
  const bids = liveBids ?? defaultBids
  const asks = liveAsks ?? defaultAsks
  const mid = liveMid ?? (((bids[0]?.price ?? 0) + (asks[0]?.price ?? 0)) / 2)
  const spread = liveSpread ?? ((asks[0]?.price ?? 0) - (bids[0]?.price ?? 0))
  const maxSize = Math.max(...bids.map((b) => b.size), ...asks.map((a) => a.size))

  return (
    <GlassCard className="h-full">
      <GlassCardHeader>
        <span className="text-[10px] font-mono font-semibold text-anvarr-slate-light tracking-widest uppercase">
          Order Book
        </span>
      </GlassCardHeader>
      <GlassCardBody className="p-2">
        <div className="space-y-0.5">
          {asks.slice().reverse().map((ask, i) => (
            <OrderRow key={`ask-${i}`} {...ask} side="ask" max={maxSize} />
          ))}
        </div>
        <div className="my-1 py-1 border-y border-anvarr-700/50 text-center">
          <span className="text-[9px] font-mono text-anvarr-gold font-bold">
            {mid.toFixed(2)}
          </span>
          <span className="text-[8px] font-mono text-anvarr-slate ml-2">
            SPREAD {spread.toFixed(1)}
          </span>
        </div>
        <div className="space-y-0.5">
          {bids.map((bid, i) => (
            <OrderRow key={`bid-${i}`} {...bid} side="bid" max={maxSize} />
          ))}
        </div>
      </GlassCardBody>
    </GlassCard>
  )
}
