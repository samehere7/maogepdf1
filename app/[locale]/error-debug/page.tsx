'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"

interface ErrorInfo {
  timestamp: string
  type: string
  message: string
  stack?: string
  component?: string
  props?: any
  url?: string
  userAgent?: string
  source?: string
  line?: number
  column?: number
}

interface SystemDiagnostic {
  timestamp: string
  errors: ErrorInfo[]
  console: any[]
  network: any[]
  performance: any
  reactErrors: any[]
  nextjsInfo: any
  moduleInfo: any
  pdfjsInfo: any
  componentTree: any[]
}

export default function ErrorDebugPage() {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostic | null>(null)
  const [isCollecting, setIsCollecting] = useState(false)
  const [realTimeErrors, setRealTimeErrors] = useState<ErrorInfo[]>([])
  const originalConsoleError = useRef<any>(null)
  const originalConsoleWarn = useRef<any>(null)
  const originalConsoleLog = useRef<any>(null)
  const [activeTestComponent, setActiveTestComponent] = useState<string>('none')

  // 错误收集器
  useEffect(() => {
    const errors: ErrorInfo[] = []
    const consoleMessages: any[] = []
    const networkRequests: any[] = []

    // 捕获全局JavaScript错误
    const handleError = (event: ErrorEvent) => {
      const errorInfo: ErrorInfo = {
        timestamp: new Date().toISOString(),
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      errors.push(errorInfo)
      setRealTimeErrors(prev => [...prev, errorInfo])
      console.log('🚨 捕获JavaScript错误:', errorInfo)
    }

    // 捕获Promise拒绝
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo: ErrorInfo = {
        timestamp: new Date().toISOString(),
        type: 'promise',
        message: String(event.reason),
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      errors.push(errorInfo)
      setRealTimeErrors(prev => [...prev, errorInfo])
      console.log('🚨 捕获Promise错误:', errorInfo)
    }

    // 拦截控制台输出
    originalConsoleError.current = console.error
    originalConsoleWarn.current = console.warn
    originalConsoleLog.current = console.log

    console.error = (...args) => {
      const message = {
        timestamp: new Date().toISOString(),
        type: 'console.error',
        args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))
      }
      consoleMessages.push(message)
      originalConsoleError.current(...args)
    }

    console.warn = (...args) => {
      const message = {
        timestamp: new Date().toISOString(),
        type: 'console.warn',
        args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))
      }
      consoleMessages.push(message)
      originalConsoleWarn.current(...args)
    }

    console.log = (...args) => {
      const message = {
        timestamp: new Date().toISOString(),
        type: 'console.log',
        args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))
      }
      consoleMessages.push(message)
      originalConsoleLog.current(...args)
    }

    // 监听网络请求
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = Date.now()
      const url = typeof args[0] === 'string' ? args[0] : args[0].url
      
      try {
        const response = await originalFetch(...args)
        networkRequests.push({
          timestamp: new Date().toISOString(),
          url,
          method: args[1]?.method || 'GET',
          status: response.status,
          ok: response.ok,
          duration: Date.now() - startTime,
          type: 'fetch'
        })
        return response
      } catch (error) {
        networkRequests.push({
          timestamp: new Date().toISOString(),
          url,
          method: args[1]?.method || 'GET',
          error: String(error),
          duration: Date.now() - startTime,
          type: 'fetch'
        })
        throw error
      }
    }

    // 添加事件监听器
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // 清理函数
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      
      // 恢复原始函数
      if (originalConsoleError.current) console.error = originalConsoleError.current
      if (originalConsoleWarn.current) console.warn = originalConsoleWarn.current
      if (originalConsoleLog.current) console.log = originalConsoleLog.current
      window.fetch = originalFetch

      // 保存收集的数据
      const diagnostic: SystemDiagnostic = {
        timestamp: new Date().toISOString(),
        errors,
        console: consoleMessages,
        network: networkRequests,
        performance: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null,
        reactErrors: [],
        nextjsInfo: {
          version: process.env.NEXT_PUBLIC_VERCEL_ENV || 'unknown',
          mode: process.env.NODE_ENV,
          buildId: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown'
        },
        moduleInfo: {},
        pdfjsInfo: {},
        componentTree: []
      }
      setDiagnostics(diagnostic)
    }
  }, [])

  // 收集系统诊断信息
  const collectFullDiagnostics = async () => {
    setIsCollecting(true)
    
    try {
      const diagnostic: SystemDiagnostic = {
        timestamp: new Date().toISOString(),
        errors: realTimeErrors,
        console: [],
        network: [],
        performance: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
          loadTiming: performance.timing
        } : null,
        reactErrors: [],
        nextjsInfo: {
          version: process.env.NEXT_PUBLIC_VERCEL_ENV || 'unknown',
          mode: process.env.NODE_ENV,
          buildId: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',
          url: window.location.href,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        },
        moduleInfo: await collectModuleInfo(),
        pdfjsInfo: await collectPDFJSInfo(),
        componentTree: []
      }

      setDiagnostics(diagnostic)
    } catch (error) {
      console.error('收集诊断信息失败:', error)
    } finally {
      setIsCollecting(false)
    }
  }

  // 收集模块信息
  const collectModuleInfo = async () => {
    const moduleInfo: any = {}
    
    try {
      // 检查关键模块是否可用
      const modules = [
        'react',
        'next',
        'pdfjs-dist',
        '@/components/ui/button',
        '@/components/PdfViewer',
        '@/components/interactive-pdf-viewer'
      ]

      for (const moduleName of modules) {
        try {
          if (moduleName.startsWith('@/')) {
            // 这些是本地模块，无法动态导入检查
            moduleInfo[moduleName] = { status: 'local_module', available: 'unknown' }
          } else {
            const module = await import(moduleName)
            moduleInfo[moduleName] = {
              status: 'available',
              version: module.version || 'unknown',
              exports: Object.keys(module).slice(0, 10) // 只取前10个导出
            }
          }
        } catch (error) {
          moduleInfo[moduleName] = {
            status: 'error',
            error: String(error)
          }
        }
      }
    } catch (error) {
      moduleInfo.error = String(error)
    }

    return moduleInfo
  }

  // 收集PDF.js信息
  const collectPDFJSInfo = async () => {
    try {
      const pdfjs = await import('pdfjs-dist')
      return {
        available: true,
        version: pdfjs.version,
        workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
        workerOptions: pdfjs.GlobalWorkerOptions,
        buildId: pdfjs.build || 'unknown'
      }
    } catch (error) {
      return {
        available: false,
        error: String(error)
      }
    }
  }

  // 测试特定组件
  const testComponent = async (componentName: string) => {
    console.log(`🧪 测试组件: ${componentName}`)
    
    try {
      switch (componentName) {
        case 'pdf-viewer':
          setActiveTestComponent('pdf-viewer')
          // 这里可以动态加载PDF查看器组件进行测试
          break
        case 'interactive-pdf':
          setActiveTestComponent('interactive-pdf')
          break
        case 'simple-pdf':
          setActiveTestComponent('simple-pdf')
          break
        default:
          setActiveTestComponent('none')
      }
    } catch (error) {
      console.error(`组件 ${componentName} 测试失败:`, error)
    }
  }

  // 复制诊断信息
  const copyDiagnostics = async () => {
    if (!diagnostics) return
    
    try {
      const text = JSON.stringify(diagnostics, null, 2)
      await navigator.clipboard.writeText(text)
      alert('诊断信息已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  // 清除错误日志
  const clearErrors = () => {
    setRealTimeErrors([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">🚨 深度错误调试工具</h1>
          <p className="text-gray-600 mb-6">
            实时监控所有JavaScript错误、React错误、网络请求和控制台输出
          </p>

          <div className="flex gap-4 mb-6">
            <Button
              onClick={collectFullDiagnostics}
              disabled={isCollecting}
              className="bg-red-600 text-white"
            >
              {isCollecting ? '🔄 收集中...' : '🔍 收集完整诊断'}
            </Button>
            
            <Button onClick={clearErrors} variant="outline">
              🗑️ 清除错误日志
            </Button>
            
            {diagnostics && (
              <Button onClick={copyDiagnostics} variant="outline">
                📋 复制诊断信息
              </Button>
            )}
          </div>

          {/* 组件测试按钮 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">🧪 组件测试</h2>
            <div className="flex gap-2 mb-4">
              <Button onClick={() => testComponent('pdf-viewer')} size="sm">
                测试 PdfViewer
              </Button>
              <Button onClick={() => testComponent('interactive-pdf')} size="sm">
                测试 InteractivePDF
              </Button>
              <Button onClick={() => testComponent('simple-pdf')} size="sm">
                测试 SimplePDF
              </Button>
              <Button onClick={() => testComponent('none')} size="sm" variant="outline">
                清除测试
              </Button>
            </div>
            
            {/* 测试组件渲染区域 */}
            <div className="border rounded p-4 bg-gray-50">
              {activeTestComponent === 'none' && (
                <div className="text-gray-500">选择组件进行测试</div>
              )}
              {activeTestComponent === 'pdf-viewer' && (
                <div className="text-blue-600">
                  正在测试 PdfViewer 组件...
                  {/* 这里可以实际渲染PDF组件 */}
                </div>
              )}
              {activeTestComponent === 'interactive-pdf' && (
                <div className="text-green-600">
                  正在测试 InteractivePDF 组件...
                </div>
              )}
              {activeTestComponent === 'simple-pdf' && (
                <div className="text-purple-600">
                  正在测试 SimplePDF 组件...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 实时错误显示 */}
        {realTimeErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">
              🚨 实时错误 ({realTimeErrors.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {realTimeErrors.map((error, idx) => (
                <div key={idx} className="bg-white border border-red-300 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-red-700">{error.type}</span>
                    <span className="text-xs text-gray-500">{error.timestamp}</span>
                  </div>
                  <div className="text-red-600 mb-2">{error.message}</div>
                  {error.stack && (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {error.stack}
                    </pre>
                  )}
                  {error.source && (
                    <div className="text-xs text-gray-600 mt-2">
                      位置: {error.source}:{error.line}:{error.column}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 诊断结果 */}
        {diagnostics && (
          <div className="space-y-6">
            {/* 系统概况 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">📊 系统概况</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 p-4 rounded">
                  <div className="text-2xl font-bold text-red-600">{diagnostics.errors.length}</div>
                  <div className="text-sm text-gray-600">JavaScript错误</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{diagnostics.console.length}</div>
                  <div className="text-sm text-gray-600">控制台消息</div>
                </div>
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-600">{diagnostics.network.length}</div>
                  <div className="text-sm text-gray-600">网络请求</div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {diagnostics.performance ? 
                      Math.round(diagnostics.performance.usedJSHeapSize / 1024 / 1024) + 'MB' : 
                      'N/A'
                    }
                  </div>
                  <div className="text-sm text-gray-600">内存使用</div>
                </div>
              </div>
            </div>

            {/* Next.js 信息 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">⚛️ Next.js 环境信息</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(diagnostics.nextjsInfo).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded">
                    <div className="font-semibold text-sm">{key}</div>
                    <div className="text-sm text-gray-600 font-mono">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 模块信息 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">📦 模块加载状态</h3>
              <div className="space-y-2">
                {Object.entries(diagnostics.moduleInfo).map(([moduleName, info]: [string, any]) => (
                  <div key={moduleName} className={`p-3 rounded ${
                    info.status === 'available' ? 'bg-green-50' : 
                    info.status === 'error' ? 'bg-red-50' : 'bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{moduleName}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        info.status === 'available' ? 'bg-green-200 text-green-800' :
                        info.status === 'error' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
                      }`}>
                        {info.status}
                      </span>
                    </div>
                    {info.version && <div className="text-xs text-gray-600">版本: {info.version}</div>}
                    {info.error && <div className="text-xs text-red-600">错误: {info.error}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* PDF.js 信息 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">📄 PDF.js 状态</h3>
              <div className="bg-gray-50 rounded p-4">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(diagnostics.pdfjsInfo, null, 2)}
                </pre>
              </div>
            </div>

            {/* 完整诊断数据 */}
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-2">📄 完整诊断数据</h3>
              <pre className="text-xs bg-white p-4 rounded overflow-x-auto max-h-96">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}