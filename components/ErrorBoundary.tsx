"use client"

import React from 'react'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] 捕获到错误:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // 发送错误信息到调试系统
    this.logErrorToDebugSystem(error, errorInfo)
  }

  logErrorToDebugSystem = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }

      // 保存到localStorage，供调试页面读取
      const existingErrors = JSON.parse(localStorage.getItem('pdf-error-log') || '[]')
      existingErrors.push(errorData)
      localStorage.setItem('pdf-error-log', JSON.stringify(existingErrors.slice(-10))) // 只保留最近10个错误

      console.log('[ErrorBoundary] 错误已记录到本地存储')
    } catch (logError) {
      console.error('[ErrorBoundary] 记录错误失败:', logError)
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  openDebugPage = () => {
    // 获取当前locale
    const pathSegments = window.location.pathname.split('/').filter(Boolean)
    const locale = pathSegments[0] || 'zh'
    window.open(`/${locale}/pdf-debug`, '_blank')
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.retry} />
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              PDF查看器遇到问题
            </h2>
            
            <p className="text-gray-600 mb-6">
              抱歉，PDF查看器出现了客户端异常。错误信息已自动记录。
            </p>

            <div className="space-y-3">
              <Button 
                onClick={this.retry}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重新加载
              </Button>
              
              <Button 
                onClick={this.openDebugPage}
                variant="outline"
                className="w-full"
              >
                <Bug className="h-4 w-4 mr-2" />
                打开调试工具
              </Button>
            </div>

            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  查看技术详情
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                  <div className="font-medium text-red-600 mb-2">错误信息：</div>
                  <div className="mb-2">{this.state.error.message}</div>
                  
                  {this.state.error.stack && (
                    <>
                      <div className="font-medium text-red-600 mb-2">堆栈跟踪：</div>
                      <pre className="overflow-x-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary