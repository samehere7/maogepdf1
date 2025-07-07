'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"

interface DiagnosticInfo {
  timestamp: string
  browser: {
    userAgent: string
    vendor: string
    platform: string
    language: string
    cookieEnabled: boolean
    onLine: boolean
    hardwareConcurrency: number
    deviceMemory?: number
    connection?: any
  }
  screen: {
    width: number
    height: number
    availWidth: number
    availHeight: number
    pixelDepth: number
    colorDepth: number
    devicePixelRatio: number
    orientation?: string
  }
  pdfjs: {
    version?: string
    workerSrc?: string
    isLoaded: boolean
    features: {
      canvasSupport: boolean
      webglSupport: boolean
      webgl2Support: boolean
      offscreenCanvasSupport: boolean
      workerSupport: boolean
      serviceWorkerSupport: boolean
    }
    errors: string[]
  }
  performance: {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
    timing?: {
      navigationStart: number
      loadEventEnd: number
      loadTime: number
    }
    navigation?: any
  }
  css: {
    viewport: {
      width: number
      height: number
    }
    supports: {
      aspectRatio: boolean
      containerQueries: boolean
      gridSupport: boolean
      flexSupport: boolean
      transforms: boolean
      transitions: boolean
      animations: boolean
    }
  }
  errors: {
    consoleErrors: any[]
    unhandledRejections: any[]
    jsErrors: any[]
  }
  pdfFile?: {
    name: string
    size: number
    type: string
    lastModified: number
    url?: string
  }
  scaleTest?: {
    scales: number[]
    results: any[]
    renderTimes: number[]
    memoryUsage: any[]
    errors: string[]
  }
}

export default function PDFScaleDebugPage() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [testPdfUrl, setTestPdfUrl] = useState<string>('')
  const [runningTests, setRunningTests] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 收集基本诊断信息
  const collectBasicDiagnostics = (): DiagnosticInfo => {
    const info: DiagnosticInfo = {
      timestamp: new Date().toISOString(),
      browser: {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as any).deviceMemory,
        connection: (navigator as any).connection
      },
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        pixelDepth: screen.pixelDepth,
        colorDepth: screen.colorDepth,
        devicePixelRatio: window.devicePixelRatio,
        orientation: (screen as any).orientation?.type
      },
      pdfjs: {
        isLoaded: false,
        features: {
          canvasSupport: false,
          webglSupport: false,
          webgl2Support: false,
          offscreenCanvasSupport: false,
          workerSupport: false,
          serviceWorkerSupport: false
        },
        errors: []
      },
      performance: {
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : undefined,
        timing: performance.timing ? {
          navigationStart: performance.timing.navigationStart,
          loadEventEnd: performance.timing.loadEventEnd,
          loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
        } : undefined,
        navigation: (performance as any).navigation
      },
      css: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        supports: {
          aspectRatio: CSS.supports('aspect-ratio', '1'),
          containerQueries: CSS.supports('container-type', 'inline-size'),
          gridSupport: CSS.supports('display', 'grid'),
          flexSupport: CSS.supports('display', 'flex'),
          transforms: CSS.supports('transform', 'scale(1)'),
          transitions: CSS.supports('transition', 'all 0.3s'),
          animations: CSS.supports('animation', 'test 1s')
        }
      },
      errors: {
        consoleErrors: [],
        unhandledRejections: [],
        jsErrors: []
      }
    }

    // 检测Canvas支持
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx2d = canvas.getContext('2d')
      info.pdfjs.features.canvasSupport = !!ctx2d

      // 检测WebGL支持
      const webglCtx = canvas.getContext('webgl')
      info.pdfjs.features.webglSupport = !!webglCtx

      // 检测WebGL2支持
      const webgl2Ctx = canvas.getContext('webgl2')
      info.pdfjs.features.webgl2Support = !!webgl2Ctx
    }

    // 检测OffscreenCanvas支持
    info.pdfjs.features.offscreenCanvasSupport = typeof OffscreenCanvas !== 'undefined'

    // 检测Worker支持
    info.pdfjs.features.workerSupport = typeof Worker !== 'undefined'

    // 检测ServiceWorker支持
    info.pdfjs.features.serviceWorkerSupport = 'serviceWorker' in navigator

    return info
  }

  // 检测PDF.js
  const detectPDFJS = async (info: DiagnosticInfo) => {
    try {
      const pdfjs = await import('pdfjs-dist')
      info.pdfjs.isLoaded = true
      info.pdfjs.version = pdfjs.version
      info.pdfjs.workerSrc = pdfjs.GlobalWorkerOptions.workerSrc

      // 测试PDF.js基本功能
      try {
        await pdfjs.getDocument({ data: new Uint8Array([]) }).promise
      } catch (error) {
        // 预期的错误，说明PDF.js可以正常加载
        console.log('PDF.js基本测试通过')
      }
    } catch (error) {
      info.pdfjs.errors.push(`PDF.js加载失败: ${error}`)
    }
  }

  // 运行PDF缩放测试
  const runScaleTests = async (pdfUrl: string): Promise<any> => {
    const testResults = {
      scales: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0],
      results: [],
      renderTimes: [],
      memoryUsage: [],
      errors: []
    }

    try {
      const pdfjs = await import('pdfjs-dist')
      
      // 配置worker
      const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

      let arrayBuffer: ArrayBuffer

      if (selectedFile) {
        arrayBuffer = await selectedFile.arrayBuffer()
      } else {
        const response = await fetch(pdfUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        arrayBuffer = await response.arrayBuffer()
      }

      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
      const page = await doc.getPage(1)

      for (const scale of testResults.scales) {
        try {
          const startTime = performance.now()
          const startMemory = (performance as any).memory?.usedJSHeapSize

          const viewport = page.getViewport({ scale })
          
          // 创建canvas
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          
          if (!context) {
            throw new Error('无法获取2D上下文')
          }

          const devicePixelRatio = window.devicePixelRatio || 1
          canvas.width = viewport.width * devicePixelRatio
          canvas.height = viewport.height * devicePixelRatio
          canvas.style.width = `${viewport.width}px`
          canvas.style.height = `${viewport.height}px`
          
          context.scale(devicePixelRatio, devicePixelRatio)

          // 渲染PDF页面
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise

          const endTime = performance.now()
          const endMemory = (performance as any).memory?.usedJSHeapSize
          const renderTime = endTime - startTime

          testResults.results.push({
            scale,
            success: true,
            renderTime,
            canvasSize: { width: canvas.width, height: canvas.height },
            viewportSize: { width: viewport.width, height: viewport.height }
          })
          
          testResults.renderTimes.push(renderTime)
          
          if (startMemory && endMemory) {
            testResults.memoryUsage.push({
              scale,
              memoryDelta: endMemory - startMemory,
              totalMemory: endMemory
            })
          }

          // 清理canvas
          canvas.remove()
          
        } catch (error) {
          testResults.errors.push(`缩放 ${scale}: ${error}`)
          testResults.results.push({
            scale,
            success: false,
            error: String(error)
          })
        }
      }

    } catch (error) {
      testResults.errors.push(`PDF测试失败: ${error}`)
    }

    return testResults
  }

  // 执行完整诊断
  const runDiagnostics = async () => {
    setLoading(true)
    setRunningTests(true)

    try {
      const info = collectBasicDiagnostics()

      // 收集控制台错误
      const originalConsoleError = console.error
      const capturedErrors: any[] = []
      
      console.error = (...args) => {
        capturedErrors.push({
          timestamp: new Date().toISOString(),
          args: args.map(arg => String(arg))
        })
        originalConsoleError(...args)
      }

      // 检测PDF.js
      await detectPDFJS(info)

      // 如果有文件选择或测试URL，运行缩放测试
      if (selectedFile || testPdfUrl) {
        info.scaleTest = await runScaleTests(testPdfUrl)
      }

      // 添加文件信息
      if (selectedFile) {
        info.pdfFile = {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          lastModified: selectedFile.lastModified
        }
      } else if (testPdfUrl) {
        info.pdfFile = {
          name: testPdfUrl.split('/').pop() || 'unknown',
          size: 0,
          type: 'application/pdf',
          lastModified: 0,
          url: testPdfUrl
        }
      }

      // 恢复console.error
      console.error = originalConsoleError
      info.errors.consoleErrors = capturedErrors

      setDiagnostic(info)

    } catch (error) {
      console.error('诊断失败:', error)
    } finally {
      setLoading(false)
      setRunningTests(false)
    }
  }

  // 复制诊断信息到剪贴板
  const copyToClipboard = async () => {
    if (!diagnostic) return

    const text = JSON.stringify(diagnostic, null, 2)
    try {
      await navigator.clipboard.writeText(text)
      alert('诊断信息已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      // 备用方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('诊断信息已复制到剪贴板')
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('请选择PDF文件')
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌'
  }

  const getMemoryStatus = (memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number }) => {
    if (!memory) return '未知'
    const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    if (usage > 80) return `🔴 ${usage.toFixed(1)}%`
    if (usage > 60) return `🟡 ${usage.toFixed(1)}%`
    return `🟢 ${usage.toFixed(1)}%`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">🔍 PDF 缩放问题调试工具</h1>
          <p className="text-gray-600 mb-6">
            专门用于诊断PDF查看器缩放功能问题的调试工具。请选择PDF文件或提供测试URL，然后点击开始诊断。
          </p>

          {/* 测试文件选择 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">📁 选择测试文件</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">本地PDF文件:</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    已选择: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">或者提供PDF URL:</label>
                <input
                  type="url"
                  value={testPdfUrl}
                  onChange={(e) => setTestPdfUrl(e.target.value)}
                  placeholder="https://example.com/sample.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">快速测试URL:</label>
                <div className="space-x-2">
                  <Button
                    onClick={() => setTestPdfUrl('/sample.pdf')}
                    variant="outline"
                    size="sm"
                  >
                    使用示例PDF
                  </Button>
                  <Button
                    onClick={() => setTestPdfUrl('https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf')}
                    variant="outline"
                    size="sm"
                  >
                    Mozilla示例PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex gap-4 mb-8">
            <Button
              onClick={runDiagnostics}
              disabled={loading || (!selectedFile && !testPdfUrl)}
              className="bg-blue-600 text-white px-6 py-3 text-lg"
            >
              {loading ? '🔄 诊断中...' : '🚀 开始诊断'}
            </Button>
            
            {diagnostic && (
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="px-6 py-3"
              >
                📋 复制诊断结果
              </Button>
            )}
          </div>
        </div>

        {/* 隐藏的canvas用于测试 */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* 诊断结果 */}
        {diagnostic && (
          <div className="space-y-6">
            {/* 总结卡片 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">📊 诊断总结</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {diagnostic.pdfjs.isLoaded ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">PDF.js 状态</div>
                  <div className="text-xs text-gray-500">{diagnostic.pdfjs.version || '未知版本'}</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(diagnostic.pdfjs.features).filter(Boolean).length}/
                    {Object.keys(diagnostic.pdfjs.features).length}
                  </div>
                  <div className="text-sm text-gray-600">浏览器兼容性</div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded">
                  <div className="text-2xl font-bold text-yellow-600">
                    {getMemoryStatus(diagnostic.performance.memory)}
                  </div>
                  <div className="text-sm text-gray-600">内存使用率</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {diagnostic.scaleTest?.errors.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">缩放测试错误</div>
                </div>
              </div>
            </div>

            {/* 浏览器信息 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">🌐 浏览器环境</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">基本信息</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>用户代理:</strong> {diagnostic.browser.userAgent}</div>
                    <div><strong>平台:</strong> {diagnostic.browser.platform}</div>
                    <div><strong>语言:</strong> {diagnostic.browser.language}</div>
                    <div><strong>CPU核心:</strong> {diagnostic.browser.hardwareConcurrency}</div>
                    {diagnostic.browser.deviceMemory && (
                      <div><strong>设备内存:</strong> {diagnostic.browser.deviceMemory} GB</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">屏幕信息</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>分辨率:</strong> {diagnostic.screen.width} × {diagnostic.screen.height}</div>
                    <div><strong>可用区域:</strong> {diagnostic.screen.availWidth} × {diagnostic.screen.availHeight}</div>
                    <div><strong>设备像素比:</strong> {diagnostic.screen.devicePixelRatio}</div>
                    <div><strong>色深:</strong> {diagnostic.screen.colorDepth} bit</div>
                    <div><strong>视口:</strong> {diagnostic.css.viewport.width} × {diagnostic.css.viewport.height}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF.js 功能支持 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">🔧 PDF.js 功能支持</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(diagnostic.pdfjs.features).map(([feature, supported]) => (
                  <div key={feature} className={`p-3 rounded ${supported ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-2">
                      <span>{getStatusIcon(supported)}</span>
                      <span className="font-medium text-sm">{feature}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {diagnostic.pdfjs.errors.length > 0 && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                  <h4 className="font-semibold text-red-800 mb-2">PDF.js 错误:</h4>
                  <ul className="space-y-1">
                    {diagnostic.pdfjs.errors.map((error, idx) => (
                      <li key={idx} className="text-red-700 text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 缩放测试结果 */}
            {diagnostic.scaleTest && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-4">📏 缩放测试结果</h3>
                
                {diagnostic.scaleTest.results.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left">缩放比例</th>
                          <th className="px-3 py-2 text-left">状态</th>
                          <th className="px-3 py-2 text-left">渲染时间</th>
                          <th className="px-3 py-2 text-left">Canvas尺寸</th>
                          <th className="px-3 py-2 text-left">视口尺寸</th>
                          <th className="px-3 py-2 text-left">错误</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diagnostic.scaleTest.results.map((result, idx) => (
                          <tr key={idx} className={result.success ? '' : 'bg-red-50'}>
                            <td className="px-3 py-2 font-mono">{result.scale}×</td>
                            <td className="px-3 py-2">{getStatusIcon(result.success)}</td>
                            <td className="px-3 py-2">
                              {result.renderTime ? `${result.renderTime.toFixed(1)}ms` : '-'}
                            </td>
                            <td className="px-3 py-2">
                              {result.canvasSize ? `${result.canvasSize.width} × ${result.canvasSize.height}` : '-'}
                            </td>
                            <td className="px-3 py-2">
                              {result.viewportSize ? `${result.viewportSize.width} × ${result.viewportSize.height}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-red-600">
                              {result.error || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {diagnostic.scaleTest.errors.length > 0 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                    <h4 className="font-semibold text-red-800 mb-2">缩放测试错误:</h4>
                    <ul className="space-y-1">
                      {diagnostic.scaleTest.errors.map((error, idx) => (
                        <li key={idx} className="text-red-700 text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* CSS 支持 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">🎨 CSS 功能支持</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(diagnostic.css.supports).map(([feature, supported]) => (
                  <div key={feature} className={`p-3 rounded ${supported ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-2">
                      <span>{getStatusIcon(supported)}</span>
                      <span className="font-medium text-sm">{feature}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 性能信息 */}
            {diagnostic.performance.memory && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-4">⚡ 性能信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-gray-600">已用内存</div>
                    <div className="text-xl font-bold">
                      {Math.round(diagnostic.performance.memory.usedJSHeapSize / 1024 / 1024)} MB
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-gray-600">总内存</div>
                    <div className="text-xl font-bold">
                      {Math.round(diagnostic.performance.memory.totalJSHeapSize / 1024 / 1024)} MB
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded">
                    <div className="text-sm text-gray-600">内存限制</div>
                    <div className="text-xl font-bold">
                      {Math.round(diagnostic.performance.memory.jsHeapSizeLimit / 1024 / 1024)} MB
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 错误日志 */}
            {diagnostic.errors.consoleErrors.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-4">🚨 控制台错误</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {diagnostic.errors.consoleErrors.map((error, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="text-xs text-gray-500">{error.timestamp}</div>
                      <div className="text-sm text-red-700 font-mono">{error.args.join(' ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 完整诊断数据 */}
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-2">📄 完整诊断数据</h3>
              <div className="text-xs text-gray-600 mb-2">
                点击"复制诊断结果"按钮可将以下JSON数据复制到剪贴板：
              </div>
              <pre className="text-xs bg-white p-4 rounded overflow-x-auto max-h-96">
                {JSON.stringify(diagnostic, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {runningTests && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-lg font-semibold mb-2">正在运行缩放测试...</div>
              <div className="text-sm text-gray-600">这可能需要几秒钟，请稍候</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}