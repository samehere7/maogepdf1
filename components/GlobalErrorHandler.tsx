"use client"

import { useEffect } from 'react'

interface ErrorInfo {
  error: Error
  stack?: string
  componentStack?: string
  timestamp: string
  userAgent: string
  url: string
}

export default function GlobalErrorHandler() {
  useEffect(() => {
    // 确保在客户端环境中运行
    if (typeof window === 'undefined') return

    const logError = (errorInfo: ErrorInfo) => {
      console.group(`🚨 [全局错误捕获] ${errorInfo.timestamp}`)
      console.error('错误对象:', errorInfo.error)
      console.error('错误消息:', errorInfo.error.message)
      console.error('错误堆栈:', errorInfo.stack)
      console.error('用户代理:', errorInfo.userAgent)
      console.error('当前URL:', errorInfo.url)
      if (errorInfo.componentStack) {
        console.error('组件堆栈:', errorInfo.componentStack)
      }
      console.groupEnd()

      // 在开发环境中显示详细信息
      if (process.env.NODE_ENV === 'development') {
        // 创建一个视觉错误提示
        const errorDiv = document.createElement('div')
        errorDiv.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          background: #ff4444;
          color: white;
          padding: 10px;
          border-radius: 5px;
          z-index: 10000;
          max-width: 400px;
          font-family: monospace;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `
        errorDiv.innerHTML = `
          <strong>客户端错误:</strong><br/>
          ${errorInfo.error.message}<br/>
          <small>${errorInfo.timestamp}</small>
          <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; cursor: pointer;">×</button>
        `
        document.body.appendChild(errorDiv)
        
        // 5秒后自动移除
        setTimeout(() => {
          if (errorDiv.parentElement) {
            errorDiv.parentElement.removeChild(errorDiv)
          }
        }, 5000)
      }
    }

    // 捕获JavaScript运行时错误
    const handleError = (event: ErrorEvent) => {
      const errorInfo: ErrorInfo = {
        error: event.error || new Error(event.message),
        stack: event.error?.stack || event.filename + ':' + event.lineno + ':' + event.colno,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      logError(errorInfo)
    }

    // 捕获Promise未处理的拒绝
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      const errorInfo: ErrorInfo = {
        error,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      logError(errorInfo)
    }

    // 监听错误事件
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    console.log('🔍 [全局错误处理器] 已启动，监听客户端异常...')

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      console.log('🔍 [全局错误处理器] 已清理')
    }
  }, [])

  return null // 这个组件不渲染任何内容
}