export interface WSConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

export const DEFAULT_WS_CONFIG: WSConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
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
