"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import AccountModal from "@/components/AccountModal"
import UpgradePlusModal from "@/components/UpgradePlusModal"
import { useUser } from "@/components/UserProvider"

export default function SidebarUserInfo() {
  const [open, setOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const { user, profile, setProfile } = useUser();
  const supabase = createClient();

  if (!user) return null

  const avatarUrl = user.user_metadata?.avatar_url
  const displayName = user.user_metadata?.full_name || user.email || "未命名"

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    // 可加刷新页面等
  }

  // 升级按钮逻辑
  const handleUpgrade = async () => {
    // 这里只做刷新演示，实际升级应由后端处理
    const { data } = await supabase
      .from("user_with_plus")
      .select("plus, expire_at, is_active")
      .eq("id", user.id)
      .single();
    setProfile(data);
    setUpgradeOpen(false);
    alert("升级成功！");
  }

  const isPlus = profile?.plus === true;
  const isActive = profile?.is_active === true;

  return (
    <>
      <div className="flex flex-col items-center w-full">
        <div
          className="flex items-center gap-2 w-full px-6 mt-3 cursor-pointer"
          style={{ color: "#fff", fontSize: 14, fontWeight: 600, lineHeight: "20px" }}
          onClick={() => setOpen(true)}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
              {displayName[0]?.toUpperCase() || "U"}
            </div>
          )}
          <span className="truncate">{displayName}</span>
          {isPlus && isActive && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-xs text-white rounded-full font-bold">PLUS</span>
          )}
        </div>
        {!isPlus && (
          <button
            className="w-[calc(100%-24px)] h-10 mt-3 bg-[#a026ff] text-white rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px]"
            style={{ marginLeft: 12, marginRight: 12 }}
            onClick={() => setUpgradeOpen(true)}
          >
            升级到 Plus
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