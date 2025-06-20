"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface FileSizeUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  fileSizeMB: number
  onUpgrade?: () => void
}

const GreenCheckIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="10" fill="#2bb86a"/>
    <path d="M6 10.5l2.5 2.5L14 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function FileSizeUpgradeModal({ open, onOpenChange, fileName, fileSizeMB, onUpgrade }: FileSizeUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] bg-white rounded-2xl p-0 overflow-hidden">
        <div className="px-8 pt-8 pb-6" style={{padding: '32px 32px 24px'}}>
          {/* 文件信息提示 */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <div className="flex-1">
                <div className="text-orange-800 font-medium text-sm mb-1">
                  {fileName} 太大了
                </div>
                <div className="text-orange-600 text-sm">
                  {fileSizeMB}MB，升级到 Plus 以继续使用。
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-center">升级到 Plus</h2>
          <div className="text-base">
            {[
              { label: '无限', desc: '个PDF' },
              { label: '无限', desc: '个问题' },
              { label: '2,000', desc: '页/PDF' },
              { label: '50', desc: '个PDF/文件夹' },
              { label: '无限制', desc: '文件大小' },
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
                  <div>按月</div>
                  <div className="flex flex-row mt-1 items-end">
                    <div className="font-bold text-[22px] leading-[25px] text-[#404040]">$11.99</div>
                    <div className="ml-1 text-[14px] text-gray-400 pb-0.5">/ 月</div>
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
                  <div>按年 <span className="bg-[#2bb86a] text-white px-2 py-[2px] rounded-2xl text-[11px] font-semibold ml-1">立省40%</span></div>
                  <div className="flex flex-row mt-1 items-end">
                    <div className="font-bold text-[22px] leading-[25px] text-[#404040]">$7.2</div>
                    <div className="ml-1 text-[14px] text-gray-400 pb-0.5">/ 月</div>
                  </div>
                </div>
                {selectedPlan === 'yearly' && <span className="absolute right-4 top-4">{GreenCheckIcon}</span>}
              </button>
            </div>
            <Button className="w-full h-[48px] mt-5 bg-[#a026ff] text-white text-lg font-bold rounded-xl shadow-lg transition-all hover:bg-[#7c1fd1]" onClick={onUpgrade}>升级到 Plus</Button>
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
            <div className="text-xs text-gray-500 leading-[15.3px]">深受喜爱</div>
            <div className="text-[14px] font-semibold text-[#070d1b] leading-[17.85px]">超过1000万研究人员</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}