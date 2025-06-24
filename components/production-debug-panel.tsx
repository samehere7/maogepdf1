"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProductionDebugPanel() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDebugInfo = async () => {
    setLoading(true)
    try {
      const [routeInfo, middlewareTest, redirectTest, middlewareTrace] = await Promise.all([
        fetch('/api/debug/route-info').then(r => r.json()),
        fetch('/api/debug/middleware-test').then(r => r.json()),
        fetch('/api/debug/redirect-test?url=/').then(r => r.json()),
        fetch('/api/debug/middleware-trace?path=/').then(r => r.json())
      ])
      
      setDebugData({
        routeInfo,
        middlewareTest,
        redirectTest,
        middlewareTrace,
        clientInfo: {
          pathname,
          location: typeof window !== 'undefined' ? {
            href: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            host: window.location.host,
            protocol: window.location.protocol,
          } : null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          language: typeof navigator !== 'undefined' ? navigator.language : null,
          languages: typeof navigator !== 'undefined' ? navigator.languages : null,
        }
      })
    } catch (error) {
      console.error('Failed to fetch debug info:', error)
      setDebugData({ error: error.message })
    }
    setLoading(false)
  }

  const copyToClipboard = () => {
    if (debugData) {
      navigator.clipboard.writeText(JSON.stringify(debugData, null, 2))
      alert('调试信息已复制到剪贴板')
    }
  }

  const generateDebugUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/api/debug/route-info`
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          🔧 生产调试
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-96 overflow-hidden">
      <Card className="bg-white shadow-lg border-2 border-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex justify-between items-center">
            🔧 生产环境诊断
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
          {/* 快速状态 */}
          <div className="text-xs bg-gray-100 p-2 rounded">
            <div><strong>当前路径:</strong> {pathname}</div>
            <div><strong>完整URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
            <div><strong>环境:</strong> {process.env.NODE_ENV}</div>
          </div>

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={fetchDebugInfo}
              disabled={loading}
              size="sm"
              className="text-xs"
            >
              {loading ? '获取中...' : '获取诊断'}
            </Button>
            <Button
              onClick={copyToClipboard}
              disabled={!debugData}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              复制信息
            </Button>
          </div>

          {/* 调试URL */}
          <div className="text-xs">
            <strong>高级调试:</strong>
            <div className="grid grid-cols-1 gap-1 mt-1">
              <div className="bg-gray-100 p-1 rounded break-all text-xs">
                重定向测试: /api/debug/redirect-test?url=/
              </div>
              <div className="bg-gray-100 p-1 rounded break-all text-xs">
                中间件追踪: /api/debug/middleware-trace?path=/
              </div>
            </div>
          </div>

          {/* 调试数据显示 */}
          {debugData && (
            <div className="bg-black text-green-400 p-2 rounded text-xs h-32 overflow-y-auto font-mono">
              <pre>{JSON.stringify(debugData, null, 2)}</pre>
            </div>
          )}

          {/* 快速测试 */}
          <div className="text-xs">
            <strong>快速测试:</strong>
            <div className="grid grid-cols-1 gap-1 mt-1">
              <Button
                onClick={() => window.open('/', '_blank')}
                variant="outline"
                size="sm"
                className="text-xs h-6"
              >
                测试根路径 /
              </Button>
              <Button
                onClick={() => window.open('/zh', '_blank')}
                variant="outline"
                size="sm"
                className="text-xs h-6"
              >
                测试中文路径 /zh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}