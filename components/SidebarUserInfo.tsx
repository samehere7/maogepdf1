"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import AccountModal from "@/components/AccountModal"
import UpgradePlusModal from "@/components/UpgradePlusModal"
import { useUser } from "@/components/UserProvider"
import { Crown } from "lucide-react"
import { useTranslations } from 'next-intl'

export default function SidebarUserInfo() {
  const [open, setOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const { user, profile, setProfile } = useUser();
  const t = useTranslations();

  if (!user) return null;

  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const displayName = profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || t('user.unnamed');

  const handleSignOut = async () => {
    try {
      // 设置超时机制，避免 signOut API 卡住
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('signOut() 超时')), 3000)
      )
      
      try {
        await Promise.race([signOutPromise, timeoutPromise])
      } catch (signOutError: any) {
        // 静默处理
      }
      
      // 手动清理本地状态
      if (typeof window !== 'undefined') {
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              localStorage.removeItem(key)
            }
          })
        } catch (storageError) {
          // 静默处理
        }
      }
      
      setOpen(false)
      
      // 强制刷新页面
      setTimeout(() => {
        window.location.reload()
      }, 100)
      
    } catch (error) {
      console.error('退出登录失败:', error)
      setOpen(false)
      // 即使出错也刷新页面
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }

  const handleUpgrade = async () => {
    try {
      // 获取用户session以获取access_token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // 通过API端点获取最新用户数据
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const { profile: updatedProfile } = await response.json();
          setProfile(updatedProfile);
        } else {
          throw new Error('Failed to fetch updated profile');
        }
      } else {
        throw new Error('No access token available');
      }
    } catch (error) {
      console.error('无法获取更新的用户数据:', error);
      
      // 如果API请求失败，直接更新profile
      const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      setProfile({
        ...profile,
        plus: true,
        is_active: true,
        expire_at: oneYearLater.toISOString(),
        id: profile?.id || user.id,
        email: profile?.email || user.email
      });
    }
    
    setUpgradeOpen(false);
    alert(t('upgrade.upgradeSuccess'));
  }

  const isPlus = profile?.plus === true;
  const isActive = profile?.is_active === true;

  return (
    <>
      <div className="flex flex-col items-center w-full px-3 py-4 border-b border-gray-700">
        {/* 用户信息行 */}
        <div
          className="flex items-center gap-3 w-full cursor-pointer group"
          onClick={() => setOpen(true)}
        >
          {/* 头像 */}
          <div className="relative">
          {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="avatar" 
                className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-purple-400 transition-all" 
              />
          ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-transparent group-hover:border-purple-400 transition-all">
              {displayName[0]?.toUpperCase() || "U"}
            </div>
          )}
          {isPlus && isActive && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* 用户名和状态 */}
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate group-hover:text-purple-400 transition-colors">
              {displayName}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {isPlus && isActive ? t('user.plusMember') : t('user.freeUser')}
            </div>
          </div>
        </div>

        {/* 升级按钮 */}
        {!isPlus && (
        <button
            className="w-full h-9 mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => setUpgradeOpen(true)}
        >
            <Crown className="w-4 h-4" />
          {t('upgrade.upgradeToPlus')}
        </button>
        )}
      </div>

      <AccountModal
        open={open}
        onOpenChange={setOpen}
        user={user}
        onSignOut={handleSignOut}
      />
      <UpgradePlusModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        onUpgrade={handleUpgrade}
      />
    </>
  )
} 