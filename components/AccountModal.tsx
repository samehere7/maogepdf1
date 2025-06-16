"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import UpgradePlusModal from "@/components/UpgradePlusModal"
import { useState, useEffect } from "react"
import { useUser } from "@/components/UserProvider"
import { supabase } from "@/lib/supabase/client"

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
  const pdfQuotaLimit = 2;
  const chatQuotaLimit = 20;
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const { profile, setProfile } = useUser();
  const [quota, setQuota] = useState<{pdf_count: number, chat_count: number, quota_date: string}>({pdf_count: 0, chat_count: 0, quota_date: ''});

  // 升级按钮逻辑
  const handleUpgrade = async () => {
    try {
      // 尝试从user_with_plus视图获取数据
      const { data, error } = await supabase
        .from("user_with_plus")
        .select("plus, expire_at, is_active")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setProfile({
          ...profile,
          ...data,
          id: profile?.id || user.id,
          email: profile?.email || user.email
        });
      }
    } catch (error) {
      console.error('无法从user_with_plus获取数据:', error);
      
      // 如果视图不可用，直接更新profile
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
    alert("升级成功！");
  }

  // 会员身份与有效期判断
  const isPlus = profile?.plus === true;
  const isActive = profile?.is_active === true;
  const expireAt = profile?.expire_at;

  // 拉取并刷新非plus用户每日额度
  useEffect(() => {
    if (!user?.id || isPlus) return;
    const fetchQuota = async () => {
      try {
        const { data, error } = await supabase
          .from('user_daily_quota')
          .select('pdf_count, chat_count, quota_date')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        if (!data) return;
        
        const today = new Date().toISOString().slice(0, 10);
        if (data.quota_date !== today) {
          // 新的一天，重置额度
          await supabase
            .from('user_daily_quota')
            .update({ pdf_count: 0, chat_count: 0, quota_date: today })
            .eq('id', user.id);
          setQuota({ pdf_count: 0, chat_count: 0, quota_date: today });
        } else {
          setQuota(data);
        }
      } catch (error) {
        // 完全静默处理权限错误，使用默认值
        console.debug('配额查询失败（已忽略）:', error.code);
        // 如果表不存在或权限不足，使用默认值
        setQuota({ pdf_count: 0, chat_count: 0, quota_date: new Date().toISOString().slice(0, 10) });
      }
    };
    fetchQuota();
  }, [user?.id, isPlus, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] bg-white rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="flex items-center justify-between px-6 pt-5 pb-3 border-b">
          <DialogTitle className="text-lg font-semibold">我的账户</DialogTitle>
        </DialogHeader>
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
        {/* 今日免费用量（非plus用户显示） */}
        {!isPlus && (
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 text-sm">今日免费使用量</span>
            <span className="text-xs text-gray-400">将在 8:00 AM 重置</span>
          </div>
          {/* 进度条 */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div className="bg-purple-500 h-2" style={{ width: `${Math.min((quota.pdf_count/pdfQuotaLimit)*100, 100)}%` }} />
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-2" style={{ width: `${Math.min((quota.chat_count/chatQuotaLimit)*100, 100)}%` }} />
                </div>
              </div>
              <div className="flex flex-col text-xs text-gray-700 whitespace-nowrap ml-2">
                <span>{quota.pdf_count}/{pdfQuotaLimit} 个PDF</span>
                <span>{quota.chat_count}/{chatQuotaLimit} 条消息</span>
              </div>
            </div>
          </div>
        )}
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
            {/* 会员到期时间展示和权益说明 */}
            {isPlus && expireAt && (
              <div className="mt-2 text-xs text-gray-500">到期时间：{formatDate(expireAt)}</div>
            )}
            {isPlus && !isActive && (
              <div className="mt-1 text-xs text-red-500">会员已过期</div>
            )}
            {/* plus会员权益说明 */}
            {isPlus && isActive && (
              <div className="mt-4 p-3 bg-purple-50 rounded text-xs text-purple-800 border border-purple-200">
                <div className="font-bold mb-1">Plus会员专属权益：</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>无限上传PDF文件，无数量限制</li>
                  <li>无限次AI对话，无次数限制</li>
                  <li>单个PDF支持最大2000页，文件大小无限制</li>
                  <li>每个文件夹最多可存放50个PDF</li>
                  <li>支持高质量模型对话</li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <UpgradePlusModal open={upgradeOpen} onOpenChange={setUpgradeOpen} onUpgrade={handleUpgrade} />
      </DialogContent>
    </Dialog>
  )
} 