"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import UpgradePlusModal from "@/components/UpgradePlusModal"
import { useState } from "react"
import { useUser } from "@/components/UserProvider"
import { createClient } from "@/lib/supabase/client"

interface AccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
  onSignOut: () => void
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

export default function AccountModal({ open, onOpenChange, user, onSignOut }: AccountModalProps) {
  // mock 用量数据
  const pdfUsed = 0, pdfTotal = 2
  const msgUsed = 0, msgTotal = 20
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const { profile, setProfile } = useUser();
  const supabase = createClient();

  // 升级按钮逻辑
  const handleUpgrade = async () => {
    // 这里升级逻辑应由后端处理会员开通，前端仅做演示刷新
    const { data } = await supabase
      .from("user_with_plus")
      .select("plus, expire_at, is_active")
      .eq("id", user.id)
      .single();
    setProfile(data);
    setUpgradeOpen(false);
    alert("升级成功！");
  }

  // 会员身份与有效期判断
  const isPlus = profile?.plus === true;
  const isActive = profile?.is_active === true;
  const expireAt = profile?.expire_at;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] bg-white rounded-2xl p-0 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b">
          <div className="text-lg font-semibold">我的账户</div>
        </div>
        {/* 邮箱+退出 */}
        <div className="flex items-center px-6 py-4">
          <span className="text-gray-900 font-medium">{user?.email}</span>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={onSignOut}
          >
            退 出
          </Button>
        </div>
        {/* 今日免费用量 */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 text-sm">今日免费使用量</span>
            <span className="text-xs text-gray-400">将在 8:00 AM 重置</span>
          </div>
          {/* 进度条 */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div className="bg-purple-500 h-2" style={{ width: "0%" }} />
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-2" style={{ width: "0%" }} />
              </div>
            </div>
            <div className="flex flex-col text-xs text-gray-700 whitespace-nowrap ml-2">
              <span>{pdfUsed}/{pdfTotal} 个PDF</span>
              <span>{msgUsed}/{msgTotal} 条消息</span>
            </div>
          </div>
        </div>
        {/* 方案信息 */}
        <div className="px-6 py-3 border-t">
          <div className="flex flex-col px-6 py-4 border-t border-gray-100">
            <div className="flex items-center">
              <span className="text-gray-700 text-sm font-medium">
                {isPlus ? (isActive ? "Plus 会员（有效）" : "Plus 会员（已过期）") : "免费方案"}
              </span>
              {!isPlus && (
                <Button className="ml-auto bg-[#a026ff] text-white rounded-lg px-6 h-9 text-base font-semibold shadow-none hover:bg-[#7c1fd1] transition-all"
                  onClick={() => setUpgradeOpen(true)}
                >
                  升 级
                </Button>
              )}
              {isPlus && (
                <span className="ml-auto px-2 py-0.5 bg-yellow-400 text-xs text-white rounded-full font-bold">PLUS</span>
              )}
            </div>
            {/* 会员到期时间展示 */}
            {isPlus && expireAt && (
              <div className="mt-2 text-xs text-gray-500">到期时间：{formatDate(expireAt)}</div>
            )}
            {isPlus && !isActive && (
              <div className="mt-1 text-xs text-red-500">会员已过期</div>
            )}
          </div>
        </div>
        <UpgradePlusModal open={upgradeOpen} onOpenChange={setUpgradeOpen} onUpgrade={handleUpgrade} />
      </DialogContent>
    </Dialog>
  )
} 