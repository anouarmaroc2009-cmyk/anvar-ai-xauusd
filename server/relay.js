const { WebSocketServer } = require("ws")
const { MassiveClient } = require("./massive-client")
const https = require("https")

const PORT = process.env.RELAY_PORT || process.env.PORT || 3001
const SYMBOL = "XAUUSD"
const BASE_PRICE = 2350.0
const TICK_INTERVAL_MS = 10
const BATCH_INTERVAL_MS = 100
const BARS_INTERVAL_MS = 1000

let currentPrice = BASE_PRICE + (Math.random() - 0.5) * 10
let bid = currentPrice - 0.15
let ask = currentPrice + 0.15

// --- Free Gold Price API fallback ---
function fetchGoldPrice() {
  return new Promise((resolve) => {
    https.get("https://api.metals.live/v1/spot/gold", (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data)
          const price = parsed?.gold?.price || parsed?.price || parsed?.[0]?.price
          if (price && price > 1000) resolve(price)
        } catch {}
        resolve(null)
      })
    }).on("error", () => resolve(null))
  })
}

if (!process.env.MASSIVE_API_KEY) {
  fetchGoldPrice().then((realPrice) => {
    if (realPrice) {
      currentPrice = realPrice
      bid = realPrice - 0.15
      ask = realPrice + 0.15
      console.log(`[Relay] Free API: XAUUSD = $${realPrice.toFixed(2)}`)
    }
  })
  setInterval(async () => {
    const realPrice = await fetchGoldPrice()
    if (realPrice && realPrice > 1000) {
      currentPrice = currentPrice * 0.7 + realPrice * 0.3
      generator.syncTo(currentPrice)
    }
  }, 30000)
}

class PriceGenerator {
  constructor(startPrice) {
    this.price = startPrice
    this.volatility = 0.5
    this.trend = 0
  }

  syncTo(targetPrice) {
    this.price = this.price * 0.8 + targetPrice * 0.2
  }

  tick() {
    this.trend += (Math.random() - 0.5) * 0.003
    this.trend = Math.max(-0.08, Math.min(0.08, this.trend))
    this.volatility = 0.03 + Math.random() * 0.08
    const change = (Math.random() - 0.5 + this.trend) * this.volatility
    this.price += change
    this.price = Math.max(this.price, 1800)

    const spread = 0.08 + Math.random() * 0.25
    bid = parseFloat((this.price - spread / 2).toFixed(2))
    ask = parseFloat((this.price + spread / 2).toFixed(2))

    return {
      bid, ask,
      spread: parseFloat(spread.toFixed(2)),
      volume: Math.round(10 + Math.random() * 500),
      timestamp: Date.now(),
    }
  }
}

class OrderBookGenerator {
  generate(bid, ask) {
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

let secondBar = {
  time: Date.now(),
  open: currentPrice,
  high: currentPrice,
  low: currentPrice,
  close: currentPrice,
  volume: 0,
}

let usingMassiveBars = false
let massiveConnected = false
let useMock = true

function generateOrderBook() { return obGen.generate(bid, ask) }

function generateOrders() {
  const sides = ["buy", "sell"]
  const statuses = ["pending", "active", "filled"]
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

function broadcast(msg) {
  const payload = JSON.stringify(msg)
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(payload)
  }
}

wss.on("connection", (ws) => {
  console.log(`[Relay] Client connected (${wss.clients.size} total)`)
  ws.send(JSON.stringify({
    type: "status",
    data: {
      status: "connected",
      symbol: SYMBOL,
      mode: massiveConnected ? "live" : "simulated",
      provider: massiveConnected ? "massive" : (process.env.MASSIVE_API_KEY ? "massive-auth-failed" : "free-api"),
    },
  }))
  ws.on("close", () => console.log(`[Relay] Client disconnected (${wss.clients.size} total)`))
})

let tickBuffer = []
let tickBufferLock = false

function handleTick(tick) {
  if (!usingMassiveBars) {
    secondBar.high = Math.max(secondBar.high, tick.bid)
    secondBar.low = Math.min(secondBar.low, tick.bid)
    secondBar.close = tick.bid
    secondBar.volume += tick.volume
  }
  tickBuffer.push(tick)
}

function broadcastBar(bar) {
  broadcast({ type: "ohlc", data: bar, timestamp: Date.now() })
}

// --- Massive.com integration ---
if (process.env.MASSIVE_API_KEY) {
  const massive = new MassiveClient()

  massive.on("price", (tick) => {
    bid = tick.bid
    ask = tick.ask
    currentPrice = (bid + ask) / 2
    handleTick(tick)
  })

  massive.on("ohlc", (bar) => {
    usingMassiveBars = true
    secondBar = {
      time: bar.time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    }
    broadcastBar(secondBar)
    currentPrice = bar.close
    bid = bar.close
    ask = bar.close
    secondBar = {
      time: Date.now(),
      open: bar.close,
      high: bar.close,
      low: bar.close,
      close: bar.close,
      volume: 0,
    }
  })

  massive.on("status", (status) => {
    if (status.status === "connected") {
      massiveConnected = true
      useMock = false
      console.log(`[Relay] Connected to massive.com (${status.url || "forex"})`)
    } else if (status.status === "disconnected") {
      massiveConnected = false
      useMock = true
      usingMassiveBars = false
      console.log("[Relay] massive.com disconnected, fallback to simulated")
    }
  })

  massive.on("error", (err) => {
    console.error("[Relay] massive.com error:", err.message)
    if (!massiveConnected) {
      useMock = true
    }
  })

  massive.connect()

  setTimeout(() => {
    if (!massiveConnected) {
      useMock = true
      console.log("[Relay] massive.com timeout, using simulated data")
    }
  }, 5000)
} else {
  console.log("[Relay] No MASSIVE_API_KEY set, using simulated data. Set MASSIVE_API_KEY for live data.")
}

// --- Mock tick generator (only when not using massive) ---
setInterval(() => {
  if (!useMock) return
  const tick = generator.tick()
  handleTick(tick)
}, TICK_INTERVAL_MS)

// --- Batch broadcaster (100ms) ---
setInterval(() => {
  if (tickBuffer.length === 0) return
  const snapshot = tickBuffer
  tickBuffer = []
  tickBufferLock = false
  const lastTick = snapshot[snapshot.length - 1]

  const macroEvent = Math.random() > 0.995 ? {
    id: `evt_${Date.now()}`,
    type: ["FOMC", "CPI", "NFP", "Geopolitical"][Math.floor(Math.random() * 4)],
    title: "Market Event Update",
    impact: Math.random() > 0.7 ? "high" : "medium",
    timestamp: Date.now(),
    summary: "Live market event detected",
    sentiment: Math.random() > 0.5 ? "bullish" : "bearish",
  } : null

  broadcast({
    type: "price",
    data: {
      ...lastTick,
      orderbook: generateOrderBook(),
      orders: generateOrders().slice(0, 3),
      macroEvent,
      batchSize: snapshot.length,
    },
    timestamp: Date.now(),
  })
}, BATCH_INTERVAL_MS)

// --- 1s OHLC bar (only when not using massive CAS) ---
setInterval(() => {
  if (usingMassiveBars) return
  const bar = { ...secondBar }
  broadcastBar(bar)
  secondBar = {
    time: Date.now(),
    open: bar.close,
    high: bar.close,
    low: bar.close,
    close: bar.close,
    volume: 0,
  }
}, BARS_INTERVAL_MS)

// --- News generation ---
const NEWS_HEADLINES = [
  "Gold Surges as DXY Weakens on Fed Dovish Signals",
  "XAUUSD Hits Fresh Weekly High Amid Geopolitical Tensions",
  "CPI Data Miss Fuels Gold Rally — Rate Cut Bets Rise",
  "Gold Consolidates Near Resistance as Traders Await FOMC",
  "Safe-Haven Demand Lifts Gold as Equities Slide",
  "Strong NFP Report Pressures Gold — Dollar Strengthens",
  "Gold Retreats from Highs as Treasury Yields Climb",
  "Central Bank Gold Purchases Hit Multi-Year High",
  "Gold Holds Above Key Support Despite Strong USD",
  "Geopolitical Risk Premium Pushes Gold Above Key Level",
  "Fed Minutes Reveal Split — Gold Volatility Spikes",
  "Gold Slides as Fed Officials Push Back Against Rate Cuts",
  "Physical Gold Demand Surges in Asia Amid Festival Season",
  "XAUUSD Breaks Below 50-Day MA — Technical Selling Intensifies",
  "Rising Recession Fears Drive Capital into Gold",
]

const NEWS_SOURCES = ["Reuters", "Bloomberg", "CNBC", "MarketWatch", "Kitco News", "FXStreet", "Investing.com"]
const NEWS_CATEGORIES = ["economic", "geopolitical", "central-bank", "market", "supply-demand"]

setInterval(() => {
  const headline = NEWS_HEADLINES[Math.floor(Math.random() * NEWS_HEADLINES.length)]
  const source = NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)]
  const isBullish = /\b(surge|rally|gain|bullish|upside|jump|soar|climb|high|support|accumulation|demand)\b/i.test(headline)
  const isBearish = /\b(slide|drop|fall|decline|bearish|downside|plunge|selloff|low|resist|pressure|retreat)\b/i.test(headline)

  broadcast({
    type: "news",
    data: {
      id: `ws_news_${Date.now()}`,
      headline,
      summary: `${source} reports on XAUUSD market movements with implications for gold traders.`,
      source,
      url: "#",
      timestamp: Date.now(),
      sentiment: isBullish ? "bullish" : isBearish ? "bearish" : "neutral",
      relevance: Math.random() > 0.6 ? "high" : "medium",
      category: NEWS_CATEGORIES[Math.floor(Math.random() * NEWS_CATEGORIES.length)],
    },
    timestamp: Date.now(),
  })
}, 45000)

process.on("SIGINT", () => {
  console.log("[Relay] Shutting down...")
  wss.close()
  process.exit()
})
