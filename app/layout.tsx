import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maoge PDF - Smart PDF Parsing & AI Chat | Online PDF Management Tool",
  description: "Maoge PDF offers intelligent PDF parsing, AI chat, and file management features to help you efficiently process and manage your PDF documents. Multi-language support, clean interface, and secure service.",
  keywords: ["PDF", "AI chat", "PDF parsing", "file management", "online tool", "productivity", "Maoge PDF"]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          <main className="min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
