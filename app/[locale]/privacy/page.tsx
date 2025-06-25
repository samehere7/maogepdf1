import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隐私政策 | MaogePDF',
  description: 'MaogePDF隐私政策和数据保护说明',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">隐私政策</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              最后更新：{new Date().toLocaleDateString('zh-CN')}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. 信息收集</h2>
              <p className="mb-4">
                我们收集以下类型的信息：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>账户信息</strong>：邮箱地址、用户名等注册信息</li>
                <li><strong>使用数据</strong>：您上传的PDF文档、对话记录、使用统计</li>
                <li><strong>技术信息</strong>：IP地址、浏览器类型、设备信息</li>
                <li><strong>支付信息</strong>：通过Paddle处理，我们不存储支付卡信息</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. 信息使用</h2>
              <p className="mb-4">
                我们使用收集的信息用于：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>提供和改进服务功能</li>
                <li>处理您的PDF文档和AI对话请求</li>
                <li>管理您的账户和订阅</li>
                <li>发送服务相关通知</li>
                <li>分析服务使用情况以优化性能</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. 数据存储</h2>
              <p className="mb-4">
                您的数据存储在以下位置：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>文档存储</strong>：Supabase云数据库（加密存储）</li>
                <li><strong>AI处理</strong>：通过OpenRouter API处理，不长期存储</li>
                <li><strong>用户数据</strong>：Supabase Authentication系统</li>
                <li><strong>支付数据</strong>：Paddle支付平台（PCI DSS合规）</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. 数据共享</h2>
              <p className="mb-4">
                我们不会向第三方出售您的个人信息。我们可能在以下情况下共享数据：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>服务提供商</strong>：Supabase、OpenRouter、Paddle等技术服务商</li>
                <li><strong>法律要求</strong>：遵守法律法规或司法程序</li>
                <li><strong>安全保护</strong>：保护用户和服务安全</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. 数据安全</h2>
              <p className="mb-4">
                我们采取以下安全措施保护您的数据：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>数据传输和存储加密</li>
                <li>访问控制和身份验证</li>
                <li>定期安全审计</li>
                <li>员工数据保护培训</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. 您的权利</h2>
              <p className="mb-4">
                您有以下权利：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>访问权</strong>：查看我们持有的您的个人信息</li>
                <li><strong>更正权</strong>：要求更正不准确的信息</li>
                <li><strong>删除权</strong>：要求删除您的个人信息</li>
                <li><strong>数据可携权</strong>：以结构化格式获取您的数据</li>
                <li><strong>撤回同意</strong>：随时撤回对数据处理的同意</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Cookie使用</h2>
              <p className="mb-4">
                我们使用Cookie和类似技术来：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>保持您的登录状态</li>
                <li>记住您的偏好设置</li>
                <li>分析网站使用情况</li>
                <li>提供个性化体验</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. 数据保留</h2>
              <p className="mb-4">
                我们按照以下原则保留数据：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>账户数据：直到您删除账户</li>
                <li>PDF文档：您可随时删除</li>
                <li>对话记录：保留用于服务改进</li>
                <li>支付记录：按法律要求保留</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. 儿童隐私</h2>
              <p className="mb-4">
                我们的服务不面向13岁以下儿童。我们不会故意收集儿童的个人信息。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. 政策更新</h2>
              <p className="mb-4">
                我们可能会定期更新本隐私政策。重大变更将通过邮件或网站通知您。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. 联系我们</h2>
              <p className="mb-4">
                如有隐私相关问题，请联系我们：
              </p>
              <ul className="list-none mb-4">
                <li>公司：四川壳叽互联网信息服务有限公司</li>
                <li>地址：四川省内江市东兴区兰桂大道337号孵化器</li>
                <li>邮箱：maogepdf@163.com</li>
                <li>客服邮箱：maogepdf@163.com</li>
                <li>网址：https://maogepdf.com</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}