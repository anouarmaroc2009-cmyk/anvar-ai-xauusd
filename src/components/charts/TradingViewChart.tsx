"use client"

import { useEffect, useRef, useState } from "react"
import { createChart, IChartApi, ISeriesApi, CandlestickSeriesPartialOptions, CandlestickData, LineSeriesPartialOptions, LineData } from "lightweight-charts"
import { GlassCard, GlassCardHeader, GlassCardBody } from "@/components/ui/GlassCard"
import { OHLCBar } from "@/types/market"
import { clsx } from "clsx"

interface TradingViewChartProps {
  bars: OHLCBar[]
  height?: number
  showVolume?: boolean
}

const timeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "D"]

export function TradingViewChart({
  bars,
  height = 400,
  showVolume = true,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
  const [selectedTF, setSelectedTF] = useState("1h")
  const [isFullscreen, setIsFullscreen] = useState(false)

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
    if (!candleSeriesRef.current || bars.length === 0) return

    const candleData: CandlestickData[] = bars.map((bar) => ({
      time: Math.floor(bar.time / 1000) as any,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }))

    candleSeriesRef.current.setData(candleData)
  }, [bars])

  return (
    <GlassCard className={clsx("h-full", isFullscreen && "fixed inset-4 z-50")}>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-semibold text-anvarr-slate-light tracking-widest uppercase">
              Chart
            </span>
            <div className="flex gap-1">
              {timeframes.map((tf) => (
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
