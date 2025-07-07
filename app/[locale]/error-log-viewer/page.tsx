'use client'

import { useEffect, useState } from 'react'

export default function ErrorLogViewerPage() {
  const [errorLogs, setErrorLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 读取localStorage中的错误日志
    try {
      const logs = localStorage.getItem('pdf-error-log')
      if (logs) {
        const parsedLogs = JSON.parse(logs)
        setErrorLogs(parsedLogs)
        console.log('读取到错误日志:', parsedLogs)
      } else {
        console.log('没有找到错误日志')
      }
    } catch (error) {
      console.error('读取错误日志失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearLogs = () => {
    localStorage.removeItem('pdf-error-log')
    setErrorLogs([])
    alert('错误日志已清除')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板')
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p>正在读取错误日志...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-red-600">🚨 PDF错误日志查看器</h1>
            <button
              onClick={clearLogs}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              清除日志
            </button>
          </div>

          {errorLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-gray-600">没有发现错误日志，这是好消息！</p>
              <p className="text-gray-500 text-sm mt-2">如果PDF出现错误，错误信息会自动记录在这里</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-800 mb-2">⚠️ 发现 {errorLogs.length} 个错误</h3>
                <p className="text-yellow-700 text-sm">
                  这些错误是由ErrorBoundary自动捕获的。最新的错误在上方。
                </p>
              </div>

              {errorLogs.reverse().map((log, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-red-800">
                      错误 #{errorLogs.length - index} - {new Date(log.timestamp).toLocaleString()}
                    </h3>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      复制详情
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-red-700 mb-1">错误信息:</h4>
                      <p className="text-red-600 bg-white p-2 rounded border">
                        {log.message}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-700 mb-1">发生位置:</h4>
                      <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                        {log.url}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-700 mb-1">用户代理:</h4>
                      <p className="text-xs text-gray-600 bg-white p-2 rounded border">
                        {log.userAgent}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-red-700 mb-1">屏幕尺寸:</h4>
                      <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                        {log.viewport?.width} x {log.viewport?.height}
                      </p>
                    </div>

                    {log.stack && (
                      <div>
                        <h4 className="font-medium text-red-700 mb-1">堆栈跟踪:</h4>
                        <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
                          {log.stack}
                        </pre>
                      </div>
                    )}

                    {log.componentStack && (
                      <div>
                        <h4 className="font-medium text-red-700 mb-1">组件堆栈:</h4>
                        <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
                          {log.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">💡 使用说明</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• 当PDF查看器出现错误时，错误会自动记录到这里</li>
              <li>• 点击"复制详情"可以复制完整的错误信息</li>
              <li>• 将复制的信息发送给技术支持以获得帮助</li>
              <li>• 点击"清除日志"可以删除所有记录的错误</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}