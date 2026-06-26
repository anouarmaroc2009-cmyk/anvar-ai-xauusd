import { DEFAULT_WS_CONFIG, WSConfig, WSConnectionState, WSSubscription } from "./types"

type MessageHandler = (data: unknown) => void
type StateHandler = (state: WSConnectionState) => void

export class XAUUSDWebSocket {
  private ws: WebSocket | null = null
  private config: WSConfig
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private subscriptions: WSSubscription[] = []
  private messageHandlers = new Map<string, Set<MessageHandler>>()
  private stateHandlers = new Set<StateHandler>()
  private _state: WSConnectionState = "disconnected"

  constructor(config?: Partial<WSConfig>) {
    this.config = { ...DEFAULT_WS_CONFIG, ...config }
  }

  get state() {
    return this._state
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return
    this.setState("connecting")

    try {
      this.ws = new WebSocket(this.config.url)
      this.ws.onopen = () => this.onOpen()
      this.ws.onclose = () => this.onClose()
      this.ws.onerror = () => this.onError()
      this.ws.onmessage = (event) => this.onMessage(event)
    } catch {
      this.scheduleReconnect()
    }
  }

  disconnect() {
    this.clearTimers()
    this.reconnectAttempts = this.config.maxReconnectAttempts
    this.ws?.close()
    this.ws = null
    this.setState("disconnected")
  }

  subscribe(sub: WSSubscription) {
    this.subscriptions.push(sub)
    if (this._state === "connected") {
      this.send({ action: "subscribe", ...sub })
    }
  }

  unsubscribe(channel: string, symbol: string) {
    this.subscriptions = this.subscriptions.filter(
      (s) => !(s.channel === channel && s.symbol === symbol)
    )
    if (this._state === "connected") {
      this.send({ action: "unsubscribe", channel, symbol })
    }
  }

  on(channel: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(channel)) {
      this.messageHandlers.set(channel, new Set())
    }
    this.messageHandlers.get(channel)!.add(handler)
    return () => this.messageHandlers.get(channel)?.delete(handler)
  }

  onStateChange(handler: StateHandler) {
    this.stateHandlers.add(handler)
    return () => this.stateHandlers.delete(handler)
  }

  private setState(state: WSConnectionState) {
    this._state = state
    this.stateHandlers.forEach((h) => h(state))
  }

  private onOpen() {
    this.setState("connected")
    this.reconnectAttempts = 0
    this.startHeartbeat()
    this.resubscribe()
  }

  private onClose() {
    this.clearTimers()
    this.setState("disconnected")
    this.scheduleReconnect()
  }

  private onError() {
    this.ws?.close()
  }

  private onMessage(event: MessageEvent) {
    try {
      const parsed = JSON.parse(event.data as string)
      const { type, channel, data } = parsed
      const channelName = channel || type || "raw"

      const handlers = this.messageHandlers.get(channelName)
      if (handlers) {
        handlers.forEach((h) => h(data ?? parsed))
      }

      const wildcardHandlers = this.messageHandlers.get("*")
      if (wildcardHandlers) {
        wildcardHandlers.forEach((h) => h(parsed))
      }
    } catch {
      const rawHandlers = this.messageHandlers.get("raw")
      if (rawHandlers) {
        rawHandlers.forEach((h) => h(event.data))
      }
    }
  }

  private send(data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  private resubscribe() {
    this.subscriptions.forEach((sub) => {
      this.send({ action: "subscribe", ...sub })
    })
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send({ action: "ping", timestamp: Date.now() })
    }, this.config.heartbeatInterval)
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) return
    this.reconnectAttempts++
    this.setState("reconnecting")
    this.reconnectTimer = setTimeout(
      () => this.connect(),
      this.config.reconnectInterval * Math.min(this.reconnectAttempts, 5)
    )
  }

  private clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
}

export const xauwsClient = new XAUUSDWebSocket()
