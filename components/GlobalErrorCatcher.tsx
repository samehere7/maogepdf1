'use client'

import { useEffect } from 'react'

interface ErrorInfo {
  message: string
  source?: string
  line?: number
  column?: number
  stack?: string
  timestamp: string
  url: string
  userAgent: string
}

export default function GlobalErrorCatcher() {
  useEffect(() => {
    console.log('🔍 GlobalErrorCatcher 已启动')
    
    // 捕获所有JavaScript错误
    const handleError = (event: ErrorEvent) => {
      const errorInfo: ErrorInfo = {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      
      console.error('🚨 GlobalErrorCatcher - JavaScript错误:', errorInfo)
      
      // 发送到控制台，方便用户复制
      console.group('📋 错误详细信息 (请复制此内容)')
      console.log('错误信息:', errorInfo.message)
      console.log('发生位置:', errorInfo.source)
      console.log('行号:', errorInfo.line)
      console.log('列号:', errorInfo.column)
      console.log('堆栈跟踪:', errorInfo.stack)
      console.log('完整错误对象:', JSON.stringify(errorInfo, null, 2))
      console.groupEnd()
      
      // 尝试发送错误到API（如果需要）
      try {
        fetch('/api/debug/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorInfo)
        }).catch(() => {
          // 忽略发送失败
        })
      } catch (e) {
        // 忽略
      }
    }

    // 捕获Promise拒绝
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo: ErrorInfo = {
        message: `Promise拒绝: ${String(event.reason)}`,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      
      console.error('🚨 GlobalErrorCatcher - Promise拒绝:', errorInfo)
      
      console.group('📋 Promise错误详细信息 (请复制此内容)')
      console.log('错误原因:', event.reason)
      console.log('堆栈跟踪:', event.reason?.stack)
      console.log('完整错误对象:', JSON.stringify(errorInfo, null, 2))
      console.groupEnd()
    }

    // React错误边界无法捕获的错误类型
    const originalConsoleError = console.error
    console.error = (...args) => {
      // 检查是否是React错误
      const message = args.join(' ')
      if (message.includes('client-side exception') || 
          message.includes('Application error') ||
          message.includes('ChunkLoadError') ||
          message.includes('Loading chunk') ||
          message.includes('PDF') ||
          message.includes('Worker')) {
        
        console.group('🚨 检测到关键错误 (请复制此内容)')
        console.log('错误参数:', args)
        console.log('错误时间:', new Date().toISOString())
        console.log('当前页面:', window.location.href)
        console.log('用户代理:', navigator.userAgent)
        
        // 尝试获取更多上下文
        if (typeof window !== 'undefined') {
          console.log('页面加载状态:', document.readyState)
          console.log('性能信息:', performance.now())
          if ((performance as any).memory) {
            console.log('内存使用:', {
              used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB',
              total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024) + 'MB'
            })
          }
        }
        console.groupEnd()
      }
      
      // 调用原始console.error
      originalConsoleError(...args)
    }

    // 添加事件监听器
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // 监控网络请求错误
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        // 记录失败的请求
        if (!response.ok) {
          console.warn('🌐 网络请求失败:', {
            url: typeof args[0] === 'string' ? args[0] : args[0].url,
            status: response.status,
            statusText: response.statusText
          })
        }
        
        return response
      } catch (error) {
        console.error('🌐 网络请求异常:', {
          url: typeof args[0] === 'string' ? args[0] : args[0].url,
          error: String(error)
        })
        throw error
      }
    }

    console.log('✅ GlobalErrorCatcher 初始化完成')

    // 清理函数
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      console.error = originalConsoleError
      window.fetch = originalFetch
      console.log('🔍 GlobalErrorCatcher 已清理')
    }
  }, [])

  return null // 这个组件不渲染任何UI
}