"use client"
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const UserContext = createContext<any>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        // 查询 user_with_plus 视图，获取会员状态
        const { data } = await supabase
          .from("user_with_plus")
          .select("plus, expire_at, is_active")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    });
  }, []);

  return (
    <UserContext.Provider value={{ user, profile, setProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 