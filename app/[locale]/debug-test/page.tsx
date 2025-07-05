"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface DebugInfo {
  timestamp: string
  userAgent: string
  url: string
  errors: any[]
  pdfjsStatus: any
  environment: any
}

export default function DebugTestPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isCollecting, setIsCollecting] = useState(false)
  const router = useRouter()

  const collectDebugInfo = async () => {
    if (typeof window === 'undefined') return

    setIsCollecting(true)
    console.log('🔧 [调试测试页面] 开始收集调试信息...')

    const info: DebugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: (window as any).__debugErrors || [],
      pdfjsStatus: {},
      environment: {
        platform: navigator.platform,
        language: navigator.language,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    }

    // 测试PDF.js
    try {
      console.log('🧪 测试PDF.js...')
      const { getPDFJS } = await import('@/lib/pdf-manager')
      const pdfjs = await getPDFJS()
      info.pdfjsStatus = {
        testResult: 'success',
        version: pdfjs.version,
        workerSrc: pdfjs.GlobalWorkerOptions?.workerSrc
      }
      console.log('✅ PDF.js测试成功')
    } catch (error) {
      console.error('❌ PDF.js测试失败:', error)
      info.pdfjsStatus = {
        testResult: 'failed',
        error: error.message,
        stack: error.stack
      }
    }

    setDebugInfo(info)
    setIsCollecting(false)
  }

  const copyDebugInfo = () => {
    if (!debugInfo) return
    
    const debugText = JSON.stringify(debugInfo, null, 2)
    navigator.clipboard?.writeText(debugText).then(() => {
      alert('✅ 调试信息已复制到剪贴板！')
    }).catch(() => {
      const textarea = document.createElement('textarea')
      textarea.value = debugText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('✅ 调试信息已复制到剪贴板！')
    })
  }

  useEffect(() => {
    collectDebugInfo()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🔧 调试测试页面
          </h1>
          
          <div className="flex gap-3 mb-4">
            <button
              onClick={collectDebugInfo}
              disabled={isCollecting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md"
            >
              {isCollecting ? '🔄 收集中...' : '🔄 重新收集'}
            </button>
            
            <button
              onClick={copyDebugInfo}
              disabled={!debugInfo}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
            >
              📋 复制调试信息
            </button>
          </div>

          {debugInfo && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold text-blue-800 mb-2">📊 基本信息</h3>
                <p><strong>时间:</strong> {debugInfo.timestamp}</p>
                <p><strong>URL:</strong> {debugInfo.url}</p>
                <p><strong>浏览器:</strong> {debugInfo.userAgent}</p>
              </div>

              {/* PDF.js状态 */}
              <div className="bg-yellow-50 p-4 rounded">
                <h3 className="font-semibold text-yellow-800 mb-2">📄 PDF.js 测试结果</h3>
                <div className="bg-white p-3 rounded">
                  <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo.pdfjsStatus, null, 2)}</pre>
                </div>
              </div>

              {/* 错误信息 */}
              {debugInfo.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded">
                  <h3 className="font-semibold text-red-800 mb-2">🚨 错误信息 ({debugInfo.errors.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {debugInfo.errors.map((error, index) => (
                      <div key={index} className="bg-white p-2 rounded text-sm">
                        <p><strong>错误:</strong> {error.message}</p>
                        <p><strong>时间:</strong> {error.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 完整JSON */}
              <div className="bg-gray-900 text-green-400 p-4 rounded">
                <h3 className="font-semibold text-white mb-2">📋 完整调试信息</h3>
                <div className="text-xs overflow-auto max-h-60">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}

          {isCollecting && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在收集调试信息...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}