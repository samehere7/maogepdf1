'use client'

import { useEffect, useState } from 'react'

export default function DebugPdfErrorPage() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`
    console.log('🔍 DEBUG:', logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  useEffect(() => {
    addLog('🚀 PDF错误调试页面启动')
    
    // 立即检查当前错误状态
    addLog('🌐 当前URL: ' + window.location.href)
    addLog('🖥️ 用户代理: ' + navigator.userAgent)
    
    // 设置错误监听
    const handleError = (event: ErrorEvent) => {
      addLog(`🚨 捕获错误: ${event.message}`)
      addLog(`📂 位置: ${event.filename}:${event.lineno}:${event.colno}`)
      if (event.error?.stack) {
        addLog(`📚 堆栈: ${event.error.stack}`)
      }
    }

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      addLog(`🚨 Promise拒绝: ${event.reason}`)
      if (event.reason?.stack) {
        addLog(`📚 堆栈: ${event.reason.stack}`)
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handlePromiseRejection)

    // 测试PDF.js基础功能
    const testBasicPDFJS = async () => {
      try {
        addLog('🔄 测试PDF.js基础功能...')
        
        const pdfjs = await import('pdfjs-dist')
        addLog(`✅ PDF.js导入成功，版本: ${pdfjs.version}`)
        addLog(`🔧 当前Worker: ${pdfjs.GlobalWorkerOptions.workerSrc || '未设置'}`)
        
        // 设置Worker
        const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
        addLog(`🔧 设置Worker: ${workerSrc}`)
        
        // 测试获取示例PDF
        addLog('🔄 获取示例PDF...')
        const response = await fetch('/sample.pdf')
        addLog(`📡 响应状态: ${response.status}`)
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          addLog(`📁 文件大小: ${arrayBuffer.byteLength} bytes`)
          
          // 测试解析
          addLog('🔄 解析PDF文档...')
          const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
          addLog(`✅ 解析成功，页数: ${doc.numPages}`)
          
          // 测试渲染
          addLog('🔄 渲染测试...')
          const page = await doc.getPage(1)
          const viewport = page.getViewport({ scale: 1.0 })
          addLog(`📐 页面尺寸: ${viewport.width}x${viewport.height}`)
          
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (context) {
            canvas.width = viewport.width
            canvas.height = viewport.height
            await page.render({ canvasContext: context, viewport }).promise
            addLog('✅ 渲染成功')
          } else {
            addLog('❌ 无法获取Canvas上下文')
          }
        } else {
          addLog('❌ 无法获取示例PDF文件')
        }
      } catch (error) {
        addLog(`💥 测试失败: ${error}`)
        if (error instanceof Error && error.stack) {
          addLog(`📚 错误堆栈: ${error.stack}`)
        }
      }
    }

    // 延迟执行测试
    setTimeout(testBasicPDFJS, 1000)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handlePromiseRejection)
    }
  }, [])

  const copyLogs = () => {
    const logText = logs.join('\n')
    navigator.clipboard.writeText(logText).then(() => {
      alert('日志已复制到剪贴板！请将内容发送给开发者。')
    }).catch(() => {
      // 备用方案
      const textArea = document.createElement('textarea')
      textArea.value = logText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('日志已复制到剪贴板！请将内容发送给开发者。')
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">🔍 PDF错误诊断工具</h1>
          <p className="text-gray-600 mb-6">
            此页面专门用于诊断PDF相关的client-side exception错误。
            请等待测试完成，然后复制日志发送给技术支持。
          </p>

          <button
            onClick={copyLogs}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 mb-4 text-lg"
          >
            📋 复制完整日志
          </button>

          <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm border">
            {logs.map((log, index) => (
              <div key={index} className="mb-1 break-all">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">正在初始化...</div>
            )}
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">⚠️ 使用说明</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 等待所有测试完成（约10-30秒）</li>
              <li>• 点击"复制完整日志"按钮</li>
              <li>• 将复制的内容发送给技术支持</li>
              <li>• 如果页面出现错误，错误信息也会显示在日志中</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}