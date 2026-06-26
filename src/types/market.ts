export interface XAUUSDPrice {
  timestamp: number
  bid: number
  ask: number
  spread: number
  volume: number
}

export interface OHLCBar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface OrderBookLevel {
  price: number
  size: number
  side: "bid" | "ask"
}

export interface OrderBookSnapshot {
  timestamp: number
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

export interface MarketDepth {
  bids: [number, number][]
  asks: [number, number][]
}

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "D" | "W"

export interface WebSocketMessage {
  type: "price" | "ohlc" | "orderbook" | "trade" | "error" | "status"
  data: unknown
  timestamp: number
}
