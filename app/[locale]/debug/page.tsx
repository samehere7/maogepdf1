"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'pending'
  details: string
  timestamp: string
}

export default function DebugPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (name: string, status: 'success' | 'error', details: string) => {
    setResults(prev => [...prev, {
      name,
      status,
      details,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults([])

    // 1. 测试 Supabase 连接
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        addResult('Supabase 连接', 'error', `连接失败: ${error.message}`)
      } else {
        addResult('Supabase 连接', 'success', `连接成功, Session: ${data.session ? '存在' : '不存在'}`)
        
        // 如果有session，获取access token信息
        if (data.session?.access_token) {
          try {
            // 解析JWT token
            const tokenParts = data.session.access_token.split('.')
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]))
              addResult('JWT Token 分析', 'success', 
                `Token 字段: ${Object.keys(payload).join(', ')}\n` +
                `包含 sub: ${payload.sub ? '是' : '否'}\n` +
                `包含 aud: ${payload.aud ? '是' : '否'}\n` +
                `Role: ${payload.role || '无'}\n` +
                `过期时间: ${new Date(payload.exp * 1000).toLocaleString()}`
              )
            }
          } catch (e) {
            addResult('JWT Token 分析', 'error', `无法解析token: ${e}`)
          }
        }
      }
    } catch (e) {
      addResult('Supabase 连接', 'error', `连接异常: ${e}`)
    }

    // 2. 测试用户配置文件 API
    try {
      const { data: session } = await supabase.auth.getSession()
      if (session?.session?.access_token) {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          addResult('用户配置文件 API', 'success', `状态: ${response.status}, 数据: ${JSON.stringify(data, null, 2)}`)
        } else {
          const errorText = await response.text()
          addResult('用户配置文件 API', 'error', `状态: ${response.status}, 错误: ${errorText}`)
        }
      } else {
        addResult('用户配置文件 API', 'error', '无法获取访问令牌')
      }
    } catch (e) {
      addResult('用户配置文件 API', 'error', `请求失败: ${e}`)
    }

    // 3. 测试用户配额 API
    try {
      const { data: session } = await supabase.auth.getSession()
      if (session?.session?.access_token) {
        const response = await fetch('/api/user/quota', {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          addResult('用户配额 API', 'success', `状态: ${response.status}, 数据: ${JSON.stringify(data, null, 2)}`)
        } else {
          const errorText = await response.text()
          addResult('用户配额 API', 'error', `状态: ${response.status}, 错误: ${errorText}`)
        }
      } else {
        addResult('用户配额 API', 'error', '无法获取访问令牌')
      }
    } catch (e) {
      addResult('用户配额 API', 'error', `请求失败: ${e}`)
    }

    // 4. 测试 PDF 列表 API
    try {
      const { data: session } = await supabase.auth.getSession()
      if (session?.session?.access_token) {
        const response = await fetch('/api/pdfs', {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          addResult('PDF 列表 API', 'success', `状态: ${response.status}, PDF数量: ${data.pdfs?.length || 0}`)
        } else {
          const errorText = await response.text()
          addResult('PDF 列表 API', 'error', `状态: ${response.status}, 错误: ${errorText}`)
        }
      } else {
        addResult('PDF 列表 API', 'error', '无法获取访问令牌')
      }
    } catch (e) {
      addResult('PDF 列表 API', 'error', `请求失败: ${e}`)
    }

    // 5. 测试支付 API
    try {
      const { data: session } = await supabase.auth.getSession()
      if (session?.session?.user?.id) {
        const response = await fetch('/api/payment/paddle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan: 'monthly',
            userId: session.session.user.id
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          addResult('支付 API', 'success', `状态: ${response.status}, 响应: ${JSON.stringify(data, null, 2)}`)
        } else {
          const errorText = await response.text()
          addResult('支付 API', 'error', `状态: ${response.status}, 错误: ${errorText}`)
        }
      } else {
        addResult('支付 API', 'error', '无法获取用户ID')
      }
    } catch (e) {
      addResult('支付 API', 'error', `请求失败: ${e}`)
    }

    // 6. 测试健康检查 API
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        addResult('健康检查 API', 'success', `状态: ${response.status}, 响应: ${JSON.stringify(data, null, 2)}`)
      } else {
        const errorText = await response.text()
        addResult('健康检查 API', 'error', `状态: ${response.status}, 错误: ${errorText}`)
      }
    } catch (e) {
      addResult('健康检查 API', 'error', `请求失败: ${e}`)
    }

    // 7. 环境变量检查
    addResult('环境变量检查', 'success', 
      `Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '已配置' : '未配置'}\n` +
      `Supabase Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已配置' : '未配置'}\n` +
      `Base URL: ${process.env.NEXT_PUBLIC_BASE_URL || '未配置'}`
    )

    setIsRunning(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🔧 系统诊断工具
          </CardTitle>
          <p className="text-center text-gray-600">
            全面检测系统各项功能状态，快速定位问题所在
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 text-center">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
            >
              {isRunning ? '正在诊断...' : '开始全面诊断'}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">诊断结果:</h3>
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.status === 'success' 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">
                      {result.status === 'success' ? '✅' : '❌'} {result.name}
                    </h4>
                    <span className="text-sm text-gray-500">{result.timestamp}</span>
                  </div>
                  <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                    {result.details}
                  </pre>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">📋 调试信息收集:</h4>
            <p className="text-sm text-gray-700 mb-2">
              运行诊断后，请将结果截图或复制文本发送给开发者进行分析。
            </p>
            <div className="text-xs text-gray-600">
              <p>调试页面地址: {typeof window !== 'undefined' ? window.location.href : '/debug'}</p>
              <p>生成时间: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}