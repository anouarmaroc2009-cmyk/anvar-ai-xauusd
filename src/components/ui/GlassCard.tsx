"use client"

import { motion } from "framer-motion"
import { clsx } from "clsx"
import { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  variant?: "default" | "elevated" | "gold"
  hoverEffect?: boolean
  glowColor?: "gold" | "blue" | "none"
  className?: string
}

export function GlassCard({
  children,
  variant = "default",
  hoverEffect = true,
  glowColor = "none",
  className,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={clsx(
        "rounded-xl border backdrop-blur-xl transition-all duration-300",
        variant === "default" && "bg-anvarr-800/60 border-anvarr-700/50 shadow-glass",
        variant === "elevated" && "bg-anvarr-800/80 border-anvarr-600/40 shadow-glass shadow-lg",
        variant === "gold" && "bg-anvarr-800/60 border-anvarr-gold/20 shadow-glass shadow-gold",
        glowColor === "gold" && "hover:shadow-gold hover:border-anvarr-gold/40",
        glowColor === "blue" && "hover:shadow-blue-500/20 hover:border-blue-500/30",
        hoverEffect && "cursor-default",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export function GlassCardHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={clsx("px-4 py-3 border-b border-anvarr-700/50", className)}>
      {children}
    </div>
  )
}

export function GlassCardBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={clsx("p-4", className)}>{children}</div>
}
