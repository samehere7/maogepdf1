"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useUser } from '@/components/UserProvider'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { profile, loading } = useUser()
  const t = useTranslations('error')
  const errorMessage = searchParams.get('message') || t('unknownError')

  // 如果用户已经登录但在错误页面，自动重定向到首页
  useEffect(() => {
    if (!loading && profile && errorMessage.includes(t('authorizationFailed'))) {
      console.log('用户已登录但在错误页面，自动重定向到首页')
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  }, [profile, loading, errorMessage, router, t])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="text-red-500 size-12">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          {!loading && profile && errorMessage.includes(t('authorizationFailed')) ? 
            t('loginSuccess') : 
            t('errorOccurred')
          }
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {!loading && profile && errorMessage.includes(t('authorizationFailed')) ? 
            t('loginSuccessRedirecting') : 
            errorMessage
          }
        </p>
        
        {!loading && profile && errorMessage.includes(t('authorizationFailed')) && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8b5cf6] mx-auto"></div>
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center">
            <Link href="/">
              <Button>
                {t('returnHome')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 