import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ANVARR | XAUUSD Trading Intelligence",
  description: "Institutional-grade gold trading platform with AI-driven macro, SMC/ICT analysis, and quantitative execution",
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
