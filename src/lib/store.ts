import { create } from "zustand"
import { DashboardLayout, PanelSize, DashboardPanel, Notification } from "@/types/ui"

interface AppState {
  dashboard: DashboardLayout
  notifications: Notification[]
  deepFocusMode: boolean

  setPanelSize: (panelId: string, size: PanelSize) => void
  toggleDeepFocus: () => void
  addNotification: (n: Notification) => void
  markRead: (id: string) => void
  clearNotifications: () => void
}

const defaultPanels: DashboardPanel[] = [
  { id: "macro", type: "macro", size: "default", order: 0 },
  { id: "micro", type: "micro", size: "default", order: 1 },
  { id: "calculator", type: "calculator", size: "default", order: 2 },
  { id: "execution", type: "execution", size: "default", order: 3 },
  { id: "orderbook", type: "orderbook", size: "default", order: 4 },
  { id: "chart", type: "chart", size: "default", order: 5 },
]

export const useAppStore = create<AppState>((set) => ({
  dashboard: {
    panels: defaultPanels,
    activeFocus: null,
    deepFocusMode: false,
  },
  notifications: [],
  deepFocusMode: false,

  setPanelSize: (panelId, size) =>
    set((state) => ({
      dashboard: {
        ...state.dashboard,
        panels: state.dashboard.panels.map((p) =>
          p.id === panelId ? { ...p, size } : p
        ),
      },
    })),

  toggleDeepFocus: () =>
    set((state) => ({
      deepFocusMode: !state.deepFocusMode,
      dashboard: {
        ...state.dashboard,
        deepFocusMode: !state.dashboard.deepFocusMode,
        activeFocus: !state.deepFocusMode ? "chart" : null,
      },
    })),

  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications].slice(0, 50),
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  clearNotifications: () => set({ notifications: [] }),
}))
