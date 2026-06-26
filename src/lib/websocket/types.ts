export interface WSConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

export const DEFAULT_WS_CONFIG: WSConfig = {
  url: "wss://data.anvarr.io/v1/xauusd",
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
}

export type WSConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting"

export interface WSSubscription {
  channel: string
  symbol: string
  intervals?: string[]
}
