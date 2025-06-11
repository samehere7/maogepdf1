"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/components/UserProvider"
import { LanguageProvider } from "@/components/language-provider"
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <LanguageProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </LanguageProvider>
      </SessionProvider>
    </ThemeProvider>
  )
} 