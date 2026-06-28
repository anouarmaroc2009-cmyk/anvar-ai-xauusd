const { WebSocketServer } = require("ws")

const PORT = process.env.RELAY_PORT || 3001
const SYMBOL = "XAUUSD"
const BASE_PRICE = 2350.0
const TICK_INTERVAL_MS = 1000
const BARS_INTERVAL_MS = 60000

let currentPrice = BASE_PRICE + (Math.random() - 0.5) * 10
let bid = currentPrice - 0.15
let ask = currentPrice + 0.15

class PriceGenerator {
  private price: number
  private volatility: number
  private trend: number
  private timestamp: number

  constructor(startPrice: number) {
    this.price = startPrice
    this.volatility = 0.5
    this.trend = 0
    this.timestamp = Date.now()
  }

  tick(): { bid: number; ask: number; spread: number; volume: number; timestamp: number } {
    this.trend += (Math.random() - 0.5) * 0.02
    this.trend = Math.max(-0.5, Math.min(0.5, this.trend))
    this.volatility = 0.2 + Math.random() * 0.6
    const change = (Math.random() - 0.5 + this.trend) * this.volatility
    this.price += change
    this.price = Math.max(this.price, 1800)

    this.timestamp = Date.now()
    const spread = 0.08 + Math.random() * 0.25
    bid = parseFloat((this.price - spread / 2).toFixed(2))
    ask = parseFloat((this.price + spread / 2).toFixed(2))

    return {
      bid,
      ask,
      spread: parseFloat(spread.toFixed(2)),
      volume: Math.round(100 + Math.random() * 5000),
      timestamp: this.timestamp,
    }
  }
}

class OrderBookGenerator {
  generate(bid: number, ask: number) {
    const bids = []
    const asks = []
    let p = bid
    for (let i = 0; i < 12; i++) {
      const size = parseFloat((5 + Math.random() * 25).toFixed(1))
      bids.push({ price: parseFloat(p.toFixed(1)), size })
      p -= 0.3 + Math.random() * 0.5
    }
    p = ask
    for (let i = 0; i < 12; i++) {
      const size = parseFloat((5 + Math.random() * 25).toFixed(1))
      asks.push({ price: parseFloat(p.toFixed(1)), size })
      p += 0.3 + Math.random() * 0.5
    }
    return { bids, asks }
  }
}

const generator = new PriceGenerator(BASE_PRICE)
const obGen = new OrderBookGenerator()

let minuteBar = {
  time: Date.now(),
  open: currentPrice,
  high: currentPrice,
  low: currentPrice,
  close: currentPrice,
  volume: 0,
}

function generateOrderBook() {
  return obGen.generate(bid, ask)
}

function generateOrders() {
  const sides = ["buy", "sell"] as const
  const statuses = ["pending", "active", "filled"] as const
  const count = Math.floor(Math.random() * 4)
  return Array.from({ length: count }, () => ({
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    side: sides[Math.floor(Math.random() * 2)],
    size: parseFloat((1 + Math.random() * 10).toFixed(1)),
    price: Math.random() > 0.5 ? bid + (Math.random() - 0.5) * 5 : ask + (Math.random() - 0.5) * 5,
    status: statuses[Math.floor(Math.random() * 3)],
    timestamp: Date.now(),
  }))
}

const wss = new WebSocketServer({ port: PORT, clientTracking: true })
console.log(`[Relay] XAUUSD relay on ws://localhost:${PORT}`)

let clients = new Set()

wss.on("connection", (ws) => {
  clients.add(ws)
  console.log(`[Relay] Client connected (${clients.size} total)`)

  ws.send(JSON.stringify({
    type: "status",
    data: { status: "connected", symbol: SYMBOL, mode: process.env.TWELVEDATA_API_KEY ? "live" : "simulated" },
  }))

  ws.on("close", () => {
    clients.delete(ws)
    console.log(`[Relay] Client disconnected (${clients.size} total)`)
  })
})

setInterval(() => {
  const tick = generator.tick()

  minuteBar.high = Math.max(minuteBar.high, tick.bid)
  minuteBar.low = Math.min(minuteBar.low, tick.bid)
  minuteBar.close = tick.bid
  minuteBar.volume += tick.volume

  const ob = generateOrderBook()
  const orders = generateOrders()
  const macroEvent = Math.random() > 0.92 ? {
    id: `evt_${Date.now()}`,
    type: ["FOMC", "CPI", "NFP", "Geopolitical"][Math.floor(Math.random() * 4)],
    title: "Market Event Update",
    impact: Math.random() > 0.7 ? "high" : "medium",
    timestamp: Date.now(),
    summary: "Live market event detected",
    sentiment: Math.random() > 0.5 ? "bullish" : "bearish",
  } : null

  const payload = {
    type: "price",
    data: { ...tick, orderbook: ob, orders: orders.slice(0, 3), macroEvent },
    timestamp: Date.now(),
  }

  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(JSON.stringify(payload))
    }
  }
}, TICK_INTERVAL_MS)

setInterval(() => {
  const bar = { ...minuteBar }
  const msg = {
    type: "ohlc",
    data: bar,
    timestamp: Date.now(),
  }

  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(JSON.stringify(msg))
    }
  }

  minuteBar = {
    time: Date.now(),
    open: bar.close,
    high: bar.close,
    low: bar.close,
    close: bar.close,
    volume: 0,
  }
}, BARS_INTERVAL_MS)

process.on("SIGINT", () => {
  console.log("[Relay] Shutting down...")
  wss.close()
  process.exit()
})
