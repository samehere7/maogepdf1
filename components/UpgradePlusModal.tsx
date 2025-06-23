"use client"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState } from "react"
import { useTranslations } from 'next-intl'
import { useUser } from '@/components/UserProvider'

interface UpgradePlusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpgrade?: () => void
}

const GreenCheckIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="10" fill="#2bb86a"/>
    <path d="M6 10.5l2.5 2.5L14 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function UpgradePlusModal({ open, onOpenChange, onUpgrade }: UpgradePlusModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { profile } = useUser()

  const handleUpgradeClick = async () => {
    if (!profile?.id) {
      console.error('User not logged in')
      return
    }

    setLoading(true)
    try {
      // 调用支付API获取结账链接
      const response = await fetch('/api/payment/paddle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: profile.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout')
      }

      const data = await response.json()
      
      // 检查是否为测试模式
      if (data.mockPayment) {
        // 模拟成功支付
        alert(`测试模式: ${data.plan} 计划支付模拟成功!`)
        
        // 模拟调用webhook
        await fetch('/api/webhook/paddle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert_name: 'subscription_payment_succeeded',
            event_time: new Date().toISOString(),
            passthrough: JSON.stringify({ userId: profile.id, plan: selectedPlan })
          })
        })
        
        alert('模拟支付完成！请刷新页面查看Plus状态')
      } else {
        // 打开Paddle结账页面
        window.open(data.checkoutUrl, '_blank')
      }
      
      // 调用原始的onUpgrade回调（如果存在）
      if (onUpgrade) {
        onUpgrade()
      }
      
      // 关闭模态框
      onOpenChange(false)
      
    } catch (error) {
      console.error('Payment error:', error)
      alert('支付处理失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] bg-white rounded-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">{t('upgrade.upgradeToPlus')}</DialogTitle>
        <DialogDescription className="sr-only">
          Upgrade to Plus to unlock more features
        </DialogDescription>
        <div className="px-8 pt-8 pb-6" style={{padding: '32px 32px 24px'}}>
          <h2 className="text-2xl font-bold mb-6 text-center">{t('upgrade.upgradeToPlus')}</h2>
          <div className="text-base">
            {[
              { label: t('upgrade.unlimitedPdfs'), desc: t('upgrade.pdfs') },
              { label: t('upgrade.unlimitedQuestions'), desc: t('upgrade.questions') },
              { label: '2,000', desc: t('upgrade.pages') },
              { label: '50', desc: t('upgrade.pdfsFolder') },
              { label: t('upgrade.highQualityModel'), desc: t('upgrade.model') },
            ].map((item, idx) => (
              <div key={item.label+item.desc} className="flex gap-3 items-center" style={{marginTop: idx === 0 ? 0 : 18}}>
                {GreenCheckIcon}
                <div className="text-[16px]"><strong>{item.label}</strong> {item.desc}</div>
              </div>
            ))}
          </div>
          {/* 价格区块 */}
          <div className="flex flex-col gap-2 mt-8">
            <div className="flex gap-4 w-full">
              {/* 按月 */}
              <button 
                type="button" 
                onClick={() => setSelectedPlan('monthly')}
                className={`flex-1 relative flex flex-col justify-between h-[76px] text-left text-[15px] leading-[18px] text-[#202020] px-4 py-3 rounded-xl transition-all ${
                  selectedPlan === 'monthly' 
                    ? 'border-2 border-[#a026ff] bg-[#f9f5ff] shadow-sm' 
                    : 'border border-gray-300 bg-white'
                }`}
              >
                <div>
                  <div>{t('upgrade.monthlyPlan')}</div>
                  <div className="flex flex-row mt-1 items-end">
                    <div className="font-bold text-[22px] leading-[25px] text-[#404040]">$11.99</div>
                    <div className="ml-1 text-[14px] text-gray-400 pb-0.5">{t('upgrade.month')}</div>
                  </div>
                </div>
                {selectedPlan === 'monthly' && <div className="absolute right-4 top-4">{GreenCheckIcon}</div>}
              </button>
              {/* 按年 */}
              <button 
                type="button" 
                onClick={() => setSelectedPlan('yearly')}
                className={`flex-1 relative flex flex-col justify-between h-[76px] text-left text-[15px] leading-[18px] text-[#202020] px-4 py-3 rounded-xl transition-all ${
                  selectedPlan === 'yearly' 
                    ? 'border-2 border-[#a026ff] bg-[#f9f5ff] shadow-sm' 
                    : 'border border-gray-300 bg-white'
                }`}
              >
                <div>
                  <div>{t('upgrade.yearlyPlan')} <span className="bg-[#2bb86a] text-white px-2 py-[2px] rounded-2xl text-[11px] font-semibold ml-1">{t('upgrade.save40Percent')}</span></div>
                  <div className="flex flex-row mt-1 items-end">
                    <div className="font-bold text-[22px] leading-[25px] text-[#404040]">$7.2</div>
                    <div className="ml-1 text-[14px] text-gray-400 pb-0.5">{t('upgrade.month')}</div>
                  </div>
                </div>
                {selectedPlan === 'yearly' && <span className="absolute right-4 top-4">{GreenCheckIcon}</span>}
              </button>
            </div>
            <Button 
              className="w-full h-[48px] mt-5 bg-[#a026ff] text-white text-lg font-bold rounded-xl shadow-lg transition-all hover:bg-[#7c1fd1] disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={handleUpgradeClick}
              disabled={loading || !profile?.id}
            >
              {loading ? '处理中...' : t('upgrade.upgradeToPlus')}
            </Button>
          </div>
        </div>
        {/* 底部用户头像和宣传语 */}
        <div className="flex flex-col items-center pb-4">
          <div className="flex justify-center -space-x-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg">👨🏼‍💼</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
              <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-lg">👩🏻‍💻</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
              <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-lg">👨🏻‍🔬</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
              <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center text-lg">👩🏼‍🎓</div>
            </div>
          </div>
          <div className="text-center mt-1">
            <div className="text-xs text-gray-500 leading-[15.3px]">Beloved by</div>
            <div className="text-[14px] font-semibold text-[#070d1b] leading-[17.85px]">{t('upgrade.trustedByResearchers')}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 