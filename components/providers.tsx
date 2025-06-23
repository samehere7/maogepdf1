"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/components/UserProvider"
import AuthTokenHandler from "@/components/AuthTokenHandler"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <UserProvider>
        <AuthTokenHandler />
        {children}
      </UserProvider>
    </ThemeProvider>
  )
} 