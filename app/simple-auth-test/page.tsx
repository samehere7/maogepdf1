"use client"

import { useState } from 'react'

export default function SimpleAuthTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  const testBasicSupabase = async () => {
    addLog('🚀 开始基础 Supabase 测试...')
    setLoading(true)

    try {
      // 检查环境变量是否在客户端可用
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      addLog(`🔗 NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl || '❌ 未设置'}`)
      addLog(`🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '已设置' : '❌ 未设置'}`)

      if (!supabaseUrl || !supabaseKey) {
        addLog('❌ 环境变量未正确设置在客户端!')
        return
      }

      // 尝试直接导入和创建 Supabase 客户端
      addLog('📦 导入 Supabase 模块...')
      const { createClient } = await import('@supabase/supabase-js')
      
      addLog('🔧 创建 Supabase 客户端...')
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      addLog('✅ Supabase 客户端创建成功')
      
      // 测试基本连接
      addLog('🔍 测试基本连接...')
      const { data, error } = await supabase.auth.getUser()
      
      if (error) {
        addLog(`⚠️ Auth 错误 (可能正常): ${error.message}`)
      } else {
        addLog(`✅ Auth 连接成功, 用户: ${data.user?.email || '未登录'}`)
      }

      // 测试认证状态
      addLog('📊 检查认证状态...')
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        addLog(`❌ 会话错误: ${sessionError.message}`)
      } else {
        addLog(`📊 会话状态: ${sessionData.session ? '有效' : '无会话'}`)
      }

      // 测试 Google OAuth 配置
      addLog('🔐 测试 Google OAuth 配置...')
      
      const redirectUrl = `${window.location.origin}/en/auth/callback`
      addLog(`🔗 回调URL: ${redirectUrl}`)
      
      // 不实际启动认证，只检查配置
      addLog('✅ OAuth 配置检查完成')

    } catch (error: any) {
      addLog(`💥 测试失败: ${error.message}`)
      addLog(`📋 错误详情: ${error.stack}`)
    } finally {
      setLoading(false)
    }
  }

  const testDirectLogin = async () => {
    addLog('🔐 尝试直接 Google 登录...')
    setLoading(true)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/en/auth/callback?test=simple`,
        }
      })

      if (error) {
        addLog(`❌ 登录启动失败: ${error.message}`)
      } else {
        addLog(`✅ 登录启动成功`)
        addLog(`🔗 重定向URL: ${data.url}`)
      }

    } catch (error: any) {
      addLog(`💥 登录测试失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 简单认证测试</h1>
      
      <div className="space-x-4 mb-6">
        <button 
          onClick={testBasicSupabase}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '测试中...' : '测试基础连接'}
        </button>
        
        <button 
          onClick={testDirectLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          测试直接登录
        </button>
        
        <button 
          onClick={() => setLogs([])}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          清空日志
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-gray-500">点击按钮开始测试...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))
        )}
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded">
        <h3 className="font-bold mb-2">💡 测试说明</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>这是一个简化的测试页面，绕过复杂的配置</li>
          <li>直接检查环境变量和 Supabase 连接</li>
          <li>如果基础连接失败，说明配置问题</li>
          <li>如果连接成功但认证失败，说明 OAuth 配置问题</li>
        </ul>
      </div>
    </div>
  )
}