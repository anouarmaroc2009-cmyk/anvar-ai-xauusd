import { ConfluenceFilter, confluenceFilter } from "./confluenceFilter"
import { macroEngine } from "./macroEngine"
import { smcEngine } from "./microEngine"
import { ConfluenceResult, ExecutionOrder, QuantitativeSignal } from "@/types/ai"
import { PositionSizingResult } from "@/lib/calculations/positionSizing"

type OrderCallback = (order: ExecutionOrder) => void

export class ExecutionManager {
  private orders: ExecutionOrder[] = []
  private positionSizer: { calculate: (equity: number, riskPercent: number, entryPrice: number, stopLoss: number) => PositionSizingResult }
  private riskRewardCalc: { calculate: (entry: number, sl: number, tp: number) => { rrr: number; riskPercent: number; rewardPercent: number } }
  private confluenceFilter: ConfluenceFilter
  private onOrderCreated: OrderCallback | null = null
  private pendingOrders: ExecutionOrder[] = []
  private maxConcurrentPositions = 3

  constructor() {
    this.confluenceFilter = confluenceFilter

    this.positionSizer = {
      calculate: (equity: number, riskPercent: number, entryPrice: number, stopLoss: number) => {
        const riskAmount = equity * (riskPercent / 100)
        const priceRisk = Math.abs(entryPrice - stopLoss)
        const size = priceRisk > 0 ? riskAmount / priceRisk : 0
        return {
          size: Math.round(size * 100) / 100,
          riskAmount,
          riskPercent,
          maxSize: size * 2,
          recommendedLeverage: 1,
        }
      },
    }

    this.riskRewardCalc = {
      calculate: (entry: number, sl: number, tp: number) => {
        const risk = Math.abs(entry - sl)
        const reward = Math.abs(tp - entry)
        return {
          rrr: risk > 0 ? reward / risk : 0,
          riskPercent: risk / entry,
          rewardPercent: reward / entry,
        }
      },
    }
  }

  setPositionSizer(sizer: typeof ExecutionManager.prototype.positionSizer) {
    this.positionSizer = sizer
  }

  setRiskRewardCalc(calc: typeof ExecutionManager.prototype.riskRewardCalc) {
    this.riskRewardCalc = calc
  }

  onOrder(callback: OrderCallback) {
    this.onOrderCreated = callback
  }

  evaluateOrder(params: {
    equity: number
    riskPercent: number
    entryPrice: number
    stopLoss: number
    takeProfit: number
    side: "buy" | "sell"
    quantSignal: QuantitativeSignal
  }): {
    canExecute: boolean
    confluence: ConfluenceResult
    order: ExecutionOrder | null
  } {
    const macro = macroEngine.analyze()
    const micro = smcEngine.getStructure("1h")
    const confluence = this.confluenceFilter.evaluate(macro, micro, params.quantSignal)

    if (!confluence.canExecute) {
      return { canExecute: false, confluence, order: null }
    }

    const activeOrders = this.orders.filter((o) => o.status === "active" || o.status === "pending")
    if (activeOrders.length >= this.maxConcurrentPositions) {
      return {
        canExecute: false,
        confluence: { ...confluence, canExecute: false, reasons: [...confluence.reasons, "Max concurrent positions reached"] },
        order: null,
      }
    }

    const sizing = this.positionSizer.calculate(
      params.equity,
      params.riskPercent,
      params.entryPrice,
      params.stopLoss
    )

    const rr = this.riskRewardCalc.calculate(
      params.entryPrice,
      params.stopLoss,
      params.takeProfit
    )

    const order: ExecutionOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "market",
      side: params.side,
      size: sizing.size,
      price: params.entryPrice,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      riskPercent: params.riskPercent,
      rrr: rr.rrr,
      confluenceScore: confluence.confidence,
      status: "pending",
      created: Date.now(),
    }

    this.pendingOrders.push(order)
    this.orders.push(order)
    this.onOrderCreated?.(order)

    return { canExecute: true, confluence, order }
  }

  confirmOrder(orderId: string) {
    const order = this.orders.find((o) => o.id === orderId)
    if (order && order.status === "pending") {
      order.status = "active"
    }
  }

  cancelOrder(orderId: string) {
    const order = this.orders.find((o) => o.id === orderId)
    if (order && (order.status === "pending" || order.status === "active")) {
      order.status = "cancelled"
    }
  }

  getOrders() {
    return this.orders
  }

  getActiveOrders() {
    return this.orders.filter((o) => o.status === "active" || o.status === "pending")
  }

  setMaxConcurrentPositions(max: number) {
    this.maxConcurrentPositions = max
  }
}

export const executionManager = new ExecutionManager()
