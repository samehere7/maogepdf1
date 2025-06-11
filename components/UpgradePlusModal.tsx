"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] bg-white rounded-2xl p-0 overflow-hidden">
        <div className="px-8 pt-8 pb-6" style={{padding: '32px 32px 24px'}}>
          <h2 className="text-2xl font-bold mb-6 text-center">升级到 Plus</h2>
          <div className="text-base">
            {[
              { label: '无限', desc: '个PDF' },
              { label: '无限', desc: '个问题' },
              { label: '2,000', desc: '页/PDF' },
              { label: '50', desc: '个PDF/文件夹' },
              { label: '高质量', desc: '模型' },
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
              <button type="button" className="flex-1 relative flex flex-col justify-between h-[76px] text-left text-[15px] leading-[18px] text-[#202020] px-4 py-3 border border-gray-300 rounded-xl bg-white transition-all">
                <div>
                  <div>按月</div>
                  <div className="flex flex-row mt-1 items-end">
                    <div className="font-bold text-[22px] leading-[25px] text-[#404040]">$11.99</div>
                    <div className="ml-1 text-[14px] text-gray-400 pb-0.5">/ 月</div>
                  </div>
                </div>
                <div className="absolute right-4 top-4">{GreenCheckIcon}</div>
              </button>
              {/* 按年 */}
              <button type="button" className="flex-1 relative flex flex-col justify-between h-[76px] text-left text-[15px] leading-[18px] text-[#202020] px-4 py-3 border-2 border-[#a026ff] rounded-xl bg-[#f9f5ff] transition-all shadow-sm">
                <div>
                  <div>按年 <span className="bg-[#2bb86a] text-white px-2 py-[2px] rounded-2xl text-[11px] font-semibold ml-1">立省40%</span></div>
                  <div className="flex flex-row mt-1 items-end">
                    <div className="font-bold text-[22px] leading-[25px] text-[#404040]">$7.2</div>
                    <div className="ml-1 text-[14px] text-gray-400 pb-0.5">/ 月</div>
                  </div>
                </div>
                <span className="absolute right-4 top-4">{GreenCheckIcon}</span>
              </button>
            </div>
            <Button className="w-full h-[48px] mt-5 bg-[#a026ff] text-white text-lg font-bold rounded-xl shadow-lg transition-all hover:bg-[#7c1fd1]" onClick={onUpgrade}>升级到 Plus</Button>
          </div>
        </div>
        {/* 底部用户头像和宣传语 */}
        <div className="flex flex-col items-center pb-4">
          <div className="flex justify-center -space-x-3 mb-2">
            {GreenCheckIcon}{GreenCheckIcon}{GreenCheckIcon}{GreenCheckIcon}
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