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
  
  // 工具函数：规范化路径
  const normalizePath = (path: string): string => {
    // 移除多余的斜杠并确保路径格式正确
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  }

  // ENHANCED: 增强的 locale 检测逻辑
  const actualLocale = (() => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    const isValidLocale = languages.some(lang => lang.code === firstSegment)
    
    // Debug logs (will be removed in production by Next.js)
    console.log('🔍 Language Selector - Current pathname:', pathname)
    console.log('🔍 Language Selector - Path segments:', pathSegments)
    console.log('🔍 Language Selector - First segment:', firstSegment)
    console.log('🔍 Language Selector - Is valid locale:', isValidLocale)
    console.log('🔍 Language Selector - useLocale() returns:', locale)
    
    // 优先级1：URL路径中的有效locale
    if (isValidLocale) {
      console.log('🔍 Language Selector - Detected locale from path:', firstSegment)
      return firstSegment
    }
    
    // 优先级2：next-intl的useLocale hook
    if (locale && languages.some(lang => lang.code === locale)) {
      console.log('🔍 Language Selector - Using locale from useLocale hook:', locale)
      return locale
    }
    
    // 优先级3：浏览器语言检测
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase()
      const matchedBrowserLang = languages.find(lang => 
        browserLang.startsWith(lang.code.toLowerCase()) || 
        lang.code.toLowerCase().startsWith(browserLang)
      )
      if (matchedBrowserLang) {
        console.log('🔍 Language Selector - Detected from browser:', matchedBrowserLang.code)
        return matchedBrowserLang.code
      }
    }
    
    // 优先级4：默认回退到英文
    const detectedLocale = 'en'
    console.log('🔍 Language Selector - Final fallback locale:', detectedLocale)
    return detectedLocale
  })()

  const currentLanguage = languages.find((lang) => lang.code === actualLocale) || languages[0]

  const handleLanguageChange = (newLocale: string) => {
    // Always close the dropdown first for immediate UI feedback
    setOpen(false)
    
    // 持久化日志
    const logData = {
      from: actualLocale,
      to: newLocale,
      currentPath: pathname,
      useLocaleValue: locale,
      timestamp: new Date().toISOString()
    }
    
    console.log('🚀 Language change initiated:', logData)
    
    // Debug logging (removed in production)
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const existingLogs = JSON.parse(localStorage.getItem('language-debug-logs') || '[]')
      const newLog = `[${new Date().toLocaleTimeString()}] 🚀 语言选择器: ${actualLocale} → ${newLocale}`
      const updatedLogs = [...existingLogs, newLog].slice(-50)
      localStorage.setItem('language-debug-logs', JSON.stringify(updatedLogs))
    }
    
    if (newLocale === actualLocale) {
      // Even if the locale is the same, force navigation to ensure correct URL structure
      console.log('🔄 Same locale selected, ensuring correct URL structure')
      // Don't return early - continue with path construction to ensure correct URL
    }
    
    // FIXED: 改进的路径处理逻辑
    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0]
    const isValidLocale = languages.some(lang => lang.code === firstSegment)
    
    console.log('🔍 Path analysis:', {
      segments,
      firstSegment,
      isValidLocale
    })
    
    // 提取不含 locale 的路径部分
    let pathWithoutLocale = ''
    if (isValidLocale) {
      // 当前路径包含 locale，移除它
      pathWithoutLocale = segments.slice(1).join('/')
    } else {
      // 当前路径不包含 locale（说明是英文默认路径），保留所有段
      pathWithoutLocale = segments.join('/')
    }
    
    console.log('🔍 Path without locale:', pathWithoutLocale)
    
    // FIXED: 构建新路径的逻辑 (localePrefix: 'always')
    let newPath
    // 所有语言都使用显式的 locale 前缀
    if (pathWithoutLocale) {
      newPath = `/${newLocale}/${pathWithoutLocale}`
    } else {
      newPath = `/${newLocale}`
    }
    
    // 规范化路径，移除多余的斜杠
    newPath = normalizePath(newPath)
    
    console.log('🚀 Navigating to new path:', newPath)
    if (typeof window !== 'undefined') {
      console.log('🔍 Navigation details:', {
        currentURL: window.location.href,
        targetPath: newPath,
        willChange: window.location.pathname !== newPath,
        method: 'window.location.href'
      })
    }
    
    // 执行语言切换导航
    setTimeout(() => {
      console.log('🎯 Executing navigation to:', newPath)
      
      // Debug navigation logging (removed in production)
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem('language-debug-logs') || '[]')
        const newLog = `[${new Date().toLocaleTimeString()}] 🎯 执行导航: ${newPath}`
        const updatedLogs = [...existingLogs, newLog].slice(-50)
        localStorage.setItem('language-debug-logs', JSON.stringify(updatedLogs))
      }
      
      // 使用 window.location.href 确保完整的页面刷新和语言切换
      if (typeof window !== 'undefined') {
        window.location.href = newPath
      }
    }, 50) // 减少延迟以提升用户体验
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
