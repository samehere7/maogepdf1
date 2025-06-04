import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/hooks/use-language"
import Script from "next/script"

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
        <Script id="clarity-script" strategy="afterInteractive">{
          `
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "ru3ef5mdsl");
          `
        }</Script>
        <Script defer data-domain="maogepdf.com" src="https://plausible.io/js/script.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
