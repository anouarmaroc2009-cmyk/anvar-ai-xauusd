const WebSocket = require("ws")

const SUBSCRIPTION_EVENTS = {
  forex: { quote: "C", aggSec: "CAS", aggMin: "CA" },
  stocks: { quote: "Q", aggSec: "A", aggMin: "AM" },
  indices: { value: "V", aggSec: "IV", aggMin: "IM" },
}

class MassiveClient {
  constructor(options = {}) {
    this.url = options.url || process.env.MASSIVE_WS_URL || "wss://socket.massive.com/forex"
    this.apiKey = options.apiKey || process.env.MASSIVE_API_KEY || ""
    this.ticker = options.ticker || process.env.MASSIVE_TICKER || "XAU-USD"
    this.subscriptions = options.subscriptions || (process.env.MASSIVE_SUBSCRIPTIONS || "C,CAS").split(",")
    this.reconnectInterval = options.reconnectInterval || 3000
    this.maxReconnects = options.maxReconnects || 20

    this.ws = null
    this.reconnectCount = 0
    this.reconnectTimer = null
    this._connected = false
    this._destroyed = false
    this.listeners = {}
  }

  get connected() {
    return this._connected
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(callback)
    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }

  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(...args))
    }
  }

  connect() {
    if (this._destroyed) return
    if (!this.apiKey) {
      this.emit("error", new Error("MASSIVE_API_KEY not set"))
      return
    }

    try {
      this.ws = new WebSocket(this.url)
    } catch (err) {
      this.emit("error", err)
      this.scheduleReconnect()
      return
    }

    this.ws.on("open", () => {
      this._connected = true
      this.reconnectCount = 0
      this.ws.send(JSON.stringify({ action: "auth", params: this.apiKey }))
      for (const ev of this.subscriptions) {
        const params = `${ev}.${this.ticker}`
        this.ws.send(JSON.stringify({ action: "subscribe", params }))
        console.log(`[MassiveClient] Subscribed to ${params}`)
      }
      this.emit("status", { status: "connected", provider: "massive", url: this.url })
    })

    this.ws.on("message", (raw) => {
      try {
        const msgs = raw.toString().split("\n").filter(Boolean)
        for (const line of msgs) {
          const msg = JSON.parse(line)
          this.handleMessage(msg)
        }
      } catch {
        // skip unparseable messages
      }
    })

    this.ws.on("close", () => {
      this._connected = false
      this.emit("status", { status: "disconnected" })
      if (!this._destroyed) this.scheduleReconnect()
    })

    this.ws.on("error", (err) => {
      this.emit("error", err)
    })
  }

  handleMessage(msg) {
    if (msg.ev === "status") {
      this.emit("status", msg)
      return
    }

    if (msg.ev === "C") {
      const tick = {
        bid: msg.b,
        ask: msg.a,
        spread: parseFloat((msg.a - msg.b).toFixed(5)),
        volume: 0,
        timestamp: msg.t || Date.now(),
      }
      this.emit("price", tick)
      return
    }

    if (msg.ev === "CAS" || msg.ev === "CA") {
      const bar = {
        time: msg.s,
        open: msg.o,
        high: msg.h,
        low: msg.l,
        close: msg.c,
        volume: msg.v || 0,
      }
      this.emit("ohlc", bar)
      return
    }

    if (msg.ev === "Q") {
      const tick = {
        bid: msg.bp,
        ask: msg.ap,
        spread: parseFloat((msg.ap - msg.bp).toFixed(2)),
        volume: 0,
        timestamp: msg.t || Date.now(),
      }
      this.emit("price", tick)
      return
    }

    if (msg.ev === "A" || msg.ev === "AM") {
      const bar = {
        time: msg.s,
        open: msg.o,
        high: msg.h,
        low: msg.l,
        close: msg.c,
        volume: msg.v || 0,
      }
      this.emit("ohlc", bar)
      return
    }
  }

  disconnect() {
    this._destroyed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this._connected = false
  }

  scheduleReconnect() {
    if (this.reconnectCount >= this.maxReconnects) return
    this.reconnectCount++
    this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectInterval * Math.min(this.reconnectCount, 5))
  }
}

module.exports = { MassiveClient, SUBSCRIPTION_EVENTS }
