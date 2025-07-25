"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import UpgradePlusModal from "@/components/UpgradePlusModal"
import { useState, useEffect } from "react"
import { useUser } from "@/components/UserProvider"
import { supabase } from "@/lib/supabase/client"
import { useTranslations } from 'next-intl'

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
  const pdfQuotaLimit = 3;
  const chatQuotaLimit = 20;
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const { profile, setProfile } = useUser();
  const [quota, setQuota] = useState<{pdf_count: number, chat_count: number, quota_date: string}>({pdf_count: 0, chat_count: 0, quota_date: ''});
  const t = useTranslations();

  // 刷新用户Plus状态的函数
  const refreshPlusStatus = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Refreshing Plus status for user:', user.id);
      
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
          console.log('Plus状态刷新成功:', updatedProfile);
          setProfile(updatedProfile);
        } else {
          throw new Error('Failed to fetch updated profile');
        }
      } else {
        throw new Error('No access token available');
      }
    } catch (error) {
      console.error('获取Plus状态失败:', error);
      throw error;
    }
  };

  // 升级按钮逻辑
  const handleUpgrade = async () => {
    try {
      await refreshPlusStatus();
      setUpgradeOpen(false);
      alert(t('user.upgradeSuccess'));
    } catch (error) {
      console.error('升级处理失败:', error);
      alert('无法获取会员状态，请稍后重试或联系客服');
    }
  };

  // 会员身份与有效期判断
  const isPlus = profile?.plus === true;
  const isActive = profile?.is_active === true;
  const expireAt = profile?.expire_at;

  // 自动刷新Plus状态（每次打开模态框时）
  useEffect(() => {
    if (!open || !user?.id) return;
    
    const autoRefreshStatus = async () => {
      try {
        await refreshPlusStatus();
      } catch (error) {
        console.warn('自动刷新Plus状态失败:', error);
      }
    };
    
    autoRefreshStatus();
  }, [open, user?.id]);

  // 拉取并刷新非plus用户每日额度
  useEffect(() => {
    if (!user?.id || isPlus) return;
    const fetchQuota = async () => {
      try {
        // 获取用户session以获取access_token
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          // 通过API端点获取配额数据
          const response = await fetch('/api/user/quota', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const { quota: quotaData } = await response.json();
            setQuota(quotaData);
          } else {
            throw new Error('Failed to fetch quota data');
          }
        } else {
          throw new Error('No access token available');
        }
      } catch (error) {
        // 记录错误但不影响用户体验
        console.warn('配额查询失败，使用默认值:', error);
        // 使用默认值确保组件正常工作
        setQuota({ pdf_count: 0, chat_count: 0, quota_date: new Date().toISOString().slice(0, 10) });
      }
    };
    fetchQuota();
  }, [user?.id, isPlus, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] bg-white rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="flex items-center justify-between px-6 pt-5 pb-3 border-b">
          <DialogTitle className="text-lg font-semibold">{t('user.myAccount')}</DialogTitle>
        </DialogHeader>
        {/* 邮箱+退出 */}
        <div className="flex items-center px-6 py-4">
          <span className="text-gray-900 font-medium">{user?.email}</span>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={onSignOut}
          >
{t('user.signOut')}
          </Button>
        </div>
        {/* 今日免费用量（非plus用户显示） */}
        {!isPlus && (
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 text-sm">{t('user.todayFreeUsage')}</span>
            <span className="text-xs text-gray-400">{t('user.resetAt')}</span>
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
                <span>{quota.pdf_count}/{pdfQuotaLimit} {t('user.pdfs')}</span>
                <span>{quota.chat_count}/{chatQuotaLimit} {t('user.messages')}</span>
              </div>
            </div>
          </div>
        )}
        {/* 方案信息 */}
        <div className="px-6 py-3 border-t">
          <div className="flex flex-col px-6 py-4 border-t border-gray-100">
            <div className="flex items-center">
              <span className="text-gray-700 text-sm font-medium">
{isPlus ? (isActive ? t('user.plusMemberActive') : t('user.plusMemberExpired')) : t('user.freePlan')}
              </span>
              {!isPlus && (
            <Button className="ml-auto bg-[#a026ff] text-white rounded-lg px-6 h-9 text-base font-semibold shadow-none hover:bg-[#7c1fd1] transition-all"
              onClick={() => setUpgradeOpen(true)}
            >
{t('user.upgrade')}
            </Button>
              )}
              {isPlus && (
                <span className="ml-auto px-2 py-0.5 bg-yellow-400 text-xs text-white rounded-full font-bold">PLUS</span>
              )}
            </div>
            {/* 会员到期时间展示和权益说明 */}
            {isPlus && expireAt && (
              <div className="mt-2 text-xs text-gray-500">{t('user.expiresAt')}：{formatDate(expireAt)}</div>
            )}
            {isPlus && !isActive && (
              <div className="mt-1 text-xs text-red-500">{t('user.membershipExpired')}</div>
            )}
            {/* plus会员权益说明 */}
            {isPlus && isActive && (
              <div className="mt-4 p-3 bg-purple-50 rounded text-xs text-purple-800 border border-purple-200">
                <div className="font-bold mb-1">{t('user.plusBenefits')}</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t('user.unlimitedPdfs')}</li>
                  <li>{t('user.unlimitedChats')}</li>
                  <li>{t('user.maxPages')}</li>
                  <li>{t('user.maxPdfsPerFolder')}</li>
                  <li>{t('user.highQualityModel')}</li>
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