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
    let timeoutId: NodeJS.Timeout
    let subscription: any

    const handleAuthCallback = async () => {
      try {
        console.log('处理认证回调...')
        
        // 从 URL 获取参数
        const redirectedFrom = searchParams.get('redirectedFrom') || `/${locale}`
        
        console.log('回调参数:', { redirectedFrom, fullUrl: window.location.href })

        // 简单延迟，让 Supabase 有时间处理认证
        await new Promise(resolve => setTimeout(resolve, 2000))

        // 检查当前会话状态
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('会话检查结果:', { session: !!session, user: session?.user?.email, error })

        if (error) {
          console.error('会话检查失败:', error)
          throw error
        }

        if (session?.user) {
          console.log('认证成功，准备重定向...')
          setStatus('success')

          setTimeout(() => {
            const finalRedirect = redirectedFrom.startsWith('/') 
              ? redirectedFrom 
              : `/${locale}`
            
            console.log('重定向到:', finalRedirect)
            router.push(finalRedirect)
          }, 1000)
        } else {
          console.log('会话为空，设置监听器...')
          
          // 监听认证状态变化
          const { data: authData } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('认证状态变化:', { event, hasSession: !!session, user: session?.user?.email })
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('监听到登录成功')
              setStatus('success')
              if (subscription) subscription.unsubscribe()
              
              setTimeout(() => {
                const finalRedirect = redirectedFrom.startsWith('/') 
                  ? redirectedFrom 
                  : `/${locale}`
                
                console.log('从监听器重定向到:', finalRedirect)
                router.push(finalRedirect)
              }, 1000)
            }
          })
          
          subscription = authData.subscription
          
          // 10秒后认证超时
          timeoutId = setTimeout(() => {
            console.log('认证超时')
            if (subscription) subscription.unsubscribe()
            setError('认证超时，请重试')
            setStatus('error')
            
            setTimeout(() => {
              router.push(`/${locale}/auth/login?error=auth_timeout`)
            }, 3000)
          }, 10000)
        }

      } catch (err: any) {
        console.error('认证回调失败:', err)
        setError(err.message || '认证失败')
        setStatus('error')
        
        setTimeout(() => {
          router.push(`/${locale}/auth/login?error=callback_failed`)
        }, 3000)
      }
    }

    handleAuthCallback()

    // 清理函数
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (subscription) subscription.unsubscribe()
    }
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