'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  React.useEffect(() => {
    // 记录详细错误信息
    console.error('[App Error Boundary] 应用级错误:', error)
    
    // 保存错误到localStorage
    try {
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        type: 'app-level-error'
      }
      
      const existingErrors = JSON.parse(localStorage.getItem('pdf-error-log') || '[]')
      existingErrors.push(errorInfo)
      localStorage.setItem('pdf-error-log', JSON.stringify(existingErrors.slice(-10)))
      
      console.log('[App Error] 错误已保存到本地存储')
    } catch (logError) {
      console.error('[App Error] 保存错误失败:', logError)
    }
  }, [error])

  const openDebugPage = () => {
    // 在新窗口打开调试页面
    window.open('/zh/pdf-debug', '_blank')
  }

  const forceReload = () => {
    // 清除所有本地状态并重新加载
    try {
      sessionStorage.clear()
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('pdf_') || key.startsWith('nextauth')) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.error('清除存储失败:', e)
    }
    
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          应用遇到错误
        </h1>
        
        <p className="text-gray-600 mb-6">
          很抱歉，应用程序遇到了一个意外错误。错误信息已自动记录。
        </p>

        <div className="space-y-3 mb-6">
          <Button 
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            🔄 重试
          </Button>
          
          <Button 
            onClick={forceReload}
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
          >
            🔧 强制重新加载
          </Button>
          
          <Button 
            onClick={openDebugPage}
            variant="outline"
            className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            🔍 打开调试工具
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/zh'}
            variant="outline"
            className="w-full"
          >
            🏠 返回首页
          </Button>
        </div>

        {/* 错误详情 */}
        <details className="text-left">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-2">
            查看错误详情
          </summary>
          <div className="text-xs bg-gray-100 rounded p-3 space-y-2">
            <div>
              <strong>错误消息:</strong>
              <div className="mt-1 text-red-600">{error.message}</div>
            </div>
            
            {error.digest && (
              <div>
                <strong>错误摘要:</strong>
                <div className="mt-1 text-gray-600">{error.digest}</div>
              </div>
            )}
            
            {error.stack && (
              <div>
                <strong>堆栈跟踪:</strong>
                <pre className="mt-1 text-xs overflow-x-auto bg-gray-200 p-2 rounded">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        </details>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-medium text-blue-800 mb-1">💡 常见解决方案：</div>
          <div className="text-blue-700 space-y-1">
            <div>• 刷新页面重试</div>
            <div>• 清除浏览器缓存和数据</div>
            <div>• 使用最新版本的现代浏览器</div>
            <div>• 检查网络连接</div>
            <div>• 联系技术支持并提供错误详情</div>
          </div>
        </div>
      </div>
    </div>
  )
}