"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/components/UserProvider"
import { LanguageProvider } from "@/components/language-provider"
import AuthTokenHandler from "@/components/AuthTokenHandler"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LanguageProvider>
        <UserProvider>
          <AuthTokenHandler />
          {children}
        </UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
} 