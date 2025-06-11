import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function UpgradePlusSection() {
  return (
    <div className="flex flex-col md:flex-row items-center bg-white rounded-2xl shadow-lg p-6 gap-8 max-w-3xl mx-auto my-8">
      {/* 左侧配图 */}
      <div className="flex-shrink-0">
        <Image
          src="/super-woman.jpg"
          alt="super-woman"
          width={220}
          height={220}
          style={{ borderRadius: "24px 0 0 24px" }}
        />
      </div>
      {/* 右侧内容 */}
      <div className="flex-grow text-left">
        <div className="mb-4">
          <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">Plus 会员</span>
          <h2 className="text-2xl font-bold mb-2">升级到 Plus</h2>
          <p className="text-gray-700 mb-2">无限个PDF · 无限提问 · 高质量模型</p>
          <p className="text-gray-500 text-sm mb-4">深受喜爱，超过1000万研究人员选择</p>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-3xl font-extrabold text-purple-700">$12</span>
            <span className="text-base text-gray-600 mb-1">/ 月</span>
          </div>
          <Button
            className="bg-[#a026ff] hover:bg-[#7c1ecb] text-white font-semibold px-8 py-2 rounded-lg text-base shadow-md button-primary"
            style={{ height: 40 }}
            onClick={() => alert('升级功能开发中，敬请期待！')}
          >
            升级到 Plus
          </Button>
        </div>
      </div>
    </div>
  )
} 