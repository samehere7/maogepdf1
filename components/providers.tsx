"use client"
import { LanguageProvider } from "../components/language-provider";
import { UserProvider } from "../components/UserProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <UserProvider>{children}</UserProvider>
    </LanguageProvider>
  );
} 