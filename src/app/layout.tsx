import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ANVARR | XAUUSD Trading Intelligence Platform",
  description: "Institutional-grade gold trading intelligence platform powered by AI-driven macro analysis, SMC/ICT market structure, and quantitative execution systems for XAUUSD.",
  keywords: ["XAUUSD", "gold trading", "trading intelligence", "AI trading", "SMC", "ICT", "forex", "trading platform"],
  openGraph: {
    title: "ANVARR | XAUUSD Trading Intelligence",
    description: "AI-powered gold trading intelligence platform with macro analysis, SMC/ICT structure, and quantitative execution.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
