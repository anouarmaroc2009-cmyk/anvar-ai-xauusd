export type PanelSize = "collapsed" | "default" | "expanded" | "fullscreen"

export interface DashboardPanel {
  id: string
  type: "macro" | "micro" | "calculator" | "execution" | "orderbook" | "chart"
  size: PanelSize
  position?: { x: number; y: number }
  order: number
}

export interface DashboardLayout {
  panels: DashboardPanel[]
  activeFocus: string | null
  deepFocusMode: boolean
}

export type BiasDisplay = {
  label: string
  color: string
  icon: string
}

export interface Notification {
  id: string
  type: "signal" | "execution" | "alert" | "system"
  severity: "info" | "warning" | "critical"
  message: string
  timestamp: number
  read: boolean
}
