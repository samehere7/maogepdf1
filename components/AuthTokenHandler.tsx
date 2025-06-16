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
          // 让Supabase自动处理URL中的session
          const { data, error } = await supabase.auth.getSession()
          
          if (data.session) {
            console.log('[AuthTokenHandler] 会话已建立:', data.session.user.id)
            
            // 手动发送session到服务端
            try {
              const setSessionResponse = await fetch('/api/auth/set-session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
                  expires_at: data.session.expires_at
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
          } else if (error) {
            console.error('[AuthTokenHandler] 会话建立失败:', error)
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