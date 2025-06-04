"use client"
import { LanguageProvider } from "../components/language-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
} 