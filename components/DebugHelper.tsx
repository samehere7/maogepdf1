"use client"

import { useEffect, useState } from 'react'

interface DebugInfo {
  userAgent: string
  url: string
  timestamp: string
  viewport: { width: number; height: number }
  errors: any[]
  localStorage: { [key: string]: string }
  pdfjsStatus?: any
}

export default function DebugHelper() {
  const [isOpen, setIsOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)

  const collectDebugInfo = () => {
    if (typeof window === 'undefined') return

    const info: DebugInfo = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      errors: (window as any).__debugErrors || [],
      localStorage: {}
    }

    // 收集localStorage信息（安全地）
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && !key.includes('secret') && !key.includes('token')) {
          const value = localStorage.getItem(key)
          if (value && value.length < 200) { // 只收集短的值
            info.localStorage[key] = value
          } else {
            info.localStorage[key] = `[长度: ${value?.length || 0}]`
          }
        }
      }
    } catch (e) {
      info.localStorage = { error: '无法访问localStorage' }
    }

    // 收集PDF.js状态
    try {
      const getPDFJSStatus = (window as any).getPDFJSStatus
      if (typeof getPDFJSStatus === 'function') {
        info.pdfjsStatus = getPDFJSStatus()
      }
    } catch (e) {
      info.pdfjsStatus = { error: 'PDF.js状态获取失败' }
    }

    setDebugInfo(info)
  }

  const copyToClipboard = () => {
    if (!debugInfo) return
    
    const debugText = JSON.stringify(debugInfo, null, 2)
    navigator.clipboard?.writeText(debugText).then(() => {
      alert('调试信息已复制到剪贴板')
    }).catch(() => {
      // 创建一个临时文本区域用于复制
      const textarea = document.createElement('textarea')
      textarea.value = debugText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('调试信息已复制到剪贴板')
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 开发环境中添加快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setIsOpen(true)
        collectDebugInfo()
      }
    }

    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('keydown', handleKeyDown)
      console.log('🔧 [调试助手] 按 Ctrl+Shift+D 打开调试面板')
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (!isOpen || typeof window === 'undefined') return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">🔧 调试信息面板</h2>
          <div className="flex gap-2">
            <button
              onClick={collectDebugInfo}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              刷新
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!debugInfo}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
            >
              复制
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              关闭
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {debugInfo ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">🌐 环境信息</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p><strong>时间:</strong> {debugInfo.timestamp}</p>
                  <p><strong>URL:</strong> {debugInfo.url}</p>
                  <p><strong>视窗:</strong> {debugInfo.viewport.width} × {debugInfo.viewport.height}</p>
                  <p><strong>用户代理:</strong> {debugInfo.userAgent}</p>
                </div>
              </div>

              {debugInfo.errors.length > 0 && (
                <div>
                  <h3 className="font-medium text-red-600 mb-2">🚨 错误记录 ({debugInfo.errors.length})</h3>
                  <div className="bg-red-50 p-3 rounded text-sm max-h-40 overflow-auto">
                    {debugInfo.errors.map((error, index) => (
                      <div key={index} className="mb-2 pb-2 border-b border-red-200 last:border-b-0">
                        <p><strong>消息:</strong> {error.message}</p>
                        <p><strong>时间:</strong> {error.timestamp}</p>
                        {error.stack && <details><summary>堆栈</summary><pre className="text-xs mt-1">{error.stack}</pre></details>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {debugInfo.pdfjsStatus && (
                <div>
                  <h3 className="font-medium text-blue-600 mb-2">📄 PDF.js 状态</h3>
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <pre>{JSON.stringify(debugInfo.pdfjsStatus, null, 2)}</pre>
                  </div>
                </div>
              )}

              {Object.keys(debugInfo.localStorage).length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">💾 本地存储</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm max-h-40 overflow-auto">
                    {Object.entries(debugInfo.localStorage).map(([key, value]) => (
                      <div key={key} className="mb-1">
                        <strong>{key}:</strong> {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-900 mb-2">📋 完整JSON</h3>
                <div className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto max-h-60">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">点击"刷新"收集调试信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}