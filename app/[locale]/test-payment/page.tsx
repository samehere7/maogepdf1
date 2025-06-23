"use client"

import { useState } from 'react'
import { useUser } from '@/components/UserProvider'
import { Button } from '@/components/ui/button'

export default function TestPaymentPage() {
  const { profile } = useUser()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const testPaymentAPI = async (plan: 'monthly' | 'yearly') => {
    if (!profile?.id) {
      setResult('错误: 用户未登录')
      return
    }

    setLoading(true)
    setResult('正在测试...')
    
    try {
      const response = await fetch('/api/payment/paddle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan,
          userId: profile.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResult(`✅ 成功! 结账链接: ${data.checkoutUrl.substring(0, 100)}...`)
      } else {
        const errorText = await response.text()
        setResult(`❌ 失败: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      setResult(`❌ 网络错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testWebhook = async () => {
    if (!profile?.id) {
      setResult('错误: 用户未登录')
      return
    }

    setLoading(true)
    setResult('测试webhook...')
    
    try {
      // 模拟webhook数据
      const webhookData = {
        alert_name: 'subscription_payment_succeeded',
        event_time: new Date().toISOString(),
        passthrough: JSON.stringify({
          userId: profile.id,
          plan: 'monthly'
        })
      }

      const response = await fetch('/api/webhook/paddle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      })

      if (response.ok) {
        setResult('✅ Webhook测试成功!')
      } else {
        const errorText = await response.text()
        setResult(`❌ Webhook失败: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      setResult(`❌ Webhook网络错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">支付系统测试</h1>
      
      {profile ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <p><strong>用户ID:</strong> {profile.id}</p>
            <p><strong>邮箱:</strong> {profile.email}</p>
            <p><strong>Plus状态:</strong> {profile.plus ? '是' : '否'}</p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => testPaymentAPI('monthly')} 
              disabled={loading}
              className="w-full"
            >
              测试月付API
            </Button>
            
            <Button 
              onClick={() => testPaymentAPI('yearly')} 
              disabled={loading}
              className="w-full"
            >
              测试年付API
            </Button>
            
            <Button 
              onClick={testWebhook} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              测试Webhook
            </Button>
          </div>

          {result && (
            <div className="p-4 bg-blue-50 rounded border">
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      ) : (
        <p>请先登录后再测试支付功能</p>
      )}
    </div>
  )
}