"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useLocale } from 'next-intl'

function AuthCallbackContent() {
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
        const redirectedFrom = searchParams.get('redirectedFrom') || `/${locale}`
        
        console.log('回调参数:', { redirectedFrom })

        // 检查当前会话状态
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('会话检查失败:', error)
          throw error
        }

        if (session) {
          console.log('认证成功:', { user: session.user?.email })
          setStatus('success')

          // 短暂延迟后重定向
          setTimeout(() => {
            const finalRedirect = redirectedFrom.startsWith('/') 
              ? redirectedFrom 
              : `/${locale}`
            
            console.log('重定向到:', finalRedirect)
            router.push(finalRedirect)
          }, 1000)
        } else {
          // 等待 Supabase 自动处理认证
          console.log('等待认证处理...')
          
          // 监听认证状态变化
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('认证状态变化:', event, session?.user?.email)
            
            if (event === 'SIGNED_IN' && session) {
              setStatus('success')
              subscription.unsubscribe()
              
              setTimeout(() => {
                const finalRedirect = redirectedFrom.startsWith('/') 
                  ? redirectedFrom 
                  : `/${locale}`
                
                console.log('重定向到:', finalRedirect)
                router.push(finalRedirect)
              }, 1000)
            } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
              setError('认证失败')
              setStatus('error')
              subscription.unsubscribe()
              
              setTimeout(() => {
                router.push(`/${locale}/auth/login?error=auth_failed`)
              }, 3000)
            }
          })
          
          // 5秒后如果还没有认证成功，视为失败
          setTimeout(() => {
            subscription.unsubscribe()
            if (status === 'loading') {
              setError('认证超时')
              setStatus('error')
              setTimeout(() => {
                router.push(`/${locale}/auth/login?error=auth_timeout`)
              }, 3000)
            }
          }, 5000)
        }

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
  }, [searchParams, router, locale, status])

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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">正在初始化...</h2>
          <p className="text-gray-600">请稍候</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}