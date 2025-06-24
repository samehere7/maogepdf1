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
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  // 添加调试日志
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    
    setDebugLogs(prev => {
      const newLogs = [...prev, logMessage]
      // 保存到 localStorage 以便调试页面查看
      if (typeof window !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem('auth-debug-logs') || '[]')
        const allLogs = [...existingLogs, logMessage]
        localStorage.setItem('auth-debug-logs', JSON.stringify(allLogs))
      }
      return newLogs
    })
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let subscription: any

    const handleAuthCallback = async () => {
      try {
        addDebugLog('🔄 开始处理认证回调...')
        
        // 从 URL 获取参数
        const redirectedFrom = searchParams.get('redirectedFrom') || `/${locale}`
        const code = searchParams.get('code')
        const error_param = searchParams.get('error')
        
        addDebugLog(`📄 URL参数: redirectedFrom=${redirectedFrom}, code=${code ? '存在' : '无'}, error=${error_param || '无'}`)
        addDebugLog(`🌐 完整URL: ${window.location.href}`)

        // 简单延迟，让 Supabase 有时间处理认证
        addDebugLog('⏳ 等待2秒让Supabase处理认证...')
        await new Promise(resolve => setTimeout(resolve, 2000))

        // 检查 URL 参数中是否有认证 token
        addDebugLog('🔍 检查 URL 中的认证信息...')
        
        let session: any = null
        let error: any = null
        
        // 检查 URL hash 和 search params 中的认证信息
        const hash = window.location.hash
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(hash.substring(1))
        
        const accessToken = hashParams.get('access_token') || urlParams.get('access_token')
        const tokenType = hashParams.get('token_type') || urlParams.get('token_type')
        const expiresIn = hashParams.get('expires_in') || urlParams.get('expires_in')
        
        addDebugLog(`🔗 URL hash: ${hash.substring(0, 100)}${hash.length > 100 ? '...' : ''}`)
        addDebugLog(`🎫 Access token: ${accessToken ? '存在' : '无'}`)
        addDebugLog(`🔖 Token type: ${tokenType || '无'}`)
        addDebugLog(`⏰ Expires in: ${expiresIn || '无'}`)
        
        if (accessToken) {
          addDebugLog('✅ 发现认证 token，认证成功!')
          session = { user: { email: 'authenticated' } } // 模拟会话
        } else {
          addDebugLog('⚠️ 未发现认证 token，尝试会话检查...')
          
          try {
            // 只在没有 token 的情况下才尝试会话检查，并且设置短超时
            const sessionPromise = supabase.auth.getSession()
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('会话检查超时')), 2000)
            )
            
            const result = await Promise.race([sessionPromise, timeoutPromise]) as any
            session = result.data?.session
            error = result.error
            
            addDebugLog(`📊 会话检查完成: session=${!!session}, user=${session?.user?.email || '无'}, error=${error?.message || '无'}`)
          } catch (sessionError: any) {
            addDebugLog(`⏰ 会话检查超时 (正常，JWT 问题): ${sessionError.message}`)
            // 不将超时视为错误，继续处理
            error = null
          }
        }

        // 检查是否认证成功 (基于 token 或会话)
        if (session?.user || accessToken) {
          if (accessToken) {
            addDebugLog(`✅ 基于 URL token 认证成功!`)
          } else {
            addDebugLog(`✅ 基于会话认证成功! 用户: ${session.user.email}`)
          }
          addDebugLog('🎉 准备重定向...')
          setStatus('success')

          setTimeout(() => {
            const finalRedirect = redirectedFrom.startsWith('/') 
              ? redirectedFrom 
              : `/${locale}`
            
            addDebugLog(`🚀 重定向到: ${finalRedirect}`)
            router.push(finalRedirect)
          }, 1000)
        } else {
          addDebugLog('⚠️ 未检测到认证信息，尝试其他方法...')
          
          // 检查 URL hash 中是否有认证信息
          const hash = window.location.hash
          addDebugLog(`🔗 URL hash: ${hash}`)
          
          if (hash && hash.includes('access_token')) {
            addDebugLog('🔄 发现 hash 中有 access_token，重新加载处理...')
            // 触发 Supabase 处理 hash
            window.location.href = window.location.href
            return
          }
          
          addDebugLog('🔔 设置认证状态监听器...')
          
          // 监听认证状态变化
          const { data: authData } = supabase.auth.onAuthStateChange((event, session) => {
            addDebugLog(`📡 认证状态变化: ${event}, session=${!!session}, user=${session?.user?.email || '无'}`)
            
            if (event === 'SIGNED_IN' && session?.user) {
              addDebugLog(`🎉 监听到登录成功! 用户: ${session.user.email}`)
              setStatus('success')
              if (subscription) subscription.unsubscribe()
              
              setTimeout(() => {
                const finalRedirect = redirectedFrom.startsWith('/') 
                  ? redirectedFrom 
                  : `/${locale}`
                
                addDebugLog(`🚀 从监听器重定向到: ${finalRedirect}`)
                router.push(finalRedirect)
              }, 1000)
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              addDebugLog(`🔄 Token刷新成功! 用户: ${session.user.email}`)
              setStatus('success')
              if (subscription) subscription.unsubscribe()
              
              setTimeout(() => {
                const finalRedirect = redirectedFrom.startsWith('/') 
                  ? redirectedFrom 
                  : `/${locale}`
                
                addDebugLog(`🚀 Token刷新后重定向到: ${finalRedirect}`)
                router.push(finalRedirect)
              }, 1000)
            }
          })
          
          subscription = authData.subscription
          
          // 减少超时到8秒，因为我们已经处理了主要情况
          timeoutId = setTimeout(() => {
            addDebugLog('⏰ 认证超时 (8秒)')
            if (subscription) subscription.unsubscribe()
            
            addDebugLog('❌ 未能完成认证，可能是JWT问题')
            setError('认证过程遇到问题，请重试')
            setStatus('error')
            setTimeout(() => {
              addDebugLog('🔄 重定向到登录页面')
              router.push(`/${locale}/auth/login?error=auth_timeout`)
            }, 3000)
          }, 8000)
        }

      } catch (err: any) {
        addDebugLog(`💥 认证回调异常: ${err.message}`)
        setError(err.message || '认证失败')
        setStatus('error')
        
        setTimeout(() => {
          addDebugLog('🔄 异常重定向到登录页面')
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-4xl w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">正在完成登录...</h2>
          <p className="text-gray-600 mb-6">请稍候，我们正在验证您的身份</p>
          
          {/* 显示调试日志 */}
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <h3 className="font-bold mb-2 text-left">🔧 实时调试日志:</h3>
            <div className="bg-black text-green-400 p-3 rounded text-xs font-mono text-left h-64 overflow-y-auto">
              {debugLogs.length === 0 ? (
                <div className="text-gray-500">等待日志...</div>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500 text-left">
              💡 提示: 如果认证卡住，可以返回 <a href="/auth-debug" className="text-blue-500 underline">/auth-debug</a> 查看完整日志
            </div>
          </div>
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