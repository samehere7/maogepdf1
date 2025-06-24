"use client"

import { useEffect, useState } from 'react'

export default function DebugTestPage() {
  const [status, setStatus] = useState<any>(null)
  const [redirectTest, setRedirectTest] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, redirectRes] = await Promise.all([
          fetch('/api/debug/live-status'),
          fetch('/api/debug/redirect-test?url=/')
        ])
        
        setStatus(await statusRes.json())
        setRedirectTest(await redirectRes.json())
      } catch (error) {
        console.error('Failed to fetch debug data:', error)
      }
      setLoading(false)
    }

    fetchData()
    // 每5秒刷新一次
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const testRootPath = () => {
    window.open('/', '_blank')
  }

  if (loading) return <div className="p-8">加载诊断数据...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 实时诊断面板</h1>
      
      <div className="grid gap-6">
        {/* 快速测试 */}
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-bold mb-2">快速测试</h2>
          <button 
            onClick={testRootPath}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            测试根路径 / (新窗口打开)
          </button>
        </div>

        {/* 服务器状态 */}
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-bold mb-2">🖥️ 服务器状态</h2>
          <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-auto">
            {JSON.stringify(status?.server_info, null, 2)}
          </pre>
        </div>

        {/* 中间件配置 */}
        <div className="bg-yellow-50 p-4 rounded">
          <h2 className="font-bold mb-2">⚙️ 中间件配置</h2>
          <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-auto">
            {JSON.stringify(status?.middleware_config, null, 2)}
          </pre>
        </div>

        {/* 重定向测试结果 */}
        <div className="bg-red-50 p-4 rounded">
          <h2 className="font-bold mb-2">🔄 重定向测试</h2>
          <div className="mb-2">
            <strong>状态:</strong> {redirectTest?.hasLoop ? '🚨 仍有循环' : '✅ 正常'}
          </div>
          <div className="mb-2">
            <strong>重定向次数:</strong> {redirectTest?.redirectCount}
          </div>
          <details>
            <summary className="cursor-pointer">查看详细重定向链</summary>
            <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-auto mt-2">
              {JSON.stringify(redirectTest?.analysis?.redirectChain, null, 2)}
            </pre>
          </details>
        </div>

        {/* 完整诊断数据 */}
        <details>
          <summary className="cursor-pointer font-bold">📋 完整诊断数据</summary>
          <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-auto mt-2">
            {JSON.stringify({ status, redirectTest }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}