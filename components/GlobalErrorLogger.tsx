"use client"

import { useEffect } from 'react'

interface ErrorInfo {
  message: string
  stack: string
  timestamp: string
  userAgent: string
  url: string
  type: 'error' | 'unhandledrejection' | 'react'
}

export default function GlobalErrorLogger() {
  useEffect(() => {
    const logError = (errorInfo: ErrorInfo) => {
      try {
        console.error('[GlobalErrorLogger] 捕获错误:', errorInfo)
        
        // 保存到localStorage
        const existingErrors = JSON.parse(localStorage.getItem('pdf-error-log') || '[]')
        existingErrors.push(errorInfo)
        
        // 只保留最近20个错误，避免存储过多
        const recentErrors = existingErrors.slice(-20)
        localStorage.setItem('pdf-error-log', JSON.stringify(recentErrors))
        
        // 如果是PDF相关错误，额外标记
        if (errorInfo.message.toLowerCase().includes('pdf') || 
            errorInfo.stack.toLowerCase().includes('pdf') ||
            errorInfo.url.includes('analysis')) {
          console.error('[PDF错误] 检测到PDF相关错误:', errorInfo.message)
          
          // 在页面上显示错误通知（可选）
          if (typeof window !== 'undefined') {
            // 创建错误通知
            const notification = document.createElement('div')
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #fee2e2;
              color: #dc2626;
              padding: 12px 16px;
              border-radius: 6px;
              border: 1px solid #fecaca;
              z-index: 10000;
              max-width: 300px;
              font-size: 14px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            `
            notification.innerHTML = `
              <div style="font-weight: 600; margin-bottom: 4px;">PDF错误检测</div>
              <div style="font-size: 12px; opacity: 0.8;">${errorInfo.message.slice(0, 100)}...</div>
            `
            
            document.body.appendChild(notification)
            
            // 5秒后自动移除
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification)
              }
            }, 5000)
          }
        }
        
      } catch (loggerError) {
        console.error('[GlobalErrorLogger] 记录错误失败:', loggerError)
      }
    }

    // 全局JavaScript错误监听
    const handleError = (event: ErrorEvent) => {
      const errorInfo: ErrorInfo = {
        message: event.message || 'Unknown error',
        stack: event.error?.stack || 'No stack trace available',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: event.filename || window.location.href,
        type: 'error'
      }
      
      logError(errorInfo)
    }

    // Promise rejection监听
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo: ErrorInfo = {
        message: `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
        stack: event.reason?.stack || String(event.reason),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        type: 'unhandledrejection'
      }
      
      logError(errorInfo)
    }

    // React错误边界无法捕获的错误
    const handleResourceError = (event: Event) => {
      const target = event.target as any
      if (target && target.tagName) {
        const errorInfo: ErrorInfo = {
          message: `Resource loading error: ${target.tagName} ${target.src || target.href || ''}`,
          stack: 'Resource loading error',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          type: 'error'
        }
        
        logError(errorInfo)
      }
    }

    // 添加事件监听器
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleResourceError, true) // 捕获阶段

    // 清理函数
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleResourceError, true)
    }
  }, [])

  // 这个组件不渲染任何UI
  return null
}

// 导出一个函数来手动记录错误
export const logManualError = (error: Error, context: string = '') => {
  const errorInfo: ErrorInfo = {
    message: `${context ? context + ': ' : ''}${error.message}`,
    stack: error.stack || 'No stack trace available',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    type: 'react'
  }
  
  try {
    const existingErrors = JSON.parse(localStorage.getItem('pdf-error-log') || '[]')
    existingErrors.push(errorInfo)
    localStorage.setItem('pdf-error-log', JSON.stringify(existingErrors.slice(-20)))
    console.error('[手动记录错误]', errorInfo)
  } catch (loggerError) {
    console.error('[错误记录失败]', loggerError)
  }
}