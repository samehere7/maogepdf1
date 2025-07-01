"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, XCircle, Info, Copy, Download, Play, RefreshCw } from 'lucide-react'

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
  
  // 新增状态
  const [realTimeLog, setRealTimeLog] = useState<string[]>([])
  const [isRunningDiagnosis, setIsRunningDiagnosis] = useState(false)
  const [diagnosisStep, setDiagnosisStep] = useState('')
  const [pdfTestFile, setPdfTestFile] = useState<string>('')
  
  // 实时日志函数
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setRealTimeLog(prev => [...prev, logEntry])
    console.log(logEntry)
  }
  
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
  
  // 完整的PDF诊断流程
  const runCompleteDiagnosis = async () => {
    setIsRunningDiagnosis(true)
    setRealTimeLog([])
    
    try {
      addLog('🔍 开始完整PDF诊断流程...')
      
      // 步骤1: 检测基础环境
      setDiagnosisStep('检测基础环境')
      addLog('📋 步骤1: 检测基础环境')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      addLog(`浏览器: ${navigator.userAgent}`)
      addLog(`语言: ${navigator.language}`)
      addLog(`在线状态: ${navigator.onLine}`)
      addLog(`Cookie启用: ${navigator.cookieEnabled}`)
      
      // 步骤2: 测试Canvas功能
      setDiagnosisStep('测试Canvas功能')
      addLog('🎨 步骤2: 测试Canvas功能')
      await testCanvasDetailed()
      
      // 步骤3: 测试PDF.js加载
      setDiagnosisStep('测试PDF.js加载')
      addLog('📚 步骤3: 测试PDF.js加载')
      await testPDFJSDetailed()
      
      // 步骤4: 测试实际PDF文件
      setDiagnosisStep('测试PDF文件加载')
      addLog('📄 步骤4: 测试PDF文件加载')
      await testActualPDF()
      
      // 步骤5: 生成诊断报告
      setDiagnosisStep('生成诊断报告')
      addLog('📊 步骤5: 生成完整诊断报告')
      
      addLog('✅ 诊断完成！请查看详细结果')
      
    } catch (error) {
      addLog(`❌ 诊断过程发生错误: ${error}`)
    } finally {
      setIsRunningDiagnosis(false)
      setDiagnosisStep('')
    }
  }
  
  // 详细Canvas测试
  const testCanvasDetailed = async () => {
    try {
      // 基本Canvas测试
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        addLog('❌ Canvas 2D上下文获取失败')
        return false
      }
      
      addLog('✅ Canvas 2D上下文创建成功')
      
      // 测试基本绘制
      ctx.fillStyle = '#FF0000'
      ctx.fillRect(50, 50, 100, 100)
      addLog('✅ Canvas基本绘制测试通过')
      
      // 测试文本渲染
      ctx.font = '20px Arial'
      ctx.fillStyle = '#000000'
      ctx.fillText('Test Text', 60, 80)
      addLog('✅ Canvas文本渲染测试通过')
      
      // 测试图像数据
      const imageData = ctx.getImageData(75, 75, 1, 1)
      addLog(`✅ Canvas图像数据获取成功: R=${imageData.data[0]}, G=${imageData.data[1]}, B=${imageData.data[2]}`)
      
      // 测试WebGL
      const webglCanvas = document.createElement('canvas')
      const webgl = webglCanvas.getContext('webgl') || webglCanvas.getContext('experimental-webgl')
      if (webgl) {
        addLog('✅ WebGL支持正常')
      } else {
        addLog('⚠️ WebGL不支持（非必需）')
      }
      
      return true
      
    } catch (error) {
      addLog(`❌ Canvas测试失败: ${error}`)
      return false
    }
  }
  
  // 详细PDF.js测试
  const testPDFJSDetailed = async () => {
    try {
      addLog('正在加载PDF.js模块...')
      
      const pdfjs = await import('pdfjs-dist')
      addLog(`✅ PDF.js模块加载成功，版本: ${pdfjs.version}`)
      
      // 设置Worker
      const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
      addLog(`✅ PDF.js Worker设置完成: ${workerSrc}`)
      
      // 测试Worker加载
      try {
        const response = await fetch(workerSrc, { method: 'HEAD' })
        if (response.ok) {
          addLog('✅ PDF.js Worker文件可访问')
        } else {
          addLog(`⚠️ PDF.js Worker访问异常: ${response.status}`)
        }
      } catch (fetchError) {
        addLog(`❌ PDF.js Worker访问失败: ${fetchError}`)
      }
      
      return pdfjs
      
    } catch (error) {
      addLog(`❌ PDF.js加载失败: ${error}`)
      return null
    }
  }
  
  // 测试实际PDF文件
  const testActualPDF = async () => {
    try {
      const pdfjs = await import('pdfjs-dist')
      
      // 首先测试当前用户的PDF文件
      const currentUrl = window.location.href
      const baseUrl = currentUrl.split('/zh/')[0]
      const userPdfUrl = `${baseUrl}/api/pdf/javascript-english.pdf` // 使用用户实际的PDF
      
      addLog(`正在测试用户PDF文件: ${userPdfUrl}`)
      
      try {
        const response = await fetch(userPdfUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf,*/*'
          }
        })
        
        if (!response.ok) {
          addLog(`❌ 用户PDF文件访问失败: HTTP ${response.status}`)
          // 尝试备用测试PDF
          return await testFallbackPDF(pdfjs)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        addLog(`✅ PDF文件下载成功，大小: ${arrayBuffer.byteLength} bytes`)
        
        return await renderPDFTest(pdfjs, arrayBuffer)
        
      } catch (pdfError) {
        addLog(`❌ 用户PDF测试失败: ${pdfError}`)
        addLog('尝试使用备用PDF进行测试...')
        return await testFallbackPDF(pdfjs)
      }
      
    } catch (error) {
      addLog(`❌ PDF测试异常: ${error}`)
      return false
    }
  }
  
  // 备用PDF测试
  const testFallbackPDF = async (pdfjs: any) => {
    addLog('正在尝试内嵌测试PDF...')
    
    try {
      // 创建一个最小的PDF内容用于测试
      const testPdfBase64 = "JVBERi0xLjMKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL091dGxpbmVzIDIgMCBSCi9QYWdlcyAzIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKL1R5cGUgL091dGxpbmVzCi9Db3VudCAwCj4+CmVuZG9iagoKMyAwIG9iago8PAovVHlwZSAvUGFnZXMKL0NvdW50IDEKL0tpZHMgWzEgMCBSXQo+PgplbmRvYmoKCjEgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAzIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSAyMCAwIFIKPj4KPj4KL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzIgNzIwIFRkCihIZWxsbyBXb3JsZCEpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCjIwIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCnhyZWYKMCAyMQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAyNjggMDAwMDBuIAowMDAwMDAwMDEwIDAwMDAwbiAKMDAwMDAwMDA1MyAwMDAwMG4gCjAwMDAwMDAzMjAgMDAwMDBuIAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwNDEyIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgMjEKL1Jvb3QgNCAwIFIKPj4Kc3RhcnR4cmVmCjQ3NAolJUVPRgo="
      
      const binaryString = atob(testPdfBase64)
      const arrayBuffer = new ArrayBuffer(binaryString.length)
      const uint8Array = new Uint8Array(arrayBuffer)
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i)
      }
      
      addLog(`✅ 内嵌PDF创建成功，大小: ${arrayBuffer.byteLength} bytes`)
      
      return await renderPDFTest(pdfjs, arrayBuffer)
      
    } catch (error) {
      addLog(`❌ 备用PDF测试失败: ${error}`)
      return false
    }
  }
  
  // PDF渲染测试
  const renderPDFTest = async (pdfjs: any, arrayBuffer: ArrayBuffer) => {
    try {
      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
      addLog(`✅ PDF文档解析成功，页数: ${doc.numPages}`)
      
      // 测试渲染第一页
      const page = await doc.getPage(1)
      addLog('✅ PDF页面获取成功')
      
      const viewport = page.getViewport({ scale: 1.0 })
      addLog(`✅ PDF视口创建成功: ${viewport.width}x${viewport.height}`)
      
      // 测试Canvas渲染
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (context) {
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise
        
        addLog('✅ PDF页面渲染到Canvas成功')
        addLog('🎉 所有PDF功能测试通过！问题可能在于特定PDF文件的网络访问')
      } else {
        addLog('❌ Canvas上下文获取失败，无法渲染PDF')
      }
      
      return true
      
    } catch (error) {
      addLog(`❌ PDF渲染测试失败: ${error}`)
      return false
    }
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
        <div className="mb-6 flex flex-wrap gap-4">
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
          
          <Button 
            onClick={runCompleteDiagnosis}
            disabled={isRunningDiagnosis}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isRunningDiagnosis ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {diagnosisStep || '诊断中...'}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                完整诊断流程
              </>
            )}
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

        {/* 实时诊断日志 */}
        {realTimeLog.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold mb-4">实时诊断日志</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-80 overflow-y-auto">
              {realTimeLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={() => {
                  const text = realTimeLog.join('\n')
                  navigator.clipboard.writeText(text)
                  alert('日志已复制到剪贴板')
                }}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-1" />
                复制日志
              </Button>
              <Button 
                onClick={() => setRealTimeLog([])}
                variant="outline"
                size="sm"
              >
                清除日志
              </Button>
            </div>
          </div>
        )}

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
            <p>3. <strong>🆕 完整诊断流程:</strong> 运行全面的PDF问题诊断，包含详细的步骤日志</p>
            <p>4. <strong>复制/下载报告:</strong> 将调试信息发送给开发者进行分析</p>
            <p>5. <strong>实时错误监控:</strong> 页面会自动捕获并记录所有JavaScript错误</p>
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="text-purple-800"><strong>🎯 推荐流程:</strong> 如果PDF无法显示，请点击"完整诊断流程"按钮，它会自动测试所有可能的问题点并提供详细的诊断日志。完成后请复制日志发送给技术支持。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}