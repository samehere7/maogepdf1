'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

export default function EmergencyDebugPage() {
  const params = useParams()
  const [logs, setLogs] = useState<string[]>([])
  const [pdfInfo, setPdfInfo] = useState<any>(null)
  const logsRef = useRef<HTMLDivElement>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
    
    // 自动滚动到底部
    setTimeout(() => {
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight
      }
    }, 100)
  }

  useEffect(() => {
    addLog('🔍 应急调试页面启动')
    addLog('📍 URL参数: ' + JSON.stringify(params))
    addLog('🌐 当前URL: ' + window.location.href)
    addLog('🖥️ 用户代理: ' + navigator.userAgent)
    
    // 立即设置错误监听
    const handleError = (event: ErrorEvent) => {
      addLog(`🚨 JavaScript错误: ${event.message}`)
      addLog(`📂 文件: ${event.filename}:${event.lineno}:${event.colno}`)
      if (event.error?.stack) {
        addLog(`📚 堆栈: ${event.error.stack}`)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog(`🚨 Promise拒绝: ${String(event.reason)}`)
      if (event.reason?.stack) {
        addLog(`📚 堆栈: ${event.reason.stack}`)
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // 尝试访问原始PDF页面的逻辑
    const testPDFAccess = async () => {
      try {
        addLog('🔄 开始测试PDF访问...')
        
        // 提取ID
        const pathParts = window.location.pathname.split('/')
        const id = pathParts[pathParts.length - 1] || params.id
        addLog('📝 提取的PDF ID: ' + id)

        if (!id) {
          addLog('❌ 无法提取PDF ID')
          return
        }

        // 测试API访问
        addLog('🌐 测试API访问: /api/pdfs/' + id)
        const response = await fetch(`/api/pdfs/${id}`)
        addLog(`📡 API响应状态: ${response.status} ${response.statusText}`)
        
        if (response.ok) {
          const data = await response.json()
          addLog('✅ API响应成功')
          addLog('📄 PDF信息: ' + JSON.stringify(data, null, 2))
          setPdfInfo(data)
          
          // 测试PDF文件访问
          if (data.url) {
            addLog('🔄 测试PDF文件访问: ' + data.url)
            const pdfResponse = await fetch(data.url)
            addLog(`📡 PDF文件响应: ${pdfResponse.status} ${pdfResponse.statusText}`)
            
            if (pdfResponse.ok) {
              const arrayBuffer = await pdfResponse.arrayBuffer()
              addLog(`📁 PDF文件大小: ${arrayBuffer.byteLength} bytes`)
              
              // 测试PDF.js
              await testPDFJS(arrayBuffer)
            } else {
              addLog('❌ PDF文件访问失败')
            }
          }
        } else {
          const errorText = await response.text()
          addLog('❌ API访问失败: ' + errorText)
        }

      } catch (error) {
        addLog('💥 测试过程中发生错误: ' + String(error))
        if (error instanceof Error && error.stack) {
          addLog('📚 错误堆栈: ' + error.stack)
        }
      }
    }

    const testPDFJS = async (arrayBuffer: ArrayBuffer) => {
      try {
        addLog('🔄 开始测试PDF.js...')
        
        const pdfjs = await import('pdfjs-dist')
        addLog('✅ PDF.js导入成功，版本: ' + pdfjs.version)
        
        addLog('🔧 当前Worker配置: ' + (pdfjs.GlobalWorkerOptions.workerSrc || '未设置'))
        
        const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
        addLog('🔧 设置Worker: ' + workerSrc)
        
        addLog('🔄 解析PDF文档...')
        const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
        addLog('✅ PDF文档解析成功，页数: ' + doc.numPages)
        
        addLog('🔄 渲染第一页...')
        const page = await doc.getPage(1)
        const viewport = page.getViewport({ scale: 1.0 })
        addLog(`📐 页面尺寸: ${viewport.width} x ${viewport.height}`)
        
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) {
          throw new Error('无法获取Canvas 2D上下文')
        }
        
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise
        
        addLog('✅ 页面渲染成功')
        
        // 测试缩放
        addLog('🔄 测试缩放渲染...')
        const scaleViewport = page.getViewport({ scale: 1.5 })
        canvas.width = scaleViewport.width
        canvas.height = scaleViewport.height
        
        await page.render({
          canvasContext: context,
          viewport: scaleViewport
        }).promise
        
        addLog('✅ 缩放渲染成功')
        
      } catch (error) {
        addLog('💥 PDF.js测试失败: ' + String(error))
        if (error instanceof Error && error.stack) {
          addLog('📚 错误堆栈: ' + error.stack)
        }
      }
    }

    // 延迟执行测试，确保页面完全加载
    setTimeout(testPDFAccess, 1000)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [params])

  const copyLogs = () => {
    const logText = logs.join('\n')
    navigator.clipboard.writeText(logText).then(() => {
      alert('日志已复制到剪贴板')
    }).catch(() => {
      // 备用方案
      const textArea = document.createElement('textarea')
      textArea.value = logText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('日志已复制到剪贴板')
    })
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">🚑 应急PDF调试工具</h1>
          <p className="text-gray-600 mb-6">
            专门用于诊断PDF页面的client-side exception错误
          </p>

          <div className="flex gap-4 mb-4">
            <button
              onClick={copyLogs}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              📋 复制日志
            </button>
            <button
              onClick={clearLogs}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              🗑️ 清除日志
            </button>
          </div>

          {/* 实时日志 */}
          <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            <div ref={logsRef}>
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500">等待日志输出...</div>
              )}
            </div>
          </div>

          {/* PDF信息 */}
          {pdfInfo && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">📄 PDF信息</h3>
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(pdfInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}