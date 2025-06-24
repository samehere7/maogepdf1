import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {defaultLocale} from '@/i18n';

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maoge PDF - AI PDF Chat & Analysis",
  description: "Upload PDF documents and get intelligent analysis and Q&A",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // 为根路径提供默认语言的 messages
  const messages = await getMessages({locale: defaultLocale});
  
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
