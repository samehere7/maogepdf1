"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // 重定向到首页并携带分享参数
  useEffect(() => {
    try {
      const shareId = params.shareId as string
      
      // 设置调试信息
      setDebugInfo({
        shareId,
        params: params,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
        location: typeof window !== 'undefined' ? window.location.href : 'Server'
      })

      if (shareId) {
        console.log('分享页面重定向:', { shareId, params })
        // 重定向到默认语言首页，携带分享ID参数
        const redirectUrl = `/en?share=${encodeURIComponent(shareId)}`
        console.log('重定向到:', redirectUrl)
        router.replace(redirectUrl)
      } else {
        setError('无效的分享链接：缺少分享ID')
      }
    } catch (err) {
      console.error('分享页面处理错误:', err)
      setError('处理分享链接时发生错误')
    }
  }, [params.shareId, router, params])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2 text-gray-800">分享链接无效</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          
          {/* 调试信息 */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="bg-gray-100 p-4 rounded-lg mb-4 text-left">
              <h3 className="font-bold mb-2">调试信息:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/en')}
              className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed]"
            >
              返回首页
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              重新加载
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
        <p className="text-slate-600">正在跳转...</p>
        
        {/* 开发环境显示调试信息 */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow text-left max-w-md">
            <h3 className="font-bold mb-2 text-sm">调试信息:</h3>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}