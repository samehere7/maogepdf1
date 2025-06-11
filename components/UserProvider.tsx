"use client"

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

  // 获取用户配置文件
  const refreshProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
  const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log("当前会话状态:", session ? "已登录" : "未登录");
      
      if (!session?.user) {
        setProfile(null);
        setUser(null);
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
      
      // 如果需要，可以从数据库获取额外的用户信息
      // 例如Plus会员状态等
      
      setProfile(userProfile);
    } catch (err) {
      console.error('获取用户数据失败:', err);
      setError(err instanceof Error ? err : new Error('获取用户数据失败'));
    } finally {
      setLoading(false);
    }
  };

  // 初始化和监听认证状态变化
  useEffect(() => {
    const supabase = createClient();
    
    // 初始加载用户数据
    refreshProfile();
    
    // 设置认证状态变化监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("认证状态变化:", event, session ? "有会话" : "无会话");
      refreshProfile();
    });
    
    // 清理订阅
    return () => {
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
  return useContext(UserContext);
} 