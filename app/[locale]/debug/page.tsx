"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface DebugInfo {
  timestamp: string
  userAgent: string
  url: string
  errors: any[]
  consoleErrors: string[]
  environment: any
  pdfjsStatus: any
  memoryInfo: any
  performanceInfo: any
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isCollecting, setIsCollecting] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const router = useRouter()

  const collectAllDebugInfo = async () => {
    if (typeof window === 'undefined') return

    setIsCollecting(true)
    console.log('🔧 [调试页面] 开始收集调试信息...')

    const info: DebugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: [],
      consoleErrors: [],
      environment: {},
      pdfjsStatus: {},
      memoryInfo: {},
      performanceInfo: {}
    }

    // 收集环境信息
    try {
      info.environment = {
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        },
        localStorage: {
          available: !!window.localStorage,
          length: window.localStorage?.length || 0
        },
        sessionStorage: {
          available: !!window.sessionStorage,
          length: window.sessionStorage?.length || 0
        }
      }
    } catch (e) {
      info.environment = { error: e.message }
    }

    // 收集错误信息
    try {
      info.errors = (window as any).__debugErrors || []
    } catch (e) {
      info.errors = [{ error: 'Failed to collect errors: ' + e.message }]
    }

    // 收集PDF.js状态
    try {
      if ((window as any).getPDFJSStatus) {
        info.pdfjsStatus = (window as any).getPDFJSStatus()
      } else {
        info.pdfjsStatus = { error: 'getPDFJSStatus function not available' }
      }
    } catch (e) {
      info.pdfjsStatus = { error: 'Failed to get PDF.js status: ' + e.message }
    }

    // 收集内存信息
    try {
      if ((performance as any).memory) {
        info.memoryInfo = {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        }
      }
    } catch (e) {
      info.memoryInfo = { error: 'Memory info not available' }
    }

    // 收集性能信息
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        info.performanceInfo = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
          firstPaint: 0 // 需要特殊API
        }
      }
    } catch (e) {
      info.performanceInfo = { error: 'Performance info not available' }
    }

    // 测试PDF.js加载
    try {
      console.log('🧪 [调试页面] 测试PDF.js加载...')
      const { getPDFJS } = await import('@/lib/pdf-manager')
      const pdfjs = await getPDFJS()
      info.pdfjsStatus = {
        ...info.pdfjsStatus,
        testResult: 'success',
        version: pdfjs.version,
        workerSrc: pdfjs.GlobalWorkerOptions?.workerSrc
      }
      console.log('✅ [调试页面] PDF.js测试成功')
    } catch (pdfError) {
      console.error('❌ [调试页面] PDF.js测试失败:', pdfError)
      info.pdfjsStatus = {
        ...info.pdfjsStatus,
        testResult: 'failed',
        testError: pdfError.message,
        testStack: pdfError.stack
      }
      
      // 尝试简化版本
      try {
        console.log('🧪 [调试页面] 测试简化版PDF.js...')
        const { getSimplePDFJS } = await import('@/lib/pdf-manager-simple')
        const simplePdfjs = await getSimplePDFJS()
        info.pdfjsStatus.simpleTest = {
          result: 'success',
          version: simplePdfjs.version
        }
        console.log('✅ [调试页面] 简化版PDF.js测试成功')
      } catch (simpleError) {
        console.error('❌ [调试页面] 简化版PDF.js也失败:', simpleError)
        info.pdfjsStatus.simpleTest = {
          result: 'failed',
          error: simpleError.message
        }
      }
    }

    setDebugInfo(info)
    setIsCollecting(false)
    console.log('🔧 [调试页面] 调试信息收集完成:', info)
  }

  const copyDebugInfo = () => {
    if (!debugInfo) return
    
    const debugText = JSON.stringify(debugInfo, null, 2)
    navigator.clipboard?.writeText(debugText).then(() => {
      alert('✅ 调试信息已复制到剪贴板！')
    }).catch(() => {
      // 备用复制方法
      const textarea = document.createElement('textarea')
      textarea.value = debugText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('✅ 调试信息已复制到剪贴板！')
    })
  }

  const downloadDebugInfo = () => {
    if (!debugInfo) return
    
    const debugText = JSON.stringify(debugInfo, null, 2)
    const blob = new Blob([debugText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-info-${new Date().toISOString().slice(0, 19)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(collectAllDebugInfo, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // 页面加载时自动收集
  useEffect(() => {
    collectAllDebugInfo()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              🔧 调试信息收集页面
            </h1>
            <button
              onClick={() => router.back()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              返回
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={collectAllDebugInfo}
              disabled={isCollecting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md flex items-center"
            >
              {isCollecting ? '🔄 收集中...' : '🔄 重新收集'}
            </button>
            
            <button
              onClick={copyDebugInfo}
              disabled={!debugInfo}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
            >
              📋 复制信息
            </button>
            
            <button
              onClick={downloadDebugInfo}
              disabled={!debugInfo}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
            >
              💾 下载JSON
            </button>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">自动刷新 (5秒)</span>
            </label>
          </div>
          
          {debugInfo && (
            <div className="mt-4 text-sm text-gray-600">
              <p>数据收集时间: {debugInfo.timestamp}</p>
              <p>错误数量: {debugInfo.errors.length}</p>
              <p>PDF.js状态: {debugInfo.pdfjsStatus.testResult || 'unknown'}</p>
            </div>
          )}
        </div>

        {/* 调试信息显示 */}
        {debugInfo && (
          <div className="space-y-6">
            {/* 错误信息 */}
            {debugInfo.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-red-800 mb-4">🚨 错误信息 ({debugInfo.errors.length})</h2>
                <div className="space-y-3 max-h-60 overflow-auto">
                  {debugInfo.errors.map((error, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <p className="font-medium text-red-700">{error.message}</p>
                      <p className="text-sm text-gray-600">{error.timestamp}</p>
                      {error.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-blue-600">查看堆栈</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">{error.stack}</pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PDF.js状态 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-4">📄 PDF.js 状态</h2>
              <div className="bg-white p-4 rounded">
                <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo.pdfjsStatus, null, 2)}</pre>
              </div>
            </div>

            {/* 环境信息 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-800 mb-4">🌐 环境信息</h2>
              <div className="bg-white p-4 rounded">
                <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo.environment, null, 2)}</pre>
              </div>
            </div>

            {/* 性能信息 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-4">⚡ 性能信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded">
                  <h3 className="font-medium mb-2">内存使用</h3>
                  <pre className="text-sm">{JSON.stringify(debugInfo.memoryInfo, null, 2)}</pre>
                </div>
                <div className="bg-white p-4 rounded">
                  <h3 className="font-medium mb-2">加载性能</h3>
                  <pre className="text-sm">{JSON.stringify(debugInfo.performanceInfo, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* 完整JSON */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 完整调试信息 (JSON)</h2>
              <div className="bg-black text-green-400 p-4 rounded text-xs overflow-auto max-h-96">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}

        {!debugInfo && !isCollecting && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500">点击"重新收集"开始收集调试信息</p>
          </div>
        )}

        {isCollecting && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在收集调试信息...</p>
          </div>
        )}
      </div>
    </div>
  )
}