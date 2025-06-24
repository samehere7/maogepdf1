"use client"

import { useEffect, useState } from 'react'

export default function QuickFixPage() {
  const [authConfig, setAuthConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/debug/auth-config')
        const data = await response.json()
        setAuthConfig(data)
      } catch (error) {
        console.error('Failed to fetch auth config:', error)
      }
      setLoading(false)
    }

    fetchConfig()
  }, [])

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔧 认证问题快速诊断</h1>
        <div>加载诊断信息...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 认证问题快速诊断</h1>
      
      {/* 环境变量状态 */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h2 className="font-bold mb-2">📊 环境变量状态</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Supabase URL:</strong> {authConfig?.supabase_config?.url}
          </div>
          <div>
            <strong>Supabase Key:</strong> {authConfig?.supabase_config?.anon_key}
          </div>
          <div>
            <strong>Google Client ID:</strong> {authConfig?.google_config?.client_id}
          </div>
          <div>
            <strong>Google Secret:</strong> {authConfig?.google_config?.client_secret}
          </div>
        </div>
      </div>

      {/* 当前请求信息 */}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h2 className="font-bold mb-2">🌐 当前请求信息</h2>
        <div className="text-sm">
          <div><strong>域名:</strong> {authConfig?.request_info?.host}</div>
          <div><strong>协议:</strong> {authConfig?.request_info?.protocol}</div>
          <div><strong>完整URL:</strong> {authConfig?.request_info?.full_url}</div>
        </div>
      </div>

      {/* 可能的问题 */}
      <div className="mb-6 p-4 bg-red-50 rounded">
        <h2 className="font-bold mb-2">🚨 可能的问题</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          {authConfig?.likely_issues?.map((issue: string, index: number) => (
            <li key={index} className="text-red-700">{issue}</li>
          ))}
        </ul>
      </div>

      {/* 快速修复步骤 */}
      <div className="mb-6 p-4 bg-green-50 rounded">
        <h2 className="font-bold mb-2">✅ 快速修复步骤</h2>
        <ol className="list-decimal list-inside text-sm space-y-2">
          {authConfig?.quick_fixes?.map((fix: string, index: number) => (
            <li key={index} className="text-green-700">{fix}</li>
          ))}
        </ol>
      </div>

      {/* 期望的回调URL */}
      <div className="mb-6 p-4 bg-yellow-50 rounded">
        <h2 className="font-bold mb-2">🔗 期望的回调URL</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          {authConfig?.expected_callback_urls?.map((url: string, index: number) => (
            <li key={index} className="font-mono">{url}</li>
          ))}
        </ul>
      </div>

      {/* 完整配置 */}
      <details className="mb-6">
        <summary className="font-bold cursor-pointer">📋 完整诊断数据</summary>
        <pre className="text-xs bg-black text-green-400 p-4 rounded mt-2 overflow-auto">
          {JSON.stringify(authConfig, null, 2)}
        </pre>
      </details>

      {/* 测试按钮 */}
      <div className="space-y-2">
        <button 
          onClick={() => window.open('/en/auth/login', '_blank')}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          测试英文登录
        </button>
        <button 
          onClick={() => window.open('/zh/auth/login', '_blank')}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          测试中文登录
        </button>
      </div>
    </div>
  )
}