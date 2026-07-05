"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { clsx } from "clsx"

interface AnimatedNumberProps {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  duration?: number
  format?: "price" | "percent" | "integer"
}

export function AnimatedNumber({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  className,
  duration = 0.8,
  format = "price",
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevValueRef = useRef(0)
  const initRef = useRef(false)

  useEffect(() => {
    if (!ref.current) return

    if (!initRef.current) {
      let formatted: string
      switch (format) {
        case "percent":
          formatted = value.toFixed(decimals) + "%"
          break
        case "integer":
          formatted = Math.round(value).toLocaleString()
          break
        default:
          formatted = prefix + value.toFixed(decimals) + suffix
      }
      ref.current.textContent = formatted
      prevValueRef.current = value
      initRef.current = true
      return
    }

    const obj = { value: prevValueRef.current }
    gsap.to(obj, {
      value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) {
          let formatted: string
          switch (format) {
            case "percent":
              formatted = obj.value.toFixed(decimals) + "%"
              break
            case "integer":
              formatted = Math.round(obj.value).toLocaleString()
              break
            default:
              formatted = obj.value.toFixed(decimals)
          }
          ref.current.textContent = prefix + formatted + suffix
        }
      },
      onComplete: () => {
        prevValueRef.current = value
      },
    })
  }, [value, decimals, duration, format, prefix, suffix])

  const dir = value !== prevValueRef.current ? (value > prevValueRef.current ? "up" : "down") : "neutral"

  return (
    <span
      ref={ref}
      className={clsx(
        "font-mono tabular-nums transition-colors duration-300",
        dir === "up" && "text-anvarr-accent-green",
        dir === "down" && "text-anvarr-accent-red",
        className
      )}
    />
  )
}
