"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Copy, X, ChevronDown, ChevronUp } from 'lucide-react'

interface ErrorInfo {
  message: string
  stack: string
  timestamp: string
  userAgent: string
  url: string
}

interface InlineDebugPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function InlineDebugPanel({ isOpen, onClose }: InlineDebugPanelProps) {
  const [errors, setErrors] = useState<ErrorInfo[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    if (!isOpen) return

    // 收集错误信息
    const collectErrors = () => {
      try {
        const savedErrors = JSON.parse(localStorage.getItem('pdf-error-log') || '[]')
        setErrors(savedErrors)
      } catch (error) {
        console.error('Failed to load error log:', error)
      }
    }

    // 收集基本调试信息
    const collectDebugInfo = async () => {
      try {
        // 检查PDF.js
        let pdfJsStatus = 'Not loaded'
        try {
          const pdfjs = await import('pdfjs-dist')
          pdfJsStatus = `v${pdfjs.version}`
        } catch (error) {
          pdfJsStatus = 'Failed to load'
        }

        // 检查基本功能
        const canvas = document.createElement('canvas')
        const canvasSupport = !!canvas.getContext('2d')
        const webGLSupport = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))

        const info = {
          pdfJs: pdfJsStatus,
          browser: navigator.userAgent,
          canvas: canvasSupport,
          webGL: webGLSupport,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          devicePixelRatio: window.devicePixelRatio,
          timestamp: new Date().toISOString()
        }

        setDebugInfo(info)
      } catch (error) {
        console.error('Failed to collect debug info:', error)
      }
    }

    collectErrors()
    collectDebugInfo()

    // 监听新错误
    const handleError = (event: ErrorEvent) => {
      const errorInfo: ErrorInfo = {
        message: event.message,
        stack: event.error?.stack || 'No stack trace',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      
      setErrors(prev => [...prev, errorInfo].slice(-5)) // 只保留最近5个
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [isOpen])

  const copyToClipboard = () => {
    const report = {
      errors,
      debugInfo,
      timestamp: new Date().toISOString()
    }
    
    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
      alert('调试信息已复制到剪贴板！')
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            PDF 调试信息
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 内容 */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* 快速状态 */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">快速状态检查</h4>
            {debugInfo && (
              <div className="text-sm space-y-1">
                <div>PDF.js: <span className={debugInfo.pdfJs.includes('v') ? 'text-green-600' : 'text-red-600'}>{debugInfo.pdfJs}</span></div>
                <div>Canvas: <span className={debugInfo.canvas ? 'text-green-600' : 'text-red-600'}>{debugInfo.canvas ? '支持' : '不支持'}</span></div>
                <div>WebGL: <span className={debugInfo.webGL ? 'text-green-600' : 'text-red-600'}>{debugInfo.webGL ? '支持' : '不支持'}</span></div>
                <div>视口: {debugInfo.viewport}</div>
              </div>
            )}
          </div>

          {/* 错误日志 */}
          <div className="mb-4">
            <div 
              className="flex items-center justify-between cursor-pointer p-2 bg-red-50 rounded"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <h4 className="font-medium text-red-700">
                检测到的错误 ({errors.length})
              </h4>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            
            {isExpanded && (
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {errors.length === 0 ? (
                  <p className="text-green-600 text-sm">暂无错误记录</p>
                ) : (
                  errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 border-l-4 border-red-500 text-sm">
                      <div className="font-medium text-red-800">{error.message}</div>
                      <div className="text-xs text-gray-600 mt-1">{error.timestamp}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 浏览器信息 */}
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <h4 className="font-medium mb-2">浏览器信息</h4>
            <div className="text-xs text-gray-600 break-all">
              {debugInfo?.browser}
            </div>
          </div>

          {/* 操作建议 */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-medium text-yellow-800 mb-2">故障排除建议：</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 尝试刷新页面</li>
              <li>• 清除浏览器缓存</li>
              <li>• 检查网络连接</li>
              <li>• 尝试使用其他浏览器</li>
              <li>• 复制调试信息发送给技术支持</li>
            </ul>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            复制调试信息
          </Button>
          <Button onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  )
}