import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/hooks/use-language"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maoge PDF",
  description: "AI-powered PDF analysis and chat. Upload, organize, and chat with your PDFs easily.",
  generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className={`${inter.className} bg-gray-50 min-h-screen text-gray-900`}> 
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
