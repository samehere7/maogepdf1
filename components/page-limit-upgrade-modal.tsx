"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, FileText, Zap, Crown, Users } from "lucide-react"
import { useTranslations } from 'next-intl'

interface PageLimitUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  currentPages: number
  maxPages: number
  userType: 'free' | 'plus'
}

export default function PageLimitUpgradeModal({ 
  open, 
  onOpenChange, 
  fileName, 
  currentPages, 
  maxPages,
  userType 
}: PageLimitUpgradeModalProps) {
  const t = useTranslations()

  const handleUpgrade = () => {
    // 跳转到升级页面或打开支付流程
    window.open('https://buy.stripe.com/your-payment-link', '_blank')
  }

  const isFreeUser = userType === 'free'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-red-500" />
            {isFreeUser ? '页数超出免费限制' : '页数超出Plus限制'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 文件信息 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-medium text-red-800">文件页数超出限制</span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              <div>文件名：{fileName}</div>
              <div>文件页数：<span className="font-semibold">{currentPages}页</span></div>
              <div>{isFreeUser ? '免费' : 'Plus'}用户限制：<span className="font-semibold">{maxPages}页</span></div>
              <div className="text-red-600 font-medium">超出页数：{currentPages - maxPages}页</div>
            </div>
          </div>

          {isFreeUser ? (
            // 免费用户升级到Plus
            <>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">升级到 Plus 解锁更大文档支持</h3>
                <p className="text-gray-600">Plus会员可处理高达2000页的PDF文档</p>
              </div>

              {/* Plus功能列表 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>无限个PDF文档</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>无限个问题</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="font-semibold text-purple-600">2000页PDF文档支持</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>50个PDF文件共享</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>高质量模型</span>
                </div>
              </div>

              {/* 价格展示 */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Plus会员</span>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    立省40%
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-purple-600">$8.25</span>
                  <span className="text-gray-600">/ 月</span>
                  <span className="text-sm text-gray-500 line-through ml-2">$13.99</span>
                </div>
              </div>

              {/* 用户评价 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">深受喜爱</span>
                </div>
                <div className="text-sm text-gray-700">超过1000万研究人员</div>
              </div>

              {/* 升级按钮 */}
              <Button 
                onClick={handleUpgrade}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-lg font-semibold"
              >
                <Zap className="h-5 w-5 mr-2" />
                升级到 Plus
              </Button>
            </>
          ) : (
            // Plus用户超出2000页限制
            <>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 text-red-600">文档页数超出Plus限制</h3>
                <p className="text-gray-600">Plus会员最多支持2000页PDF文档</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-800">
                  <div className="font-medium mb-2">建议解决方案：</div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>将大文档拆分为多个较小的PDF文件</li>
                    <li>使用PDF工具删除不必要的页面</li>
                    <li>联系客服了解企业版解决方案</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  我知道了
                </Button>
                <Button 
                  onClick={() => window.open('mailto:support@maogepdf.com', '_blank')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  联系客服
                </Button>
              </div>
            </>
          )}

          {/* 关闭按钮 */}
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}