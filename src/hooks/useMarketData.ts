"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { XAUUSDPrice, OHLCBar } from "@/types/market"
import { QuantitativeSignal } from "@/types/ai"
import { useWebSocket } from "./useWebSocket"

export function useMarketData(initialBars?: OHLCBar[]) {
  const { state, subscribe, onMessage } = useWebSocket()
  const [price, setPrice] = useState<XAUUSDPrice | null>(null)
  const [bars, setBars] = useState<OHLCBar[]>(initialBars ?? [])
  const [historicalLoaded, setHistoricalLoaded] = useState(!!initialBars)
  const initialBarsRef = useRef(initialBars)

  useEffect(() => {
    if (initialBars && initialBars !== initialBarsRef.current) {
      initialBarsRef.current = initialBars
      setBars(initialBars)
      setHistoricalLoaded(true)
    }
  }, [initialBars])
  const [signal, setSignal] = useState<QuantitativeSignal>({
    signal: "neutral",
    strength: 0,
    rsi: 50,
    momentum: 0,
    volumeProfile: "neutral",
    support: 0,
    resistance: 0,
  })

  const priceHistory = useRef<number[]>([])

  useEffect(() => {
    if (state !== "connected") return

    subscribe("price", "XAUUSD")
    subscribe("ohlc", "XAUUSD", ["1m", "5m", "1h"])

    const unsubPrice = onMessage("price", (data) => {
      const p = data as XAUUSDPrice
      setPrice(p)
      priceHistory.current.push(p.bid)
      if (priceHistory.current.length > 100) priceHistory.current.shift()
    })

    const unsubOHLC = onMessage("ohlc", (data) => {
      const bar = data as OHLCBar
      setBars((prev) => {
        const updated = [...prev, bar]
        return updated.slice(-200)
      })
    })

    return () => {
      unsubPrice()
      unsubOHLC()
    }
  }, [state, subscribe, onMessage])

  useEffect(() => {
    if (priceHistory.current.length < 14) return

    const prices = priceHistory.current
    const currentPrice = prices[prices.length - 1]

    const gains = []
    const losses = []
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1]
      gains.push(Math.max(diff, 0))
      losses.push(Math.max(-diff, 0))
    }

    const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14
    const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

    const momentum = ((currentPrice - prices[prices.length - 14]) / prices[prices.length - 14]) * 100

    const recentHigh = Math.max(...prices.slice(-20))
    const recentLow = Math.min(...prices.slice(-20))

    let quantSignal: QuantitativeSignal["signal"] = "neutral"
    if (rsi > 70) quantSignal = "sell"
    else if (rsi < 30) quantSignal = "buy"
    else if (momentum > 0.5) quantSignal = "buy"
    else if (momentum < -0.5) quantSignal = "sell"

    setSignal({
      signal: quantSignal,
      strength: Math.min(Math.max(Math.abs(rsi - 50) / 50, Math.abs(momentum) / 5), 1),
      rsi: Math.round(rsi),
      momentum: Math.round(momentum * 100) / 100,
      volumeProfile: bars.length > 10
        ? bars.slice(-10).reduce((a, b) => a + b.volume, 0) >
          bars.slice(-20, -10).reduce((a, b) => a + b.volume, 0) / 2
          ? "accumulating"
          : "distributing"
        : "neutral",
      support: recentLow,
      resistance: recentHigh,
    })
  }, [bars])

  const generateMockPrice = useCallback(() => {
    const lastHistoricalClose = initialBars?.length ? initialBars[initialBars.length - 1].close : 0
    const lastPrice = price?.bid ?? lastHistoricalClose ?? 2350.0
    const change = (Math.random() - 0.5) * 2
    const newBid = lastPrice + change
    const spread = 0.1 + Math.random() * 0.3

    const mockPrice: XAUUSDPrice = {
      timestamp: Date.now(),
      bid: Math.round(newBid * 100) / 100,
      ask: Math.round((newBid + spread) * 100) / 100,
      spread: Math.round(spread * 100) / 100,
      volume: Math.round(Math.random() * 1000),
    }

    setPrice(mockPrice)
    priceHistory.current.push(mockPrice.bid)
    if (priceHistory.current.length > 100) priceHistory.current.shift()

    if (priceHistory.current.length >= 5 && priceHistory.current.length % 5 === 0) {
      const recent = priceHistory.current.slice(-5)
      const bar: OHLCBar = {
        time: Date.now(),
        open: recent[0],
        high: Math.max(...recent),
        low: Math.min(...recent),
        close: recent[recent.length - 1],
        volume: Math.round(Math.random() * 5000),
      }
      setBars((prev) => [...prev.slice(-199), bar])
    }

    return mockPrice
  }, [price])

  return { price, bars, signal, state, historicalLoaded, generateMockPrice }
}
