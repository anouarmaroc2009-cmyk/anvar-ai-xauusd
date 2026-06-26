"use client"

import { motion } from "framer-motion"
import { clsx } from "clsx"
import { ReactNode } from "react"

interface GoldButtonProps {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export function GoldButton({
  children,
  variant = "primary",
  size = "md",
  loading,
  className,
  disabled,
  onClick,
}: GoldButtonProps) {
  const sizeCls = size === "sm" ? "px-3 py-1.5 text-xs" : size === "lg" ? "px-6 py-3 text-sm" : "px-4 py-2 text-xs"

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={clsx(
        "relative rounded-lg font-mono font-semibold tracking-wider uppercase transition-all duration-300",
        "border backdrop-blur-sm",
        variant === "primary" && [
          "bg-anvarr-gold/20 border-anvarr-gold/40 text-anvarr-gold-light",
          "hover:bg-anvarr-gold/30 hover:border-anvarr-gold/60 hover:shadow-gold",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none",
        ],
        variant === "secondary" && [
          "bg-anvarr-700/40 border-anvarr-600/50 text-anvarr-slate-light",
          "hover:bg-anvarr-700/60 hover:border-anvarr-500/70 hover:text-white",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        ],
        variant === "ghost" && [
          "bg-transparent border-transparent text-anvarr-slate-light",
          "hover:bg-anvarr-700/30 hover:text-white",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        ],
        sizeCls,
        className
      )}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-anvarr-gold/60 border-t-transparent rounded-full animate-spin" />
          Processing
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}
