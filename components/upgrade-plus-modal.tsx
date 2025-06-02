import React from "react"
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface UpgradePlusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  fileSizeMB: number
}

export const UpgradePlusModal: React.FC<UpgradePlusModalProps> = ({ open, onOpenChange, fileName, fileSizeMB }) => {
  const [yearly, setYearly] = React.useState(true)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay />
      <DialogContent className="max-w-2xl p-0 flex rounded-2xl overflow-hidden shadow-2xl">
        {/* 左侧插画 */}
        <div className="hidden md:flex items-center justify-center bg-[#f7eaff] w-1/2 min-h-[480px]">
          <svg width="180" height="260" viewBox="0 0 180 260" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 这里可插入更精细的SVG插画，先用简化版 */}
            <rect x="30" y="40" width="120" height="180" rx="60" fill="#a78bfa" fillOpacity="0.2" />
            <path d="M90 60 Q110 100 90 180 Q70 100 90 60 Z" fill="#a78bfa" fillOpacity="0.5" />
            <circle cx="90" cy="100" r="30" fill="#a78bfa" />
          </svg>
        </div>
        {/* 右侧内容 */}
        <div className="flex-1 bg-white p-8 flex flex-col justify-between min-h-[480px]">
          {/* 顶部提示 */}
          <div>
            <div className="bg-[#fff3e0] text-[#e57373] rounded-lg px-4 py-2 text-sm flex items-center mb-6">
              <span className="mr-2">🔴</span>
              <span>
                <b>{fileName}</b> 大小为 <b>{fileSizeMB}MB</b>。升级到 Plus 以继续使用。
              </span>
            </div>
            {/* 标题 */}
            <div className="text-2xl font-bold mb-4">升级到 Plus</div>
            {/* 权益列表 */}
            <ul className="mb-6 space-y-2 text-base text-slate-700">
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> 无限 个PDF</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> 无限 问题</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> 2,000 页/PDF</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> 50 个PDF/文件夹</li>
              <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> 高质量 模型</li>
            </ul>
            {/* 价格切换 */}
            <div className="flex items-center mb-6 gap-0.5 w-full max-w-[340px] mx-auto">
              <button
                className={`flex-1 min-w-0 px-0 py-2 rounded-l-lg border border-[#8b5cf6] font-semibold text-base transition-colors duration-150 h-12 whitespace-nowrap ${!yearly ? 'bg-[#8b5cf6] text-white' : 'bg-white text-[#8b5cf6]'}`}
                onClick={() => setYearly(false)}
              >
                <div className="flex flex-col items-center justify-center leading-tight">
                  <span>按月</span>
                  <span>$13.99/月</span>
                </div>
              </button>
              <button
                className={`flex-1 min-w-0 px-0 py-2 rounded-r-lg border border-l-0 border-[#8b5cf6] font-semibold text-base transition-colors duration-150 h-12 whitespace-nowrap ${yearly ? 'bg-[#8b5cf6] text-white' : 'bg-white text-[#8b5cf6]'}`}
                onClick={() => setYearly(true)}
              >
                <div className="flex flex-col items-center justify-center leading-tight">
                  <span>按年 <span className="text-green-200 font-bold ml-1">立省40%</span></span>
                  <span>$8.25/月</span>
                </div>
              </button>
            </div>
            {/* 升级按钮 */}
            <Button className="w-full h-12 text-lg bg-[#8b5cf6] hover:bg-[#7c3aed]">升级到 Plus</Button>
            {/* 登录提示 */}
            <div className="text-center text-sm text-slate-500 mt-4">
              已有账号？<a href="/" className="text-[#8b5cf6] ml-1">登录</a>
            </div>
          </div>
          {/* 用户背书 */}
          <div className="flex items-center justify-center mt-8">
            <div className="flex -space-x-2">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" className="w-8 h-8 rounded-full border-2 border-white" />
              <img src="https://randomuser.me/api/portraits/women/44.jpg" className="w-8 h-8 rounded-full border-2 border-white" />
              <img src="https://randomuser.me/api/portraits/men/65.jpg" className="w-8 h-8 rounded-full border-2 border-white" />
              <img src="https://randomuser.me/api/portraits/women/12.jpg" className="w-8 h-8 rounded-full border-2 border-white" />
            </div>
            <span className="ml-3 text-slate-500 text-xs">深受喜爱 超过1000万研究人员</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 