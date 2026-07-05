"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { XAUUSDPrice, OHLCBar } from "@/types/market"
import { QuantitativeSignal, ExecutionOrder } from "@/types/ai"
import { XAUUSDNewsItem } from "@/types/news"
import { useWebSocket } from "./useWebSocket"
import { macroEngine } from "@/lib/ai/macroEngine"

export function useMarketData(initialBars?: OHLCBar[], onNews?: (item: XAUUSDNewsItem) => void) {
  const { state, subscribe, onMessage } = useWebSocket()
  const [price, setPrice] = useState<XAUUSDPrice | null>(null)
  const [bars, setBars] = useState<OHLCBar[]>(initialBars ?? [])
  const [historicalLoaded, setHistoricalLoaded] = useState(!!initialBars)
  const [orderBook, setOrderBook] = useState<{ bids: { price: number; size: number }[]; asks: { price: number; size: number }[] } | null>(null)
  const [recentOrders, setRecentOrders] = useState<ExecutionOrder[]>([])
  const [signal, setSignal] = useState<QuantitativeSignal>({
    signal: "neutral",
    strength: 0,
    rsi: 50,
    momentum: 0,
    volumeProfile: "neutral",
    support: 0,
    resistance: 0,
  })

  const initialBarsRef = useRef(initialBars)

  useEffect(() => {
    if (initialBars && initialBars !== initialBarsRef.current) {
      initialBarsRef.current = initialBars
      setBars(initialBars)
      setHistoricalLoaded(true)
    }
  }, [initialBars])

  const priceHistory = useRef<number[]>([])

  useEffect(() => {
    if (state !== "connected") return

    subscribe("price", "XAUUSD")
    subscribe("ohlc", "XAUUSD", ["1m"])

    const unsubPrice = onMessage("price", (data: any) => {
      const tick = data as XAUUSDPrice & { orderbook?: any; orders?: any[]; macroEvent?: any }
      setPrice(tick)
      priceHistory.current.push(tick.bid)
      if (priceHistory.current.length > 1000) priceHistory.current.shift()

      if (tick.orderbook) setOrderBook(tick.orderbook)
      if (tick.orders) {
        setRecentOrders(tick.orders.map((o: any) => ({
          id: o.id,
          side: o.side,
          size: o.size,
          price: o.price,
          status: o.status,
          type: "market",
          stopLoss: 0,
          takeProfit: 0,
          riskPercent: 0,
          rrr: 0,
          confluenceScore: 0,
          created: o.timestamp,
        })))
      }
      if (tick.macroEvent) {
        macroEngine.ingestEvent(tick.macroEvent)
      }
    })

    const unsubOHLC = onMessage("ohlc", (data) => {
      const bar = data as OHLCBar
      setBars((prev) => {
        const updated = [...prev, bar]
        return updated.slice(-500)
      })
    })

    const unsubNews = onMessage("news", (data) => {
      const item = data as XAUUSDNewsItem
      if (onNews) onNews(item)
    })

    return () => {
      unsubPrice()
      unsubOHLC()
      unsubNews()
    }
  }, [state, subscribe, onMessage, onNews])

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

    const recentHigh = Math.max(...prices.slice(-200))
    const recentLow = Math.min(...prices.slice(-200))

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

  const trendRef = useRef(0)
  const lastPriceRef = useRef<number | null>(null)
  const currentBarRef = useRef<OHLCBar | null>(null)
  const latestTickRef = useRef<XAUUSDPrice | null>(null)
  const livePriceRef = useRef<number | null>(null)

  useEffect(() => {
    if (state === "connected") return
    let cancelled = false
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/live-price")
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.price && data.price > 1000) {
          livePriceRef.current = data.price
          lastPriceRef.current = data.price
        }
      } catch {}
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [state])

  const generateMockPrice = useCallback(() => {
    if (state === "connected") return null

    const lastHistoricalClose = initialBars?.length ? initialBars[initialBars.length - 1].close : 0
    const startPrice = lastPriceRef.current ?? price?.bid ?? livePriceRef.current ?? lastHistoricalClose ?? 2350.0

    if (lastPriceRef.current === null) {
      lastPriceRef.current = startPrice
    }

    trendRef.current += (Math.random() - 0.5) * 0.003
    trendRef.current = Math.max(-0.08, Math.min(0.08, trendRef.current))

    const volatility = 0.03 + Math.random() * 0.08
    const change = (Math.random() - 0.5 + trendRef.current) * volatility
    const newBid = Math.round((startPrice + change) * 100) / 100
    const spread = parseFloat((0.08 + Math.random() * 0.25).toFixed(2))

    const mockPrice: XAUUSDPrice = {
      timestamp: Date.now(),
      bid: newBid,
      ask: parseFloat((newBid + spread).toFixed(2)),
      spread,
      volume: Math.round(10 + Math.random() * 500),
    }

    lastPriceRef.current = newBid

    if (currentBarRef.current === null) {
      currentBarRef.current = {
        time: Date.now(),
        open: newBid,
        high: newBid,
        low: newBid,
        close: newBid,
        volume: mockPrice.volume,
      }
    }

    const bar = currentBarRef.current
    bar.high = Math.max(bar.high, newBid)
    bar.low = Math.min(bar.low, newBid)
    bar.close = newBid
    bar.volume += mockPrice.volume

    if (Date.now() - bar.time >= 1000) {
      setBars((prev) => [...prev.slice(-499), { ...bar }])
      currentBarRef.current = {
        time: Date.now(),
        open: newBid,
        high: newBid,
        low: newBid,
        close: newBid,
        volume: mockPrice.volume,
      }
    } else {
      setBars((prev) => {
        if (prev.length === 0) return [{ ...bar }]
        const updated = [...prev]
        updated[updated.length - 1] = { ...bar }
        return updated
      })
    }

    latestTickRef.current = mockPrice
    priceHistory.current.push(mockPrice.bid)
    if (priceHistory.current.length > 1000) priceHistory.current.shift()

    return mockPrice
  }, [state])


  useEffect(() => {
    if (state === "connected") return
    const interval = setInterval(() => {
      if (latestTickRef.current) {
        setPrice(latestTickRef.current)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [state])

  return {
    price,
    bars,
    signal,
    state,
    historicalLoaded,
    orderBook,
    recentOrders,
    generateMockPrice,
    livePrice: livePriceRef.current,
  }
}
