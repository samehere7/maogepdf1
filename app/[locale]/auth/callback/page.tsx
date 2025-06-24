"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useLocale } from 'next-intl'

export default function AuthCallbackPage() {
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('处理认证回调...')
        
        // 从 URL 获取参数
        const code = searchParams.get('code')
        const redirectedFrom = searchParams.get('redirectedFrom') || `/${locale}`
        
        console.log('回调参数:', { code: !!code, redirectedFrom })

        if (!code) {
          throw new Error('没有收到认证代码')
        }

        // 让 Supabase 自动处理代码交换
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('认证失败:', error)
          throw error
        }

        console.log('认证成功:', { user: data.user?.email })
        setStatus('success')

        // 短暂延迟后重定向
        setTimeout(() => {
          const finalRedirect = redirectedFrom.startsWith('/') 
            ? redirectedFrom 
            : `/${locale}`
          
          console.log('重定向到:', finalRedirect)
          router.push(finalRedirect)
        }, 1000)

      } catch (err: any) {
        console.error('认证回调失败:', err)
        setError(err.message || '认证失败')
        setStatus('error')
        
        // 3秒后重定向到登录页面
        setTimeout(() => {
          router.push(`/${locale}/auth/login?error=callback_failed`)
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [searchParams, router, locale])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">正在完成登录...</h2>
          <p className="text-gray-600">请稍候，我们正在验证您的身份</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-xl font-semibold mb-2">登录成功！</h2>
          <p className="text-gray-600">正在跳转到首页...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">✗</div>
          <h2 className="text-xl font-semibold mb-2">登录失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">3秒后自动返回登录页面...</p>
        </div>
      </div>
    )
  }

  return null
}