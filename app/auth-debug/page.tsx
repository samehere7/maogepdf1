"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthDebugPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<string[]>([])
  const [authState, setAuthState] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>({})

  // 持久化日志到 localStorage
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    
    // 更新状态
    setLogs(prev => {
      const newLogs = [...prev, logMessage]
      // 同时保存到 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-debug-logs', JSON.stringify(newLogs))
      }
      return newLogs
    })
  }

  // 从 localStorage 恢复日志
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLogs = localStorage.getItem('auth-debug-logs')
      if (savedLogs) {
        try {
          const parsedLogs = JSON.parse(savedLogs)
          setLogs(parsedLogs)
          addLog('🔄 已恢复之前的调试日志')
        } catch (e) {
          addLog('⚠️ 日志恢复失败，重新开始')
        }
      }
    }
  }, [])

  const clearLogs = () => {
    setLogs([])
    setTestResults({})
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-debug-logs')
    }
  }

  useEffect(() => {
    addLog('🚀 认证调试页面加载完成')
    
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`🔄 认证状态变化: ${event}`)
      if (session) {
        addLog(`👤 用户: ${session.user?.email}`)
        setAuthState({ event, user: session.user })
      } else {
        addLog('❌ 无会话')
        setAuthState({ event, user: null })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const testSupabaseConnection = async () => {
    addLog('🔍 测试 Supabase 连接...')
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        addLog(`❌ Supabase 连接错误: ${error.message}`)
        setTestResults(prev => ({ ...prev, connection: { success: false, error: error.message } }))
      } else {
        addLog(`✅ Supabase 连接成功`)
        addLog(`📊 当前会话: ${data.session ? '有效' : '无效'}`)
        if (data.session) {
          addLog(`👤 当前用户: ${data.session.user?.email}`)
        }
        setTestResults(prev => ({ ...prev, connection: { success: true, session: !!data.session, user: data.session?.user } }))
      }
    } catch (err: any) {
      addLog(`💥 Supabase 连接异常: ${err.message}`)
      setTestResults(prev => ({ ...prev, connection: { success: false, error: err.message } }))
    }
  }

  const testGoogleAuth = async () => {
    addLog('🔐 开始 Google 认证测试...')
    setIsLoading(true)
    
    try {
      const redirectTo = `${window.location.origin}/en/auth/callback?redirectedFrom=/auth-debug`
      addLog(`🔗 重定向URL: ${redirectTo}`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        addLog(`❌ Google 认证启动失败: ${error.message}`)
        setTestResults(prev => ({ ...prev, googleAuth: { success: false, error: error.message } }))
      } else {
        addLog(`✅ Google 认证启动成功`)
        addLog(`📝 认证数据: ${JSON.stringify(data)}`)
        setTestResults(prev => ({ ...prev, googleAuth: { success: true, data } }))
        // 不会执行到这里，因为会重定向到 Google
      }
    } catch (err: any) {
      addLog(`💥 Google 认证异常: ${err.message}`)
      setTestResults(prev => ({ ...prev, googleAuth: { success: false, error: err.message } }))
    }
    
    setIsLoading(false)
  }

  const simulateCallback = () => {
    addLog('🔄 模拟回调处理...')
    
    // 模拟从 URL 获取参数
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    
    addLog(`📄 URL 参数: code=${code ? '存在' : '不存在'}, error=${error || '无'}`)
    
    if (code) {
      addLog(`🔑 认证代码: ${code.substring(0, 10)}...`)
      addLog('⏳ 检查会话状态...')
      
      setTimeout(async () => {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          addLog(`❌ 会话检查错误: ${sessionError.message}`)
        } else if (session) {
          addLog(`✅ 会话有效: ${session.user?.email}`)
          addLog('🎉 认证成功！可以重定向了')
        } else {
          addLog('❌ 会话无效，认证可能失败')
        }
      }, 2000)
    }
  }

  const manualRedirect = () => {
    addLog('🔄 手动重定向到首页...')
    router.push('/en')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 认证问题详细调试</h1>
      
      {/* 操作按钮 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <button 
          onClick={testSupabaseConnection}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          测试连接
        </button>
        
        <button 
          onClick={testGoogleAuth}
          disabled={isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {isLoading ? '启动中...' : '测试登录'}
        </button>
        
        <button 
          onClick={simulateCallback}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          模拟回调
        </button>
        
        <button 
          onClick={manualRedirect}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          手动重定向
        </button>
        
        <button 
          onClick={clearLogs}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          清空日志
        </button>
      </div>

      {/* 当前状态 */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h2 className="font-bold mb-2">📊 当前状态</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>页面URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}
          </div>
          <div>
            <strong>认证状态:</strong> {authState ? `${authState.event} (${authState.user?.email || '无用户'})` : '未知'}
          </div>
        </div>
      </div>

      {/* 测试结果 */}
      {Object.keys(testResults).length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h2 className="font-bold mb-2">🧪 测试结果</h2>
          <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-auto">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      {/* 日志显示 */}
      <div className="mb-6">
        <h2 className="font-bold mb-2">📋 实时日志 ({logs.length} 条)</h2>
        <div className="bg-black text-green-400 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">暂无日志...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="p-4 bg-yellow-50 rounded">
        <h3 className="font-bold mb-2">💡 使用说明</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>先点击"测试连接"确认 Supabase 基本连接正常</li>
          <li>点击"测试登录"启动 Google 认证（会跳转）</li>
          <li>认证完成后会回到这个页面，观察日志变化</li>
          <li>如果卡住，点击"模拟回调"手动检查认证状态</li>
          <li>可以点击"手动重定向"测试页面跳转功能</li>
          <li>观察实时日志了解每个步骤的执行情况</li>
        </ol>
      </div>
    </div>
  )
}