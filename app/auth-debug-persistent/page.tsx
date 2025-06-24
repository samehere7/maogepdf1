"use client"

import { useState, useEffect } from 'react'

interface LogEntry {
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export default function PersistentAuthDebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')

  // 从 localStorage 加载日志
  useEffect(() => {
    const savedLogs = localStorage.getItem('auth-debug-logs-persistent')
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs)
        if (Array.isArray(parsedLogs)) {
          setLogs(parsedLogs)
        }
      } catch (e) {
        console.error('Failed to parse saved logs:', e)
      }
    }
  }, [])

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      }),
      message,
      type
    }
    
    console.log(`[${newLog.timestamp}] ${message}`)
    
    setLogs(prev => {
      const newLogs = [...prev, newLog]
      // 保存到 localStorage
      localStorage.setItem('auth-debug-logs-persistent', JSON.stringify(newLogs))
      return newLogs
    })
  }

  const clearLogs = () => {
    setLogs([])
    localStorage.removeItem('auth-debug-logs-persistent')
    addLog('日志已清空', 'info')
  }

  const copyAllLogs = async () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.message}`).join('\n')
    
    try {
      await navigator.clipboard.writeText(logText)
      setCopyStatus('✅ 已复制到剪贴板')
    } catch (err) {
      try {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = logText
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopyStatus('✅ 已复制到剪贴板 (降级方案)')
      } catch (fallbackErr) {
        setCopyStatus('❌ 复制失败')
      }
    }
    
    setTimeout(() => setCopyStatus(''), 3000)
  }

  const testEnvironmentConfig = async () => {
    addLog('🔧 开始环境配置检查...', 'info')
    setLoading(true)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      addLog(`🌐 当前域名: ${window.location.origin}`, 'info')
      addLog(`🔗 Supabase URL: ${supabaseUrl}`, 'info')
      addLog(`🔑 Anon Key 长度: ${supabaseKey?.length || 0} 字符`, 'info')
      
      if (!supabaseUrl || !supabaseKey) {
        addLog('❌ 环境变量未正确设置!', 'error')
        return
      }

      // 分析 JWT token
      addLog('🔍 分析 JWT Token...', 'info')
      try {
        const parts = supabaseKey.split('.')
        addLog(`🔍 JWT 部分数量: ${parts.length} (正常应该是3部分)`, 'info')
        
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]))
          addLog(`📋 JWT Payload: ${JSON.stringify(payload, null, 2)}`, 'info')
          
          addLog(`🆔 iss (发行方): ${payload.iss || '❌ 缺失'}`, payload.iss ? 'success' : 'error')
          addLog(`🎯 aud (受众): ${payload.aud || '❌ 缺失'}`, payload.aud ? 'success' : 'warning')
          addLog(`👤 sub (主体): ${payload.sub || '❌ 缺失'}`, payload.sub ? 'success' : 'warning')
          addLog(`🎭 role (角色): ${payload.role || '❌ 缺失'}`, payload.role ? 'success' : 'error')
          addLog(`⏰ exp (过期时间): ${payload.exp ? new Date(payload.exp * 1000).toLocaleString() : '❌ 缺失'}`, payload.exp ? 'success' : 'error')
        }
      } catch (jwtError: any) {
        addLog(`❌ JWT 解析错误: ${jwtError.message}`, 'error')
      }

      // 测试网络连接
      addLog('🌐 测试网络连接...', 'info')
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        })
        addLog(`✅ 网络连接: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'warning')
      } catch (error: any) {
        addLog(`❌ 网络连接失败: ${error.message}`, 'error')
      }

      // 测试 OAuth URL 生成
      addLog('🔐 测试 OAuth URL 生成...', 'info')
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/en/auth/callback?debug=persistent`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        })

        if (oauthError) {
          addLog(`❌ OAuth URL 生成失败: ${oauthError.message}`, 'error')
        } else {
          addLog(`✅ OAuth URL 生成成功`, 'success')
          addLog(`🔗 重定向URL: ${oauthData.url}`, 'info')
        }
      } catch (error: any) {
        addLog(`❌ OAuth 测试失败: ${error.message}`, 'error')
      }

      addLog('✅ 环境配置检查完成', 'success')

    } catch (error: any) {
      addLog(`💥 检查失败: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const testDirectLogin = async () => {
    addLog('🚀 开始直接登录测试...', 'info')
    setLoading(true)

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // 保存当前日志到 localStorage，以便回调后可以查看
      localStorage.setItem('auth-debug-logs-persistent', JSON.stringify(logs))
      
      addLog('💾 日志已保存，准备跳转登录...', 'info')
      addLog('🔗 跳转后请访问 /auth-debug-persistent 查看完整日志', 'warning')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/en/auth/callback?debug=persistent&returnTo=auth-debug-persistent`,
        }
      })

      if (error) {
        addLog(`❌ 登录启动失败: ${error.message}`, 'error')
      } else {
        addLog(`✅ 登录启动成功，即将跳转...`, 'success')
        addLog(`🔗 重定向URL: ${data.url}`, 'info')
        
        // 等待一秒让用户看到日志，然后跳转
        setTimeout(() => {
          window.location.href = data.url!
        }, 1000)
      }

    } catch (error: any) {
      addLog(`💥 登录测试失败: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getLogTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-green-400'
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔧 持久化认证调试工具</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-bold mb-2 text-blue-800">💡 使用说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 此工具会自动保存日志到浏览器本地存储</li>
          <li>• 即使页面跳转或刷新，日志也不会丢失</li>
          <li>• 可以复制所有日志用于问题分析</li>
          <li>• 测试登录后会自动返回此页面</li>
        </ul>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button 
          onClick={testEnvironmentConfig}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 text-sm"
        >
          {loading ? '检查中...' : '环境配置检查'}
        </button>
        
        <button 
          onClick={testDirectLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 text-sm"
        >
          {loading ? '启动中...' : '测试登录跳转'}
        </button>
        
        <button 
          onClick={copyAllLogs}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm"
        >
          复制所有日志
        </button>
        
        <button 
          onClick={clearLogs}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
        >
          清空日志
        </button>
      </div>

      {copyStatus && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded text-sm">
          {copyStatus}
        </div>
      )}

      <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto">
        <div className="text-xs text-gray-400 mb-2">
          日志总数: {logs.length} | 自动保存: 开启
        </div>
        <div className="font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">点击按钮开始测试...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`mb-1 ${getLogTypeColor(log.type)}`}>
                <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
        <h3 className="font-bold mb-2 text-yellow-800">⚠️ 注意事项</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 如果测试登录后没有自动返回，请手动访问此页面</li>
          <li>• 日志保存在浏览器本地，清除浏览器数据会丢失日志</li>
          <li>• 建议在测试前先复制现有日志作为备份</li>
        </ul>
      </div>
    </div>
  )
}