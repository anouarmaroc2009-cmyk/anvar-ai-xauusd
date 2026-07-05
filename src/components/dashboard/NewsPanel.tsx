"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard, GlassCardHeader, GlassCardBody } from "@/components/ui/GlassCard"
import { XAUUSDNewsItem } from "@/types/news"
import { getNewsService } from "@/lib/data/newsService"
import { orchestrator } from "@/lib/ai/orchestrator"
import { clsx } from "clsx"

const categoryColors: Record<string, string> = {
  "economic": "border-anvarr-accent-blue bg-anvarr-accent-blue/5",
  "geopolitical": "border-anvarr-accent-red bg-anvarr-accent-red/5",
  "central-bank": "border-anvarr-gold bg-anvarr-gold/5",
  "market": "border-anvarr-accent-green bg-anvarr-accent-green/5",
  "supply-demand": "border-anvarr-accent-orange bg-anvarr-accent-orange/5",
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NewsPanel() {
  const [news, setNews] = useState<XAUUSDNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)

  const service = getNewsService()

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const items = await service.getLatestNews()
      setNews(items)
      orchestrator.ingestNewsBatch(items)
    } catch (e) {
      setError("Failed to load news")
    } finally {
      setLoading(false)
    }
  }, [service])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 120000)
    return () => clearInterval(interval)
  }, [refresh])

  const filtered = filter ? news.filter((n) => n.category === filter) : news
  const categories = Array.from(new Set(news.map((n) => n.category))) as string[]

  const categoryCount = (cat: string) => news.filter((n) => n.category === cat).length

  return (
    <GlassCard glowColor="gold" className="h-full flex flex-col">
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold text-anvarr-gold tracking-widest uppercase">
              XAUUSD News
            </span>
            <span className={clsx(
              "w-1.5 h-1.5 rounded-full",
              loading ? "bg-anvarr-accent-orange animate-pulse" : "bg-anvarr-accent-green"
            )} />
          </div>
          <div className="flex items-center gap-1">
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? null : cat)}
                className={clsx(
                  "px-1.5 py-0.5 rounded text-[7px] font-mono uppercase tracking-wider transition-colors",
                  filter === cat
                    ? "bg-anvarr-gold/20 text-anvarr-gold-light border border-anvarr-gold/40"
                    : "text-anvarr-500 hover:text-anvarr-slate-light border border-transparent"
                )}
              >
                {cat.replace("-", " ")} ({categoryCount(cat)})
              </button>
            ))}
            {filter && (
              <button
                onClick={() => setFilter(null)}
                className="text-[8px] font-mono text-anvarr-500 hover:text-white ml-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </GlassCardHeader>
      <GlassCardBody className="flex-1 overflow-y-auto min-h-0">
        {loading && news.length === 0 ? (
          <div className="flex items-center justify-center h-20">
            <span className="text-[9px] font-mono text-anvarr-500 animate-pulse">
              LOADING NEWS...
            </span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-20">
            <span className="text-[9px] font-mono text-anvarr-accent-red">{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-20">
            <span className="text-[9px] font-mono text-anvarr-500">No news matching filter</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {filtered.slice(0, 20).map((item) => (
                <motion.a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className={clsx(
                    "block p-2 rounded-lg border-l-2 transition-all duration-200 group",
                    categoryColors[item.category] ?? "border-anvarr-600 bg-anvarr-700/20",
                    "hover:bg-anvarr-700/40"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white font-medium leading-tight group-hover:text-anvarr-gold-light transition-colors line-clamp-2">
                        {item.headline}
                      </p>
                      <p className="text-[8px] text-anvarr-slate mt-0.5 line-clamp-1">
                        {item.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[7px] font-mono text-anvarr-500">
                          {item.source}
                        </span>
                        <span className="text-[7px] font-mono text-anvarr-600">
                          {timeAgo(item.timestamp)}
                        </span>
                        <span className={clsx(
                          "text-[7px] font-mono font-semibold uppercase",
                          item.sentiment === "bullish" ? "text-anvarr-accent-green" :
                            item.sentiment === "bearish" ? "text-anvarr-accent-red" :
                              "text-anvarr-slate"
                        )}>
                          {item.sentiment === "bullish" ? "▲" : item.sentiment === "bearish" ? "▼" : "◆"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
        )}
      </GlassCardBody>
      <div className="px-4 py-1.5 border-t border-anvarr-700/30 flex items-center justify-between">
        <span className="text-[7px] font-mono text-anvarr-600">
          {news.length > 0 ? `${filtered.length} stories · ${timeAgo(news[0].timestamp)}` : "No stories"}
        </span>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-[7px] font-mono text-anvarr-500 hover:text-anvarr-gold-light transition-colors disabled:opacity-50"
        >
          {loading ? "REFRESHING..." : "REFRESH"}
        </button>
      </div>
    </GlassCard>
  )
}
