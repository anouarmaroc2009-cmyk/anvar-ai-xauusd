export interface MLPrediction {
  timestamp: string
  current_price: number
  next_close_prediction: number
  price_change_pct: number
  direction: "up" | "down"
  confidence: number
  signal_strength: "strong" | "moderate" | "weak"
  recent_trend: "up" | "down"
  top_features: { feature: string; importance: number }[]
}
