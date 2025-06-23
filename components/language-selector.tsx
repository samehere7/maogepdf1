"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Globe } from "lucide-react"
import { useLocale } from 'next-intl'

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt-BR", name: "Português (Brasil)", flag: "🇧🇷" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
  { code: "da", name: "Dansk", flag: "🇩🇰" },
  { code: "no", name: "Norsk bokmål", flag: "🇳🇴" },
  { code: "fi", name: "Suomi", flag: "🇫🇮" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", name: "বাংলা", flag: "🇧🇩" },
  { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "th", name: "ไทย", flag: "🇹🇭" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Bahasa Melayu", flag: "🇲🇾" }
]

export function LanguageSelector() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  
  // URGENT FIX: Extract actual locale from pathname when useLocale() is wrong
  const actualLocale = (() => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    const isValidLocale = languages.some(lang => lang.code === firstSegment)
    
    if (isValidLocale) {
      return firstSegment
    } else {
      // For localePrefix: 'as-needed', root path means default locale (en)
      return pathSegments.length === 0 || pathname === '/' ? 'en' : locale
    }
  })()

  const currentLanguage = languages.find((lang) => lang.code === actualLocale) || languages[0]

  const handleLanguageChange = (newLocale: string) => {
    // Always close the dropdown first for immediate UI feedback
    setOpen(false)
    
    if (newLocale === actualLocale) {
      // Even if the locale is the same, force a refresh to ensure the page is in the correct language
      // This handles cases where the URL shows the correct locale but content might not have loaded properly
      setTimeout(() => {
        window.location.reload()
      }, 100)
      return
    }
    
    // Extract the path without the current locale
    const segments = pathname.split('/').filter(Boolean)
    
    // Check if first segment is a valid locale
    const firstSegment = segments[0]
    const isValidLocale = languages.some(lang => lang.code === firstSegment)
    
    let pathWithoutLocale = ''
    if (isValidLocale) {
      // Remove the current locale from the path
      pathWithoutLocale = segments.slice(1).join('/')
    } else {
      // No locale in path, keep all segments
      pathWithoutLocale = segments.join('/')
    }
    
    // Navigate to the new locale
    // Handle localePrefix: 'as-needed' - default locale (en) uses root path
    let newPath
    if (newLocale === 'en') {
      // For English, use root path due to localePrefix: 'as-needed'
      newPath = `/${pathWithoutLocale || ''}`
    } else {
      // For other languages, use explicit locale prefix
      newPath = `/${newLocale}${pathWithoutLocale ? `/${pathWithoutLocale}` : ''}`
    }
    
    // Force immediate navigation with page reload to ensure locale change
    setTimeout(() => {
      window.location.href = newPath
    }, 100)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 min-w-[100px] bg-white text-gray-900 border border-gray-300 shadow-sm hover:bg-gray-100">
          <Globe className="h-4 w-4" />
          <span className="text-sm">
            {currentLanguage.flag} {currentLanguage.name}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] max-h-[300px] overflow-y-auto">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center gap-2 cursor-pointer hover:bg-slate-50 ${actualLocale === lang.code ? "bg-slate-100 font-medium" : ""}`}
          >
            <span>{lang.flag}</span>
            <span className="text-sm">{lang.name}</span>
            {actualLocale === lang.code && (
              <span className="ml-auto text-xs text-slate-500">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
