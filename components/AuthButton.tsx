"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUser } from './UserProvider'
import { useTranslations } from 'next-intl'

export default function AuthButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { profile, loading } = useUser()
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  
  const handleLogin = async () => {
    setIsLoading(true)
    try {
      router.push('/auth/login')
    } catch (error) {
      console.error(t('loginFailed') + ':', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.refresh()
    } catch (error) {
      console.error(t('logoutFailed') + ':', error)
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