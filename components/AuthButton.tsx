"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './UserProvider'

export default function AuthButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { profile, loading } = useUser()
  
  const handleLogin = async () => {
    setIsLoading(true)
    try {
      router.push('/auth/login')
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
    await supabase.auth.signOut()
      router.refresh()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mr-2"></span>
        加载中...
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
        {isLoading ? '处理中...' : '退出登录'}
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
      {isLoading ? '处理中...' : '登录/注册'}
    </Button>
  )
} 