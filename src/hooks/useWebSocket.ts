"use client"

import { useEffect, useCallback, useState } from "react"
import { xauwsClient } from "@/lib/websocket/client"
import { WSConnectionState } from "@/lib/websocket/types"

export function useWebSocket() {
  const [state, setState] = useState<WSConnectionState>(xauwsClient.state)

  useEffect(() => {
    const unsub = xauwsClient.onStateChange(setState)
    xauwsClient.connect()
    return () => {
      unsub()
      xauwsClient.disconnect()
    }
  }, [])

  const subscribe = useCallback((channel: string, symbol: string, intervals?: string[]) => {
    xauwsClient.subscribe({ channel, symbol, intervals })
  }, [])

  const onMessage = useCallback((channel: string, handler: (data: unknown) => void) => {
    return xauwsClient.on(channel, handler)
  }, [])

  return { state, subscribe, onMessage, client: xauwsClient }
}
