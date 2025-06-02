import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/hooks/use-language"
import StagewiseToolbarWrapper from "@/components/stagewise-toolbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maoge PDF",
  description: "Analyze and maoge with your PDF documents using advanced AI technology",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>{children}</LanguageProvider>
        {process.env.NODE_ENV === 'development' && <StagewiseToolbarWrapper />}
      </body>
    </html>
  )
}
