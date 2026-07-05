import { XAUUSDNewsItem } from "@/types/news"

const HEADLINE_TEMPLATES = [
  { headline: "Gold Surges as DXY Weakens on Fed Dovish Signals", sentiment: "bullish", relevance: "high", category: "central-bank" },
  { headline: "XAUUSD Hits Fresh Weekly High Amid Geopolitical Tensions", sentiment: "bullish", relevance: "high", category: "geopolitical" },
  { headline: "CPI Data Miss Fuels Gold Rally — Rate Cut Bets Rise", sentiment: "bullish", relevance: "high", category: "economic" },
  { headline: "Gold Consolidates Near Resistance as Traders Await FOMC", sentiment: "neutral", relevance: "medium", category: "economic" },
  { headline: "Safe-Haven Demand Lifts Gold as Equities Slide", sentiment: "bullish", relevance: "high", category: "market" },
  { headline: "Strong NFP Report Pressures Gold — Dollar Strengthens", sentiment: "bearish", relevance: "high", category: "economic" },
  { headline: "Gold Retreats from Highs as Treasury Yields Climb", sentiment: "bearish", relevance: "medium", category: "market" },
  { headline: "Central Bank Gold Purchases Hit Multi-Year High", sentiment: "bullish", relevance: "medium", category: "central-bank" },
  { headline: "XAUUSD Technicals Show Bull Flag Pattern on Daily Chart", sentiment: "bullish", relevance: "medium", category: "market" },
  { headline: "Gold Holds Above Key Support Despite Strong USD", sentiment: "neutral", relevance: "medium", category: "market" },
  { headline: "Geopolitical Risk Premium Pushes Gold Above $2,400", sentiment: "bullish", relevance: "high", category: "geopolitical" },
  { headline: "Gold-Backed ETF Inflows Signal Institutional Accumulation", sentiment: "bullish", relevance: "medium", category: "market" },
  { headline: "Fed Minutes Reveal Split — Gold Volatility Spikes", sentiment: "neutral", relevance: "high", category: "central-bank" },
  { headline: "Gold Miners Rally as Bullion Extends Gains", sentiment: "bullish", relevance: "low", category: "market" },
  { headline: "DXY Recovery Caps Gold Upside — Range-Bound Trading", sentiment: "bearish", relevance: "medium", category: "market" },
  { headline: "Inflation Expectations Tick Higher, Supporting Gold", sentiment: "bullish", relevance: "medium", category: "economic" },
  { headline: "Gold Slides as Fed Officials Push Back Against Rate Cuts", sentiment: "bearish", relevance: "high", category: "central-bank" },
  { headline: "Physical Gold Demand Surges in Asia Amid Festival Season", sentiment: "bullish", relevance: "medium", category: "supply-demand" },
  { headline: "Gold Volatility Drops as Market Prices in Gradual Fed Easing", sentiment: "neutral", relevance: "low", category: "market" },
  { headline: "XAUUSD Breaks Below 50-Day MA — Technical Selling Intensifies", sentiment: "bearish", relevance: "medium", category: "market" },
  { headline: "Gold-Silver Ratio Widens as Industrial Demand Concerns Rise", sentiment: "neutral", relevance: "low", category: "market" },
  { headline: "Options Market Shows Growing Bullish Skew for Gold", sentiment: "bullish", relevance: "low", category: "market" },
  { headline: "Rising Recession Fears Drive Capital into Gold", sentiment: "bullish", relevance: "high", category: "economic" },
  { headline: "Gold Supply Constraints Emerge as Mining Output Declines", sentiment: "bullish", relevance: "medium", category: "supply-demand" },
  { headline: "Gold Holds Steady as Markets Digest Mixed Economic Data", sentiment: "neutral", relevance: "medium", category: "economic" },
]

const SOURCES = ["Reuters", "Bloomberg", "Financial Times", "CNBC", "MarketWatch", "Kitco News", "FXStreet", "Investing.com", "DailyFX", "TradingView News", "Gold.org", "World Gold Council"]

function generateSummary(headline: string, category: string, sentiment: string): string {
  const summaries: Record<string, string[]> = {
    "economic": [
      `Economic data release impacting XAUUSD price action with ${sentiment} implications for gold.`,
      `Markets react to macroeconomic indicators affecting the gold outlook.`,
      `Key economic report shifts sentiment in the gold market.`,
    ],
    "geopolitical": [
      `Geopolitical developments drive safe-haven flows into gold.`,
      `Rising geopolitical uncertainty supports gold bid as investors seek refuge.`,
      `International tensions escalate, boosting demand for traditional safe havens.`,
    ],
    "central-bank": [
      `Central bank policy signals driving gold price direction.`,
      `Monetary policy expectations shift as central bank commentary influences gold.`,
      `Central bank activity in gold markets signals strategic reserve diversification.`,
    ],
    "market": [
      `Technical and flow-based factors driving short-term XAUUSD price action.`,
      `Market dynamics and positioning data shaping gold trading.`,
      `Trading volumes and price patterns indicate market participant sentiment.`,
    ],
    "supply-demand": [
      `Physical gold supply-demand balance shifts with implications for prices.`,
      `Mining output and jewelry demand data points affecting gold market fundamentals.`,
    ],
  }
  const options = summaries[category] ?? ["Market update affecting gold prices."]
  return options[Math.floor(Math.random() * options.length)]
}

function generateMockNews(count: number): XAUUSDNewsItem[] {
  const items: XAUUSDNewsItem[] = []
  const now = Date.now()

  const shuffled = [...HEADLINE_TEMPLATES].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)

  selected.forEach((template, i) => {
    const timestamp = now - i * (Math.floor(Math.random() * 120 + 10) * 60 * 1000)
    items.push({
      id: `news_${timestamp}`,
      headline: template.headline,
      summary: generateSummary(template.headline, template.category, template.sentiment),
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
      url: "#",
      timestamp,
      sentiment: template.sentiment as "bullish" | "bearish" | "neutral",
      relevance: template.relevance as "high" | "medium" | "low",
      category: template.category as XAUUSDNewsItem["category"],
    })
  })

  return items
}

let cachedNews: XAUUSDNewsItem[] = []
let lastFetch = 0
let mockIndex = 0

async function fetchFromServerAPI(): Promise<XAUUSDNewsItem[]> {
  try {
    const res = await fetch("/api/news")
    if (!res.ok) return []
    const data = await res.json()
    if (data.items?.length > 0) return data.items as XAUUSDNewsItem[]
  } catch {}
  return []
}

export function getNewsService() {
  async function refreshNews(): Promise<XAUUSDNewsItem[]> {
    const serverNews = await fetchFromServerAPI()
    if (serverNews.length > 0) {
      cachedNews = serverNews
      lastFetch = Date.now()
      return serverNews
    }

    const fresh = generateMockNews(15 + Math.floor(Math.random() * 10))
    const existing = new Set(cachedNews.map((n) => n.headline))
    const newItems = fresh.filter((n) => !existing.has(n.headline))
    const prevHeadlines = new Set(cachedNews.map((n) => n.headline))
    for (const item of newItems) {
      if (!prevHeadlines.has(item.headline)) {
        cachedNews.unshift(item)
      }
    }
    cachedNews = cachedNews.slice(0, 50)
    lastFetch = Date.now()
    return cachedNews
  }

  async function getLatestNews(minCount = 10): Promise<XAUUSDNewsItem[]> {
    if (cachedNews.length >= minCount && Date.now() - lastFetch < 120000) {
      return cachedNews
    }
    return refreshNews()
  }

  function getHeadlineRotator(): XAUUSDNewsItem {
    if (cachedNews.length === 0) {
      const mock = generateMockNews(1)
      cachedNews = mock
      return mock[0]
    }
    mockIndex = (mockIndex + 1) % cachedNews.length
    return cachedNews[mockIndex]
  }

  return { refreshNews, getLatestNews, getHeadlineRotator }
}

export type NewsService = ReturnType<typeof getNewsService>
