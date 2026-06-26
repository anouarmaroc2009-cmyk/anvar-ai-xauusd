import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        anvarr: {
          950: "#0a0c0f",
          900: "#0f1215",
          800: "#15191e",
          700: "#1e232a",
          600: "#2a3038",
          500: "#3b434c",
          gold: {
            light: "#f0c040",
            DEFAULT: "#d4a030",
            dark: "#b8860b",
            muted: "#8a7a4a",
          },
          slate: {
            light: "#94a3b8",
            DEFAULT: "#64748b",
            dark: "#334155",
          },
          accent: {
            green: "#22c55e",
            red: "#ef4444",
            blue: "#3b82f6",
            orange: "#f97316",
          },
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        "gold-glow":
          "radial-gradient(ellipse at center, rgba(212,160,48,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0,0,0,0.37)",
        gold: "0 0 20px rgba(212,160,48,0.3)",
      },
      backdropBlur: {
        glass: "12px",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "data-flow": "dataFlow 3s linear infinite",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "count-up": "countUp 1s ease-out",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        dataFlow: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        countUp: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}

export default config
