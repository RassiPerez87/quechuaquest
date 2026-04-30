import type { Metadata } from "next"
import { Suspense } from "react"
// @ts-ignore
import "./globals.css"

export const metadata: Metadata = {
  title: "QuechuaQuest - Aprende Quechua",
  description: "Aprende el quechua cochabambino de forma interactiva",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"
          async
        />
      </head>
      <body suppressHydrationWarning>
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FEFAF5' }} />}>
          {children}
        </Suspense>
      </body>
    </html>
  )
}