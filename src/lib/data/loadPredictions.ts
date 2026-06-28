"use client"

import { MLPrediction } from "@/types/predictions"

export async function loadPredictions(): Promise<MLPrediction | null> {
  try {
    const res = await fetch("/data/predictions.json")
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
