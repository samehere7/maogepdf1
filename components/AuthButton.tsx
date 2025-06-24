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
      // 设置超时机制，避免 signOut API 卡住
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('signOut() 超时')), 3000)
      )
      
      try {
        await Promise.race([signOutPromise, timeoutPromise])
      } catch (signOutError: any) {
        // 静默处理，继续执行本地清理
      }
      
      // 手动清理本地状态
      if (typeof window !== 'undefined') {
        try {
          // 清理 Supabase 相关的存储
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              localStorage.removeItem(key)
            }
          })
          
          // 清理调试日志
          localStorage.removeItem('auth-debug-logs')
          localStorage.removeItem('auth-debug-logs-persistent')
        } catch (storageError) {
          // 静默处理存储错误
        }
      }
      
      // 强制刷新页面以确保状态重置
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