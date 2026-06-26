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
  const prevValue = useRef(0)

  useEffect(() => {
    if (!ref.current) return

    const obj = { value: prevValue.current }
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
          ref.current.textContent = formatted
        }
      },
      onComplete: () => {
        prevValue.current = value
      },
    })
  }, [value, decimals, duration, format])

  const dir = value !== prevValue.current ? (value > prevValue.current ? "up" : "down") : "neutral"

  return (
    <span
      ref={ref}
      className={clsx(
        "font-mono tabular-nums transition-colors duration-300",
        dir === "up" && "text-anvarr-accent-green",
        dir === "down" && "text-anvarr-accent-red",
        className
      )}
    >
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  )
}
