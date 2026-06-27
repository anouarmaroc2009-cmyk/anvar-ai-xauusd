"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion"

const features = [
  {
    title: "AI Macro Engine",
    desc: "Real-time analysis of FOMC, CPI, NFP, and geopolitical events with sentiment scoring and impact assessment.",
    icon: "🧠",
  },
  {
    title: "SMC / ICT Analysis",
    desc: "Institutional order flow detection including order blocks, fair value gaps, liquidity sweeps, and breaker patterns.",
    icon: "📊",
  },
  {
    title: "Quant Execution",
    desc: "Multi-lot position sizing, dynamic risk management, and automated stop-loss/take-profit placement.",
    icon: "⚡",
  },
  {
    title: "Live Order Book",
    desc: "Depth-of-market visualization with bid/ask stacking, absorption detection, and iceberg order recognition.",
    icon: "📖",
  },
  {
    title: "Position Calculator",
    desc: "Full risk management suite: lot size, pip value, margin requirements, and reward-risk ratios in real time.",
    icon: "🧮",
  },
  {
    title: "Deep Focus Chart",
    desc: "Immersive trading view with multi-timeframe structure, candlestick patterns, and institutional footprints.",
    icon: "🎯",
  },
]

const stats = [
  { label: "Analysis Engine", value: "AI-Powered" },
  { label: "Latency", value: "< 50ms" },
  { label: "Instruments", value: "XAUUSD" },
  { label: "Timeframes", value: "1m → Weekly" },
]

const techStack = [
  { name: "Next.js 14", role: "Framework" },
  { name: "TypeScript", role: "Language" },
  { name: "Tailwind CSS", role: "Styling" },
  { name: "Framer Motion", role: "Animation" },
  { name: "GSAP", role: "Performance" },
  { name: "Zustand", role: "State" },
  { name: "Lightweight Charts", role: "Charting" },
  { name: "WebSocket", role: "Real-time" },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

const fadeLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const ctx = canvasEl.getContext("2d")
    if (!ctx) return
    const canvas = canvasEl

    let animId: number
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
    }
    resize()
    window.addEventListener("resize", resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      })
    }

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.offsetWidth
        if (p.x > canvas.offsetWidth) p.x = 0
        if (p.y < 0) p.y = canvas.offsetHeight
        if (p.y > canvas.offsetHeight) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 160, 48, ${p.alpha})`
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(212, 160, 48, ${0.08 * (1 - dist / 120)})`
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] origin-left bg-gradient-to-r from-anvarr-gold-dark via-anvarr-gold to-anvarr-gold-light"
    />
  )
}

function NavBar() {
  const [hidden, setHidden] = useState(false)
  const { scrollY } = useScroll()
  const navBg = useTransform(scrollY, [0, 80], ["rgba(10,12,15,0.5)", "rgba(10,12,15,0.95)"])

  useEffect(() => {
    return scrollY.on("change", (y) => {
      if (y > 300) setHidden(true)
      else setHidden(false)
    })
  }, [scrollY])

  return (
    <motion.nav
      style={{ backgroundColor: navBg }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-anvarr-800/40 backdrop-blur-xl transition-border duration-300"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="text-sm font-bold tracking-[0.2em] text-gradient-gold uppercase"
            whileHover={{ scale: 1.05 }}
          >
            ANVARR
          </motion.span>
          <div className="h-3 w-px bg-anvarr-700" />
          <span className="text-[9px] font-mono text-anvarr-slate tracking-wider hidden sm:inline">XAUUSD Trading Intelligence</span>
        </motion.div>
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <a href="#features" className="text-[10px] font-mono text-anvarr-slate tracking-wider hover:text-white transition-colors relative group">
            Features
            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-anvarr-gold/60 group-hover:w-full transition-all duration-300" />
          </a>
          <motion.a
            href="/dashboard"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-1.5 rounded-lg bg-anvarr-gold/20 border border-anvarr-gold/40 text-anvarr-gold-light font-mono text-[10px] font-semibold tracking-wider uppercase hover:bg-anvarr-gold/30 transition-all duration-300"
          >
            Dashboard
          </motion.a>
        </motion.div>
      </div>
    </motion.nav>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="text-center mb-16"
    >
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-gold">
        {children}
      </h2>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-anvarr-gold/60 to-transparent"
      />
    </motion.div>
  )
}

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [displayed, setDisplayed] = useState("")

  useEffect(() => {
    if (!isInView) return
    const num = parseInt(value.replace(/\D/g, ""))
    if (isNaN(num)) { setDisplayed(value); return }

    let start = 0
    const duration = 1200
    const step = Math.ceil(num / 30)
    const interval = setInterval(() => {
      start += step
      if (start >= num) {
        setDisplayed(value + suffix)
        clearInterval(interval)
      } else {
        setDisplayed(start + suffix)
      }
    }, duration / 30)

    return () => clearInterval(interval)
  }, [isInView, value, suffix])

  return <span ref={ref}>{displayed || "0"}</span>
}

function HeroSection() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const letters = "ANVARR".split("")

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-anvarr-950">
      <motion.div style={{ y: imgY }} className="absolute inset-0">
        <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-anvarr-950/80 via-anvarr-950/60 to-anvarr-950" />
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,160,48,0.12)_0%,_transparent_60%)]" />

      <ParticleField />

      <motion.div
        style={{ opacity }}
        className="absolute inset-0"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-anvarr-gold/10"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-dashed border-anvarr-gold/5"
        />
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full border border-anvarr-gold/20 bg-anvarr-gold/5 text-[10px] font-mono text-anvarr-gold-light/80 tracking-widest uppercase"
          >
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-anvarr-accent-green"
            />
            Live Trading Intelligence
          </motion.div>



          <motion.h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none mb-4">
            {letters.map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 60, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.08, ease: "easeOut" }}
                className="inline-block text-gradient-gold perspective-500"
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg md:text-xl text-anvarr-slate-light/80 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Institutional-grade gold trading intelligence platform powered by AI-driven macro analysis,
            SMC/ICT market structure, and quantitative execution systems.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.a
            href="/dashboard"
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(212,160,48,0.3)" }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3.5 rounded-lg bg-anvarr-gold/20 border border-anvarr-gold/40 text-anvarr-gold-light font-mono text-sm font-semibold tracking-wider uppercase transition-all duration-300 relative overflow-hidden group"
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-anvarr-gold/10 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
            Launch Dashboard
          </motion.a>
          <motion.a
            href="#features"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3.5 rounded-lg bg-anvarr-700/40 border border-anvarr-600/50 text-anvarr-slate-light font-mono text-sm font-semibold tracking-wider uppercase hover:bg-anvarr-700/60 hover:border-anvarr-500/70 hover:text-white transition-all duration-300"
          >
            Explore Features
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.8 + i * 0.1 }}
              whileHover={{ y: -4 }}
              className="text-center"
            >
              <div className="text-xs font-mono text-anvarr-500 tracking-wider uppercase">{stat.label}</div>
              <motion.div
                className="mt-1 text-sm font-mono font-semibold text-anvarr-gold-light/90"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 2 + i * 0.1 }}
              >
                <AnimatedCounter value={stat.value} />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-5 h-8 rounded-full border border-anvarr-600 flex items-start justify-center p-1.5">
            <motion.div
              animate={{ y: [0, 6, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-2 rounded-full bg-anvarr-gold/60"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <section id="features" className="relative py-24 px-4 bg-anvarr-900/50 overflow-hidden">
      <motion.div
        className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-anvarr-gold/3 blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <SectionTitle>Platform Capabilities</SectionTitle>
      <div ref={ref} className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: -120 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="group relative rounded-xl border border-anvarr-700/50 bg-anvarr-800/40 backdrop-blur-xl p-6 transition-all duration-500 overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-anvarr-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
            <motion.div
              className="absolute -top-10 -right-10 w-24 h-24 rounded-full border border-anvarr-gold/10"
              whileHover={{ scale: 1.5, opacity: 0.3 }}
              transition={{ duration: 0.6 }}
            />
            <div className="relative z-10">
              <motion.div
                className="text-2xl mb-3 inline-block"
                whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.4 }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-sm font-bold font-mono tracking-wider text-anvarr-gold-light/90 uppercase mb-2">
                {feature.title}
              </h3>
              <p className="text-xs leading-relaxed text-anvarr-slate-light/70">
                {feature.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { step: "01", title: "Data Ingestion", desc: "Real-time market data streams via WebSocket — live XAUUSD prices, order book depth, and economic calendar events." },
    { step: "02", title: "AI Analysis", desc: "Macro engine scores geopolitical & economic events. SMC engine maps institutional order flow, liquidity, and structure." },
    { step: "03", title: "Confluence Filter", desc: "Multi-timeframe conflation engine cross-validates signals across macro, microstructure, and price action for high-probability setups." },
    { step: "04", title: "Execution", desc: "Quant-driven position sizing with dynamic risk parameters. One-click execution with automated SL/TP placement." },
  ]

  return (
    <section className="relative py-24 px-4 bg-anvarr-950 overflow-hidden">
      <motion.div
        className="absolute top-0 right-0 w-1/2 h-full opacity-10"
        initial={{ x: "20%" }}
        whileInView={{ x: "0%" }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <img src="/gold-trading.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-anvarr-950/60 to-transparent" />
      </motion.div>

      <div className="relative z-10">
        <SectionTitle>How It Works</SectionTitle>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-anvarr-gold/40 via-anvarr-gold/20 to-transparent" />

        <div className="space-y-10">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
              className="relative flex gap-6 items-start group pl-14"
            >
              <motion.div
                className="absolute left-0 top-1.5 w-12 h-12 rounded-full border border-anvarr-gold/20 bg-anvarr-gold/5 flex items-center justify-center"
                whileHover={{ scale: 1.1, borderColor: "rgba(212,160,48,0.5)" }}
              >
                <motion.span
                  className="text-sm font-mono font-bold text-anvarr-gold-light"
                  whileInView={{ scale: [0, 1] }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 300, delay: i * 0.15 }}
                >
                  {s.step}
                </motion.span>
              </motion.div>

              <div className="flex-1 pt-2">
                <motion.h3
                  className="text-sm font-bold font-mono tracking-wider text-white uppercase mb-1"
                  whileInView={{ x: [-10, 0] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.15 }}
                >
                  {s.title}
                </motion.h3>
                <p className="text-xs leading-relaxed text-anvarr-slate-light/70">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TechSection() {
  return (
    <section className="relative py-24 px-4 bg-anvarr-900/30 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-60 h-60 bg-anvarr-gold/5 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <SectionTitle>Built With</SectionTitle>
      <div className="relative z-10 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {techStack.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.05 }}
            className="text-center rounded-lg border border-anvarr-700/40 bg-anvarr-800/30 backdrop-blur-sm px-4 py-5 hover:border-anvarr-gold/30 hover:shadow-gold transition-all duration-300"
          >
            <div className="text-xs font-bold font-mono text-white tracking-wide">{t.name}</div>
            <div className="text-[9px] font-mono text-anvarr-500 tracking-wider mt-1 uppercase">{t.role}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="relative py-28 px-4 bg-anvarr-950 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,160,48,0.06)_0%,_transparent_60%)]" />

      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-anvarr-gold/10"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-gold mb-4"
        >
          Ready for Live Markets?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-sm text-anvarr-slate-light/70 mb-8 max-w-lg mx-auto"
        >
          Deploy your own instance or explore the dashboard to see how ANVARR transforms raw market data into actionable trading intelligence.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.a
            href="https://github.com/anouarmaroc2009-cmyk/anvar-ai-xauusd"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(212,160,48,0.3)" }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3.5 rounded-lg bg-anvarr-gold/20 border border-anvarr-gold/40 text-anvarr-gold-light font-mono text-sm font-semibold tracking-wider uppercase hover:bg-anvarr-gold/30 hover:border-anvarr-gold/60 transition-all duration-300"
          >
            View on GitHub
          </motion.a>
          <motion.a
            href="/dashboard"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3.5 rounded-lg bg-anvarr-700/40 border border-anvarr-600/50 text-anvarr-slate-light font-mono text-sm font-semibold tracking-wider uppercase hover:bg-anvarr-700/60 hover:border-anvarr-500/70 hover:text-white transition-all duration-300"
          >
            Live Demo
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}

function FooterSection() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="border-t border-anvarr-800 bg-anvarr-950 py-8 px-4"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tracking-[0.2em] text-gradient-gold uppercase">ANVARR</span>
          <span className="text-[9px] font-mono text-anvarr-500">XAUUSD Trading Intelligence</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-anvarr-500">
          <span>XAUUSD Intelligence</span>
        </div>
      </div>
    </motion.footer>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-anvarr-950 text-white selection:bg-anvarr-gold/30 selection:text-white">
      <ScrollProgress />
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TechSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
