"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { createChart, IChartApi, ISeriesApi, CandlestickSeriesPartialOptions, CandlestickData, HistogramData } from "lightweight-charts"
import { GlassCard, GlassCardHeader, GlassCardBody } from "@/components/ui/GlassCard"
import { OHLCBar } from "@/types/market"
import { clsx } from "clsx"

interface TradingViewChartProps {
  bars: OHLCBar[]
  height?: number
  showVolume?: boolean
}

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "D"] as const
type TF = (typeof TIMEFRAMES)[number]

const TF_MS: Record<TF, number> = {
  "1m": 60000,
  "5m": 300000,
  "15m": 900000,
  "30m": 1800000,
  "1h": 3600000,
  "4h": 14400000,
  "D": 86400000,
}

function aggregateBars(raw: OHLCBar[], tf: TF): OHLCBar[] {
  const ms = TF_MS[tf]
  const buckets = new Map<number, OHLCBar>()
  for (const bar of raw) {
    const t = Math.floor(bar.time / ms) * ms
    const existing = buckets.get(t)
    if (existing) {
      existing.high = Math.max(existing.high, bar.high)
      existing.low = Math.min(existing.low, bar.low)
      existing.close = bar.close
      existing.volume += bar.volume
    } else {
      buckets.set(t, { time: t, open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume })
    }
  }
  return [...buckets.values()].sort((a, b) => a.time - b.time)
}

export function TradingViewChart({
  bars,
  height = 400,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
  const [selectedTF, setSelectedTF] = useState<TF>("1h")
  const [isFullscreen, setIsFullscreen] = useState(false)

  const aggBars = useMemo(() => aggregateBars(bars, selectedTF), [bars, selectedTF])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#64748b",
      },
      grid: {
        vertLines: { color: "#1e232a" },
        horzLines: { color: "#1e232a" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "#d4a030", style: 2, width: 1, labelBackgroundColor: "#d4a030" },
        horzLine: { color: "#d4a030", style: 2, width: 1, labelBackgroundColor: "#d4a030" },
      },
      timeScale: {
        borderColor: "#2a3038",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#2a3038",
      },
      width: containerRef.current.clientWidth,
      height,
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    } as CandlestickSeriesPartialOptions)

    const volumeSeries = chart.addHistogramSeries({
      color: "#2a3038",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    })

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [height])

  useEffect(() => {
    if (!candleSeriesRef.current || aggBars.length === 0) return

    const toTime = (ms: number): number => Math.floor(ms / 1000)

    const candleData: CandlestickData[] = aggBars.map((bar) => ({
      time: toTime(bar.time) as CandlestickData["time"],
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }))

    candleSeriesRef.current.setData(candleData)

    if (volumeSeriesRef.current) {
      const volumeData: HistogramData[] = aggBars.map((bar) => ({
        time: toTime(bar.time) as HistogramData["time"],
        value: bar.volume,
        color: bar.close >= bar.open ? "#22c55e44" : "#ef444444",
      }))
      volumeSeriesRef.current.setData(volumeData)
    }
  }, [aggBars])

  return (
    <GlassCard className={clsx("h-full", isFullscreen && "fixed inset-4 z-50")}>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-semibold text-anvarr-slate-light tracking-widest uppercase">
              Chart
            </span>
            <div className="flex gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTF(tf)}
                  className={clsx(
                    "px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors",
                    selectedTF === tf
                      ? "bg-anvarr-gold/20 text-anvarr-gold-light border border-anvarr-gold/30"
                      : "text-anvarr-slate hover:text-white"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-[9px] font-mono text-anvarr-slate hover:text-white transition-colors"
          >
            {isFullscreen ? "EXIT" : "EXPAND"}
          </button>
        </div>
      </GlassCardHeader>
      <GlassCardBody className="p-0">
        <div ref={containerRef} className="w-full" style={{ height }} />
      </GlassCardBody>
    </GlassCard>
  )
}
