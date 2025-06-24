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
  const refreshProfile = async (sessionFromEvent?: any) => {
    try {
      setError(null);
      if (!initialized) {
        setLoading(true);
      }
      
      let session = sessionFromEvent;
      
      // 只有在没有传入会话时才尝试获取会话（避免 JWT 问题）
      if (!session) {
        try {
          // 设置短超时，避免长时间卡住
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('getSession() 超时')), 2000)
          );
          
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
          session = result.data?.session;
          
          if (result.error) {
            console.error('获取会话失败:', result.error);
          }
        } catch (sessionError: any) {
          // 静默处理超时，继续等待认证状态变化
          if (!initialized) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }
      }
      
      console.log("Current session status:", session ? "Logged in" : "Not logged in");
      
      if (!session?.user) {
        console.log("No user session, setting to logged out state");
        setProfile(null);
        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      setUser(session.user);
      
      // 查询用户的Plus会员状态
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email, name, avatar_url, plus, is_active, expire_at')
        .eq('id', session.user.id)
        .single()
      
      let finalProfile: Profile
      
      if (profileError || !userProfile) {
        // 如果数据库中没有用户配置文件，创建基本配置文件
        finalProfile = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar_url: session.user.user_metadata?.avatar_url,
          plus: false,
          is_active: true
        }
      } else {
        // 检查Plus会员是否过期
        const isExpired = userProfile.expire_at && new Date(userProfile.expire_at) < new Date()
        
        finalProfile = {
          id: userProfile.id,
          email: userProfile.email || session.user.email || '',
          name: userProfile.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar_url: userProfile.avatar_url || session.user.user_metadata?.avatar_url,
          plus: userProfile.plus && !isExpired,
          is_active: userProfile.is_active && !isExpired,
          expire_at: userProfile.expire_at
        }
      }
      
      console.log("User profile:", finalProfile);
      console.log("Setting loading to false");
      
      setProfile(finalProfile);
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
      console.log("Auth state change:", event, session ? "Has session" : "No session");
      
      if (!mounted) return;
      
      // 初始会话事件，直接处理不重复调用
      if (event === 'INITIAL_SESSION') {
        console.log("Processing initial session");
        isInitializing = false;
        await refreshProfile(session); // 传入会话信息
      }
      // 只在非初始化阶段处理真实的状态变化
      else if (!isInitializing && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
        console.log("Refreshing user profile due to auth state change");
        await refreshProfile(session); // 传入会话信息
      } else if (event === 'TOKEN_REFRESHED') {
        // 对于令牌刷新，直接更新session，不重新设置loading
        console.log("Token refreshed, updating session info");
        if (session?.user) {
          setUser(session.user);
          // 对于令牌刷新，直接使用基本配置文件，避免频繁查询数据库
          const userProfile: Profile = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            avatar_url: session.user.user_metadata?.avatar_url,
            plus: profile?.plus || false,
            is_active: profile?.is_active || true,
            expire_at: profile?.expire_at
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
        refreshProfile(); // 这里不传入session，会尝试获取（可能超时但不会报错）
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