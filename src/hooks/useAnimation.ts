"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"

export function useGsapAnimation<T extends HTMLElement>(
  config: gsap.TweenVars,
  deps: unknown[] = []
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, { opacity: 0, ...config.from }, config.to ?? config)
    }
  }, deps)

  return ref
}

export function useCountUp(
  target: number,
  duration: number = 1,
  deps: unknown[] = []
) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const obj = { value: 0 }
    gsap.to(obj, {
      value: target,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = obj.value.toFixed(2)
        }
      },
    })
  }, [target, duration, ...deps])

  return ref
}

export function useParallax(intensity: number = 0.5) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      gsap.to(el, {
        x: x * intensity * 20,
        y: y * intensity * 20,
        duration: 0.4,
        ease: "power1.out",
      })
    }

    window.addEventListener("mousemove", handleMove)
    return () => window.removeEventListener("mousemove", handleMove)
  }, [intensity])

  return ref
}
