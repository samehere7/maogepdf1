import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md p-6">
        <div className="text-gray-400 text-8xl mb-4">404</div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">页面未找到</h1>
        <p className="text-gray-600 mb-6">
          抱歉，您访问的页面不存在。如果这是一个分享链接，请检查链接是否正确或联系分享者。
        </p>
        
        <div className="space-y-3">
          <Button asChild className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed]">
            <Link href="/">返回首页</Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            className="w-full"
          >
            <Link href="/auth/login">登录账户</Link>
          </Button>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">💡 分享链接问题？</h3>
          <p className="text-sm text-blue-700">
            如果您是通过分享链接访问的，请：
            <br />• 检查链接是否完整
            <br />• 尝试重新获取分享链接
            <br />• 登录后再次尝试访问
          </p>
        </div>
      </div>
    </div>
  )
}