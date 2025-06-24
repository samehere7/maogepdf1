"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestAuthPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testGoogleAuth = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      console.log('开始测试 Google 认证...')
      
      // 测试 Supabase 连接
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('当前会话:', session, sessionError)

      // 尝试启动 Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/en/auth/callback?redirectedFrom=/en`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      console.log('OAuth 响应:', { data, error })

      setTestResult({
        success: !error,
        error: error?.message,
        data: data,
        redirectTo: `${window.location.origin}/en/auth/callback?redirectedFrom=/en`,
        timestamp: new Date().toISOString()
      })

      if (error) {
        console.error('OAuth 错误:', error)
      } else {
        console.log('OAuth 启动成功，应该会重定向...')
      }

    } catch (err) {
      console.error('测试失败:', err)
      setTestResult({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      })
    }

    setLoading(false)
  }

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      console.log('Supabase 连接测试:', { data, error })
      
      setTestResult({
        type: 'connection_test',
        success: !error,
        session: data.session,
        error: error?.message,
        supabase_url: supabase.supabaseUrl,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      console.error('连接测试失败:', err)
      setTestResult({
        type: 'connection_test',
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 认证流程测试</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={checkSupabaseConnection}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          测试 Supabase 连接
        </button>
        
        <button 
          onClick={testGoogleAuth}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? '测试中...' : '测试 Google 认证'}
        </button>
      </div>

      {testResult && (
        <div className="p-4 bg-gray-50 rounded">
          <h2 className="font-bold mb-2">测试结果</h2>
          <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-bold mb-2">💡 使用说明</h3>
        <ul className="text-sm space-y-1">
          <li>1. 先点击"测试 Supabase 连接"确认基本连接正常</li>
          <li>2. 然后点击"测试 Google 认证"启动认证流程</li>
          <li>3. 如果成功，页面会重定向到 Google 认证</li>
          <li>4. 完成认证后应该回到生产域名而不是 localhost</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">🔧 当前配置</h3>
        <div className="text-sm">
          <div><strong>Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</div>
          <div><strong>预期回调:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/en/auth/callback` : 'N/A'}</div>
        </div>
      </div>
    </div>
  )
}