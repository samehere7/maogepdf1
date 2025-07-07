'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface AnalysisErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AnalysisErrorPage({ error, reset }: AnalysisErrorPageProps) {
  React.useEffect(() => {
    // 记录分析页面特定的错误
    console.error('[Analysis Error] PDF分析页面错误:', error)
    
    // 保存错误到localStorage，标记为分析页面错误
    try {
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        type: 'analysis-page-error',
        context: 'PDF分析页面'
      }
      
      const existingErrors = JSON.parse(localStorage.getItem('pdf-error-log') || '[]')
      existingErrors.push(errorInfo)
      localStorage.setItem('pdf-error-log', JSON.stringify(existingErrors.slice(-10)))
      
      console.log('[Analysis Error] 分析页面错误已记录')
    } catch (logError) {
      console.error('[Analysis Error] 错误记录失败:', logError)
    }
  }, [error])

  const handleForceReload = () => {
    // 清除所有PDF相关的缓存
    try {
      // 清除SessionStorage中的PDF缓存
      const sessionKeys = Object.keys(sessionStorage)
      sessionKeys.forEach(key => {
        if (key.startsWith('pdf_') || key.startsWith('pdfjs') || key.startsWith('maoge')) {
          sessionStorage.removeItem(key)
        }
      })
      
      // 清除LocalStorage中的错误日志和PDF相关数据
      const localKeys = Object.keys(localStorage)
      localKeys.forEach(key => {
        if (key.startsWith('pdf-') || key.startsWith('flashcard') || key.startsWith('maoge')) {
          localStorage.removeItem(key)
        }
      })
      
      console.log('[Analysis Error] 已清除所有PDF相关缓存')
    } catch (e) {
      console.error('[Analysis Error] 清除缓存失败:', e)
    }
    
    // 强制刷新页面
    window.location.reload()
  }

  const handleSafeMode = () => {
    // 设置安全模式标志并重新加载
    try {
      localStorage.setItem('pdf-safe-mode', 'true')
      console.log('[Analysis Error] 已启用安全模式')
    } catch (e) {
      console.error('[Analysis Error] 设置安全模式失败:', e)
    }
    window.location.reload()
  }

  const handleOpenDebug = () => {
    // 打开调试页面
    const currentUrl = window.location.href
    const baseUrl = currentUrl.split('/analysis/')[0]
    const debugUrl = `${baseUrl}/pdf-debug`
    window.open(debugUrl, '_blank')
  }

  const handleGoHome = () => {
    const currentUrl = window.location.href
    const parts = currentUrl.split('/')
    const localeIndex = parts.findIndex(part => ['zh', 'en', 'ja', 'ko'].includes(part))
    const locale = localeIndex !== -1 ? parts[localeIndex] : 'zh'
    const baseUrl = parts.slice(0, 3).join('/')
    window.location.href = `${baseUrl}/${locale}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg mx-auto text-center p-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🚨</span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          PDF分析页面错误
        </h1>
        
        <p className="text-gray-600 mb-6">
          很抱歉，PDF分析页面遇到了一个客户端错误。这通常是由于浏览器兼容性或缓存问题引起的。
        </p>

        <div className="space-y-3 mb-6">
          <Button 
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            🔄 重试
          </Button>
          
          <Button 
            onClick={handleForceReload}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            🧹 清除缓存并重新加载
          </Button>
          
          <Button 
            onClick={handleSafeMode}
            variant="outline"
            className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            🛡️ 启用安全模式
          </Button>
          
          <Button 
            onClick={handleOpenDebug}
            variant="outline"
            className="w-full border-green-300 text-green-700 hover:bg-green-50"
          >
            🔍 打开诊断工具
          </Button>
          
          <Button 
            onClick={handleGoHome}
            variant="outline"
            className="w-full"
          >
            🏠 返回首页
          </Button>
        </div>

        {/* 错误详情 */}
        <details className="text-left bg-white rounded-lg p-4 border">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 mb-2">
            技术详情 (点击展开)
          </summary>
          <div className="text-xs space-y-2">
            <div>
              <strong className="text-red-600">错误类型:</strong>
              <div className="mt-1 text-gray-700 bg-red-50 p-2 rounded">
                {error.name || 'ClientSideError'}
              </div>
            </div>
            
            <div>
              <strong className="text-red-600">错误消息:</strong>
              <div className="mt-1 text-gray-700 bg-red-50 p-2 rounded">
                {error.message}
              </div>
            </div>
            
            {error.digest && (
              <div>
                <strong className="text-red-600">错误摘要:</strong>
                <div className="mt-1 text-gray-700 bg-red-50 p-2 rounded">
                  {error.digest}
                </div>
              </div>
            )}
            
            <div>
              <strong className="text-red-600">发生时间:</strong>
              <div className="mt-1 text-gray-700">
                {new Date().toLocaleString()}
              </div>
            </div>
            
            <div>
              <strong className="text-red-600">页面URL:</strong>
              <div className="mt-1 text-gray-700 break-all">
                {typeof window !== 'undefined' ? window.location.href : 'Unknown'}
              </div>
            </div>
          </div>
        </details>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="font-medium text-blue-800 mb-2">💡 推荐解决步骤：</div>
          <div className="text-blue-700 space-y-1 text-left">
            <div>1. 首先尝试"重试"按钮</div>
            <div>2. 如果问题持续，点击"清除缓存并重新加载"</div>
            <div>3. 仍有问题，尝试"启用安全模式"</div>
            <div>4. 使用"诊断工具"获取详细信息</div>
            <div>5. 最后可以"返回首页"重新开始</div>
          </div>
        </div>
      </div>
    </div>
  )
}