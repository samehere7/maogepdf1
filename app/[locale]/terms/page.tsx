import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '服务条款 | MaogePDF',
  description: 'MaogePDF服务条款和使用协议',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">服务条款</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              最后更新：{new Date().toLocaleDateString('zh-CN')}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. 接受条款</h2>
              <p className="mb-4">
                欢迎使用MaogePDF（"我们"、"我们的"或"服务"）。通过访问或使用我们的服务，您同意受本服务条款（"条款"）的约束。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. 服务描述</h2>
              <p className="mb-4">
                MaogePDF是一个AI驱动的PDF文档分析和对话平台，提供以下功能：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>PDF文档上传和解析</li>
                <li>基于AI的文档问答</li>
                <li>文档内容搜索和分析</li>
                <li>Plus会员高级功能</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Plus会员服务</h2>
              <p className="mb-4">
                Plus会员提供以下增值服务：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>无限PDF上传和处理</li>
                <li>无限AI对话次数</li>
                <li>支持最多2000页的大型文档</li>
                <li>每个文件夹最多50个PDF</li>
                <li>高质量AI模型访问</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. 付费服务</h2>
              <p className="mb-4">
                Plus会员提供月付和年付两种选择：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>月付：$11.99/月，每月自动续费</li>
                <li>年付：$86.40/年，每年自动续费（节省40%）</li>
              </ul>
              <p className="mb-4">
                所有付费服务通过Paddle安全支付平台处理。订阅将自动续费，直到您取消订阅。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. 取消和退款</h2>
              <p className="mb-4">
                您可以随时取消Plus会员订阅。取消后，您将继续享受Plus功能直到当前付费周期结束。
              </p>
              <p className="mb-4">
                我们提供7天无理由退款保证。如需退款，请联系客服：support@maogepdf.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. 用户责任</h2>
              <p className="mb-4">
                用户同意：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>仅上传您拥有合法权利的文档</li>
                <li>不上传包含恶意软件或违法内容的文件</li>
                <li>不滥用服务或尝试绕过使用限制</li>
                <li>保护您的账户安全</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. 隐私保护</h2>
              <p className="mb-4">
                我们重视您的隐私。请查看我们的<a href="/privacy" className="text-purple-600 hover:underline">隐私政策</a>了解我们如何收集、使用和保护您的信息。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. 服务变更</h2>
              <p className="mb-4">
                我们保留随时修改或终止服务的权利。重大变更将提前通知用户。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. 联系我们</h2>
              <p className="mb-4">
                如有任何问题，请联系我们：
              </p>
              <ul className="list-none mb-4">
                <li>邮箱：support@maogepdf.com</li>
                <li>网址：https://maogepdf.com</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}