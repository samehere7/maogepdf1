"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class DebugErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.group('🚨 [React错误边界] 捕获到组件错误')
    console.error('错误对象:', error)
    console.error('错误消息:', error.message)
    console.error('错误堆栈:', error.stack)
    console.error('组件堆栈:', errorInfo.componentStack)
    console.error('时间戳:', new Date().toISOString())
    if (typeof window !== 'undefined') {
      console.error('当前URL:', window.location.href)
      console.error('用户代理:', navigator.userAgent)
    }
    console.groupEnd()

    this.setState({ error, errorInfo })
    
    // 调用回调函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 在开发环境中显示详细错误信息
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      }
      
      console.warn('🔧 [调试信息] 错误详情已记录到 window.__debugErrors')
      
      // 将错误信息保存到全局对象，方便调试
      if (!window.__debugErrors) {
        window.__debugErrors = []
      }
      window.__debugErrors.push(errorDetails)
    }
  }

  render() {
    if (this.state.hasError) {
      // 自定义错误UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  应用遇到了问题
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                页面加载时发生了错误。我们已经记录了这个问题。
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer mb-2">
                  查看错误详情 (开发模式)
                </summary>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-40">
                  <div className="text-red-600 mb-2">
                    <strong>错误:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div className="text-gray-800">
                      <strong>堆栈:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                刷新页面
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined })
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
              >
                重试
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-xs text-gray-500 text-center">
                错误信息已保存到浏览器控制台和 window.__debugErrors
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 扩展Window接口以包含调试信息
declare global {
  interface Window {
    __debugErrors?: Array<{
      message: string
      stack?: string
      componentStack: string
      timestamp: string
    }>
  }
}