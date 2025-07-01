"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, XCircle, Info, Copy, Download } from 'lucide-react'

interface ErrorInfo {
  message: string
  stack: string
  timestamp: string
  userAgent: string
  url: string
}

interface DebugInfo {
  errors: ErrorInfo[]
  pdfJsVersion: string | null
  browserInfo: {
    userAgent: string
    language: string
    platform: string
    cookieEnabled: boolean
    onLine: boolean
  }
  windowInfo: {
    innerWidth: number
    innerHeight: number
    devicePixelRatio: number
  }
  memoryInfo: any
  performanceInfo: {
    navigationStart: number
    loadEventEnd: number
    domContentLoadedEventEnd: number
  }
  localStorage: {
    available: boolean
    quotaExceeded: boolean
  }
  supportsWebGL: boolean
  supportsCanvas: boolean
}

export default function PDFDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isCollecting, setIsCollecting] = useState(false)
  const [testResults, setTestResults] = useState<any>({})
  const errorLogRef = useRef<ErrorInfo[]>([])
  
  // 全局错误监听
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorInfo: ErrorInfo = {
        message: event.message,
        stack: event.error?.stack || 'No stack trace',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: event.filename || window.location.href
      }
      
      errorLogRef.current.push(errorInfo)
      console.error('[PDF Debug] 捕获到错误:', errorInfo)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo: ErrorInfo = {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack || 'No stack trace',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      
      errorLogRef.current.push(errorInfo)
      console.error('[PDF Debug] 捕获到Promise rejection:', errorInfo)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // 收集调试信息
  const collectDebugInfo = async () => {
    setIsCollecting(true)
    
    try {
      // 检查PDF.js是否可用
      let pdfJsVersion = null
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfJsVersion = pdfjs.version
      } catch (error) {
        console.error('PDF.js不可用:', error)
      }

      // 检查内存信息
      const memoryInfo = (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null

      // 检查性能信息
      const performanceInfo = {
        navigationStart: performance.timing?.navigationStart || 0,
        loadEventEnd: performance.timing?.loadEventEnd || 0,
        domContentLoadedEventEnd: performance.timing?.domContentLoadedEventEnd || 0
      }

      // 检查localStorage
      let localStorageInfo = { available: false, quotaExceeded: false }
      try {
        localStorage.setItem('test', 'test')
        localStorage.removeItem('test')
        localStorageInfo.available = true
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          localStorageInfo.quotaExceeded = true
        }
      }

      // 检查WebGL支持
      const canvas = document.createElement('canvas')
      const supportsWebGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      const supportsCanvas = !!canvas.getContext('2d')

      const info: DebugInfo = {
        errors: [...errorLogRef.current],
        pdfJsVersion,
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        },
        windowInfo: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        memoryInfo,
        performanceInfo,
        localStorage: localStorageInfo,
        supportsWebGL,
        supportsCanvas
      }

      setDebugInfo(info)
      
    } catch (error) {
      console.error('收集调试信息失败:', error)
    } finally {
      setIsCollecting(false)
    }
  }

  // 测试PDF.js功能
  const testPDFJS = async () => {
    setTestResults(prev => ({ ...prev, pdfjs: 'testing' }))
    
    try {
      const pdfjs = await import('pdfjs-dist')
      
      // 设置worker
      const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
      
      setTestResults(prev => ({ ...prev, pdfjs: 'success', pdfVersion: pdfjs.version }))
      
    } catch (error) {
      console.error('PDF.js测试失败:', error)
      setTestResults(prev => ({ ...prev, pdfjs: 'failed', pdfError: error }))
    }
  }

  // 测试Canvas功能
  const testCanvas = () => {
    setTestResults(prev => ({ ...prev, canvas: 'testing' }))
    
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('无法获取2D上下文')
      }
      
      // 测试基本绘制
      ctx.fillStyle = 'red'
      ctx.fillRect(0, 0, 100, 100)
      
      // 测试文本渲染
      ctx.font = '16px Arial'
      ctx.fillText('Test', 10, 50)
      
      setTestResults(prev => ({ ...prev, canvas: 'success' }))
      
    } catch (error) {
      console.error('Canvas测试失败:', error)
      setTestResults(prev => ({ ...prev, canvas: 'failed', canvasError: error }))
    }
  }

  // 复制调试信息
  const copyDebugInfo = () => {
    if (debugInfo) {
      const text = JSON.stringify(debugInfo, null, 2)
      navigator.clipboard.writeText(text).then(() => {
        alert('调试信息已复制到剪贴板')
      })
    }
  }

  // 下载调试信息
  const downloadDebugInfo = () => {
    if (debugInfo) {
      const text = JSON.stringify(debugInfo, null, 2)
      const blob = new Blob([text], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pdf-debug-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // 运行所有测试
  const runAllTests = async () => {
    await testPDFJS()
    testCanvas()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'testing': return <Info className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF 客户端异常调试工具</h1>
          <p className="text-gray-600">
            这个工具将帮助诊断PDF查看器的客户端异常问题，收集详细的环境信息和错误日志。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="mb-6 flex gap-4">
          <Button 
            onClick={collectDebugInfo} 
            disabled={isCollecting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCollecting ? '收集中...' : '收集调试信息'}
          </Button>
          
          <Button 
            onClick={runAllTests}
            variant="outline"
          >
            运行功能测试
          </Button>
          
          {debugInfo && (
            <>
              <Button onClick={copyDebugInfo} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                复制信息
              </Button>
              
              <Button onClick={downloadDebugInfo} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                下载报告
              </Button>
            </>
          )}
        </div>

        {/* 功能测试结果 */}
        {Object.keys(testResults).length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold mb-4">功能测试结果</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(testResults.pdfjs)}
                <span>PDF.js 加载测试</span>
                {testResults.pdfVersion && <span className="text-green-600">({testResults.pdfVersion})</span>}
                {testResults.pdfError && (
                  <span className="text-red-600 text-sm">
                    错误: {testResults.pdfError.message}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {getStatusIcon(testResults.canvas)}
                <span>Canvas 渲染测试</span>
                {testResults.canvasError && (
                  <span className="text-red-600 text-sm">
                    错误: {testResults.canvasError.message}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 调试信息展示 */}
        {debugInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 错误日志 */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-semibold text-red-600 mb-4">错误日志 ({debugInfo.errors.length})</h3>
              {debugInfo.errors.length === 0 ? (
                <p className="text-green-600">未检测到错误 ✓</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {debugInfo.errors.map((error, index) => (
                    <div key={index} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50">
                      <div className="font-medium text-red-800">{error.message}</div>
                      <div className="text-xs text-gray-600 mt-1">{error.timestamp}</div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-700">查看堆栈</summary>
                        <pre className="text-xs bg-gray-100 p-2 mt-1 overflow-x-auto">
                          {error.stack}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 浏览器信息 */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-semibold mb-4">浏览器环境</h3>
              <div className="space-y-2 text-sm">
                <div><strong>用户代理:</strong> {debugInfo.browserInfo.userAgent}</div>
                <div><strong>语言:</strong> {debugInfo.browserInfo.language}</div>
                <div><strong>平台:</strong> {debugInfo.browserInfo.platform}</div>
                <div><strong>Cookie启用:</strong> {debugInfo.browserInfo.cookieEnabled ? '是' : '否'}</div>
                <div><strong>在线状态:</strong> {debugInfo.browserInfo.onLine ? '在线' : '离线'}</div>
                <div><strong>窗口尺寸:</strong> {debugInfo.windowInfo.innerWidth} × {debugInfo.windowInfo.innerHeight}</div>
                <div><strong>设备像素比:</strong> {debugInfo.windowInfo.devicePixelRatio}</div>
              </div>
            </div>

            {/* 技术支持 */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-semibold mb-4">技术支持检查</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {debugInfo.pdfJsVersion ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  <span>PDF.js: {debugInfo.pdfJsVersion || '未加载'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {debugInfo.supportsCanvas ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  <span>Canvas 支持</span>
                </div>
                <div className="flex items-center gap-2">
                  {debugInfo.supportsWebGL ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  <span>WebGL 支持</span>
                </div>
                <div className="flex items-center gap-2">
                  {debugInfo.localStorage.available ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  <span>LocalStorage 可用</span>
                </div>
              </div>
            </div>

            {/* 性能信息 */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-semibold mb-4">性能信息</h3>
              <div className="space-y-2 text-sm">
                {debugInfo.memoryInfo && (
                  <>
                    <div><strong>已用内存:</strong> {(debugInfo.memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
                    <div><strong>总内存:</strong> {(debugInfo.memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
                    <div><strong>内存限制:</strong> {(debugInfo.memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB</div>
                  </>
                )}
                <div><strong>页面加载时间:</strong> {debugInfo.performanceInfo.loadEventEnd - debugInfo.performanceInfo.navigationStart} ms</div>
                <div><strong>DOM加载时间:</strong> {debugInfo.performanceInfo.domContentLoadedEventEnd - debugInfo.performanceInfo.navigationStart} ms</div>
              </div>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-6 bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold mb-4">使用说明</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>1. <strong>收集调试信息:</strong> 点击"收集调试信息"按钮获取完整的环境信息</p>
            <p>2. <strong>运行功能测试:</strong> 测试PDF.js和Canvas的基本功能</p>
            <p>3. <strong>复制/下载报告:</strong> 将调试信息发送给开发者进行分析</p>
            <p>4. <strong>实时错误监控:</strong> 页面会自动捕获并记录所有JavaScript错误</p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800"><strong>提示:</strong> 如果您遇到PDF查看问题，请先点击"收集调试信息"，然后尝试访问有问题的PDF页面，最后复制或下载调试报告发送给技术支持。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}