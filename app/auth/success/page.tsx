"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/UserProvider'

export default function AuthSuccess() {
  const router = useRouter()
  const { profile, loading } = useUser()

  useEffect(() => {
    // 等待用户状态加载完成
    if (!loading) {
      if (profile) {
        // 用户已登录，重定向到首页
        console.log('用户已成功登录，重定向到首页')
        router.push('/')
      } else {
        // 用户未登录，重定向到登录页
        console.log('用户未登录，重定向到登录页')
        router.push('/auth/login')
      }
    }
  }, [profile, loading, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6]"></div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          登录成功
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          正在为您准备...
        </p>
      </div>
    </div>
  )
}