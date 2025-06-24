"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const languages = [
  { code: "en", name: "English" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
]

export function DebugLanguageTool() {
  const router = useRouter()
  const pathname = usePathname()
  const [logs, setLogs] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)
  
  // 持久化日志到 localStorage
  const addPersistentLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    
    if (typeof window !== 'undefined') {
      const existingLogs = JSON.parse(localStorage.getItem('language-debug-logs') || '[]')
      const newLogs = [...existingLogs, logEntry].slice(-50) // 保留最新50条
      localStorage.setItem('language-debug-logs', JSON.stringify(newLogs))
      setLogs(newLogs)
    }
  }
  
  // 从 localStorage 恢复日志
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLogs = JSON.parse(localStorage.getItem('language-debug-logs') || '[]')
      setLogs(savedLogs)
    }
  }, [])
  
  // 监听页面加载事件
  useEffect(() => {
    addPersistentLog(`=== 页面加载 ===`)
    addPersistentLog(`路径: ${pathname}`)
    addPersistentLog(`推断语言: ${locale}`)
    addPersistentLog(`URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`)
  }, [pathname])

  // 从路径中直接推断 locale，不依赖 next-intl
  const getLocaleFromPath = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    const isValidLocale = languages.some(lang => lang.code === firstSegment)
    
    if (isValidLocale) {
      return firstSegment
    } else {
      return (pathSegments.length === 0 || pathname === '/') ? 'en' : 'en'
    }
  }

  const locale = getLocaleFromPath()


  const testLanguageSwitch = (targetLang: string) => {
    addPersistentLog(`🧪 测试切换到: ${targetLang}`)
    
    // 分析当前状态
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    const isValidLocale = languages.some(lang => lang.code === firstSegment)
    
    addPersistentLog(`📍 当前路径分析:`)
    addPersistentLog(`  - pathname: ${pathname}`)
    addPersistentLog(`  - segments: [${pathSegments.join(', ')}]`)
    addPersistentLog(`  - firstSegment: ${firstSegment}`)
    addPersistentLog(`  - isValidLocale: ${isValidLocale}`)
    addPersistentLog(`  - 推断locale: ${locale}`)
    
    // 构建新路径
    let pathWithoutLocale = ''
    if (isValidLocale) {
      pathWithoutLocale = pathSegments.slice(1).join('/')
    } else {
      pathWithoutLocale = pathSegments.join('/')
    }
    
    let newPath
    if (targetLang === 'en') {
      newPath = pathWithoutLocale ? `/${pathWithoutLocale}` : '/'
    } else {
      newPath = pathWithoutLocale ? `/${targetLang}/${pathWithoutLocale}` : `/${targetLang}`
    }
    
    // 规范化路径
    newPath = newPath.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
    
    addPersistentLog(`🚀 构建的新路径: ${newPath}`)
    addPersistentLog(`🔄 即将跳转...`)
    
    // 执行跳转
    setTimeout(() => {
      addPersistentLog(`🎯 执行window.location.href = "${newPath}"`)
      window.location.href = newPath
    }, 100)
  }

  const clearLogs = () => {
    setLogs([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('language-debug-logs')
    }
  }

  const getDetectedLocale = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    const isValidLocale = languages.some(lang => lang.code === firstSegment)
    
    if (isValidLocale) {
      return firstSegment
    } else {
      return (pathSegments.length === 0 || pathname === '/') ? 'en' : 'en'
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-red-500 text-white hover:bg-red-600"
        >
          🔧 语言调试
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden">
      <Card className="bg-white shadow-lg border-2 border-red-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex justify-between items-center">
            🔧 语言切换调试工具
            <Button 
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 当前状态显示 */}
          <div className="text-xs bg-gray-100 p-2 rounded">
            <div><strong>路径:</strong> {pathname}</div>
            <div><strong>从路径推断:</strong> {locale}</div>
            <div><strong>检测到的语言:</strong> {getDetectedLocale()}</div>
            <div><strong>URL参数:</strong> {typeof window !== 'undefined' ? window.location.search : 'N/A'}</div>
            <div><strong>状态一致性:</strong> {
              locale === getDetectedLocale() ? 
              <span className="text-green-600">✓ 一致</span> : 
              <span className="text-red-600">✗ 不一致</span>
            }</div>
          </div>

          {/* 测试按钮 */}
          <div className="grid grid-cols-2 gap-1">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                onClick={() => testLanguageSwitch(lang.code)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                → {lang.name}
              </Button>
            ))}
          </div>

          {/* 日志显示 */}
          <div className="bg-black text-green-400 p-2 rounded text-xs h-40 overflow-y-auto font-mono">
            {logs.length === 0 ? (
              <div className="text-gray-500">等待操作日志...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>

          {/* 控制按钮 */}
          <div className="flex gap-2">
            <Button onClick={clearLogs} variant="outline" size="sm" className="text-xs">
              清除日志
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm" 
              className="text-xs"
            >
              刷新页面
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}