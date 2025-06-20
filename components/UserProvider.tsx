"use client"

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// 定义用户配置文件类型
type Profile = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  plus?: boolean;
  is_active?: boolean;
  expire_at?: string;
};

// 创建上下文
type UserContextType = {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  user: any | null;
};

const UserContext = createContext<UserContextType>({
  profile: null,
  loading: true,
  error: null,
  refreshProfile: async () => {},
  setProfile: () => {},
  user: null
});

// 导出Provider组件
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [initialized, setInitialized] = useState(false);

  // 获取用户配置文件
  const refreshProfile = async () => {
    try {
      setError(null);
      if (!initialized) {
        setLoading(true);
      }
      
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('获取会话失败:', sessionError);
        setProfile(null);
        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }
      
      console.log("当前会话状态:", session ? "已登录" : "未登录");
      
      if (!session?.user) {
        console.log("没有用户会话，设置为未登录状态");
        setProfile(null);
        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      setUser(session.user);
      
      // 从用户元数据构建基本配置文件
      const userProfile: Profile = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        avatar_url: session.user.user_metadata?.avatar_url,
        plus: false,
        is_active: true
      };
      
      console.log("用户配置文件:", userProfile);
      console.log("设置loading为false");
      
      // 如果需要，可以从数据库获取额外的用户信息
      // 例如Plus会员状态等
      
      setProfile(userProfile);
      setLoading(false);
      setInitialized(true);
    } catch (err) {
      console.error('获取用户数据失败:', err);
      setError(err instanceof Error ? err : new Error('获取用户数据失败'));
      setLoading(false);
      setInitialized(true);
    }
  };

  // 初始化和监听认证状态变化
  useEffect(() => {
    let mounted = true;
    let isInitializing = true;
    
    // 设置认证状态变化监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("认证状态变化:", event, session ? "有会话" : "无会话");
      
      if (!mounted) return;
      
      // 初始会话事件，直接处理不重复调用
      if (event === 'INITIAL_SESSION') {
        console.log("处理初始会话");
        isInitializing = false;
        await refreshProfile();
      }
      // 只在非初始化阶段处理真实的状态变化
      else if (!isInitializing && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
        console.log("因认证状态变化，刷新用户配置文件");
        await refreshProfile();
      } else if (event === 'TOKEN_REFRESHED') {
        // 对于令牌刷新，直接更新session，不重新设置loading
        console.log("令牌已刷新，更新会话信息");
        if (session?.user) {
          setUser(session.user);
          const userProfile: Profile = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            avatar_url: session.user.user_metadata?.avatar_url,
            plus: false,
            is_active: true
          };
          setProfile(userProfile);
        }
      }
    });
    
    // 添加一个fallback，以防INITIAL_SESSION没有正确触发
    const fallbackTimer = setTimeout(() => {
      if (mounted && isInitializing) {
        console.log("Fallback: 初始化超时，手动获取会话");
        isInitializing = false;
        refreshProfile();
      }
    }, 1000); // 1秒后触发fallback
    
    // 清理订阅
    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ profile, loading, error, refreshProfile, setProfile, user }}>
      {children}
    </UserContext.Provider>
  );
}

// 导出自定义Hook
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    // 提供默认值，避免在SSR/hydration过程中出错
    console.warn('useUser called outside of UserProvider, using defaults')
    return {
      profile: null,
      loading: false,
      error: null,
      refreshProfile: async () => {},
      setProfile: () => {},
      user: null
    };
  }
  return context;
} 