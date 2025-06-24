"use client"

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function AuthTokenHandler() {
  useEffect(() => {
    // 检查URL中是否有access_token
    const handleAuthToken = async () => {
      const hash = window.location.hash
      
      if (hash && hash.includes('access_token=')) {
        console.log('[AuthTokenHandler] 检测到URL中的access_token')
        
        try {
          // 解析URL中的token信息，避免调用有问题的getSession()
          const hashParams = new URLSearchParams(hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const expiresAt = hashParams.get('expires_at')
          
          if (accessToken) {
            console.log('[AuthTokenHandler] 从URL解析到access_token')
            
            // 解析access_token获取用户信息
            try {
              const tokenParts = accessToken.split('.')
              if (tokenParts.length >= 2) {
                const payload = JSON.parse(atob(tokenParts[1]))
                console.log('[AuthTokenHandler] Token有效，用户ID:', payload.sub)
            
                // 手动发送session到服务端
                try {
                  const setSessionResponse = await fetch('/api/auth/set-session', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      access_token: accessToken,
                      refresh_token: refreshToken || '',
                      expires_at: expiresAt ? parseInt(expiresAt) : Math.floor(Date.now() / 1000) + 3600
                    })
                  });
                  
                  if (setSessionResponse.ok) {
                    console.log('[AuthTokenHandler] 服务端session设置成功');
                  } else {
                    console.log('[AuthTokenHandler] 服务端session设置失败:', setSessionResponse.status);
                  }
                } catch (err) {
                  console.log('[AuthTokenHandler] 设置服务端session失败:', err);
                }
              } else {
                console.log('[AuthTokenHandler] 无效的access_token格式')
              }
            } catch (tokenError) {
              console.log('[AuthTokenHandler] 解析access_token失败:', tokenError)
            }
            
            // 清理URL
            try {
              const cleanUrl = window.location.pathname
              window.history.replaceState({}, document.title, cleanUrl)
            } catch (err) {
              // 忽略replaceState错误，直接重新加载
              console.log('[AuthTokenHandler] replaceState失败，直接重新加载')
            }
            
            // 延迟重新加载确保session同步
            setTimeout(() => {
              window.location.reload()
            }, 500)
          } else {
            console.log('[AuthTokenHandler] 未找到access_token')
          }
        } catch (err) {
          console.error('[AuthTokenHandler] 处理token失败:', err)
        }
      }
    }

    // 延迟执行以确保组件完全挂载
    const timeoutId = setTimeout(handleAuthToken, 100)
    
    return () => clearTimeout(timeoutId)
  }, [])

  return null
}