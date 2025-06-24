"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase/client'
import { useUser } from './UserProvider'
import { useTranslations } from 'next-intl'

export default function AuthButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { profile, loading } = useUser()
  const locale = useLocale()
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  
  const handleLogin = async () => {
    setIsLoading(true)
    try {
      router.push(`/${locale}/auth/login`)
    } catch (error) {
      console.error(t('loginFailed') + ':', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      console.log('🚪 开始退出登录...')
      
      // 设置超时机制，避免 signOut API 卡住
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('signOut() 超时')), 3000)
      )
      
      try {
        await Promise.race([signOutPromise, timeoutPromise])
        console.log('✅ Supabase signOut 成功')
      } catch (signOutError: any) {
        console.log(`⚠️ Supabase signOut 失败或超时: ${signOutError.message}`)
        // 继续执行本地清理，不因为 API 失败而阻止退出
      }
      
      // 手动清理本地状态
      console.log('🧹 清理本地存储...')
      
      // 清理所有认证相关的本地存储
      if (typeof window !== 'undefined') {
        try {
          // 清理 Supabase 相关的存储
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              localStorage.removeItem(key)
            }
          })
          
          // 清理我们自己的调试日志（可选）
          localStorage.removeItem('auth-debug-logs')
          localStorage.removeItem('auth-debug-logs-persistent')
          
          console.log('✅ 本地存储清理完成')
        } catch (storageError) {
          console.log('⚠️ 清理本地存储时出错:', storageError)
        }
      }
      
      // 强制刷新页面以确保状态重置
      console.log('🔄 刷新页面...')
      window.location.href = `/${locale}`
      
    } catch (error) {
      console.error(t('logoutFailed') + ':', error)
      // 即使出错也要尝试刷新页面
      setTimeout(() => {
        window.location.href = `/${locale}`
      }, 1000)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mr-2"></span>
        {tc('loading')}
      </Button>
    )
  }

  if (profile) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleLogout}
        disabled={isLoading}
      >
        {isLoading ? tc('loading') : t('logout')}
      </Button>
    )
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogin}
      disabled={isLoading}
    >
      {isLoading ? tc('loading') : t('login') + '/' + t('signup')}
    </Button>
  )
} 