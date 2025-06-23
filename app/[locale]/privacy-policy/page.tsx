"use client"

import { useTranslations } from 'next-intl'

export default function PrivacyPolicyPage() {
  const t = useTranslations()
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t('footer.privacyPolicy')}</h1>
      <div className="prose prose-lg max-w-none space-y-6">
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. 信息收集</h2>
          <p className="text-gray-700">我们收集以下信息：</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>账户信息（邮箱、姓名）</li>
            <li>使用数据（上传的PDF、对话记录）</li>
            <li>技术信息（IP地址、浏览器类型）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. 信息使用</h2>
          <p className="text-gray-700">我们使用您的信息来：</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>提供和改进服务</li>
            <li>处理付款和订阅</li>
            <li>发送重要通知</li>
            <li>防止欺诈和滥用</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. 信息共享</h2>
          <p className="text-gray-700">我们不会出售您的个人信息。我们可能与以下第三方共享信息：</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Google（认证服务）</li>
            <li>Paddle（支付处理）</li>
            <li>Supabase（数据存储）</li>
            <li>OpenRouter（AI服务）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. 数据安全</h2>
          <p className="text-gray-700">我们采用行业标准的安全措施保护您的数据：</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>SSL加密传输</li>
            <li>访问控制和权限管理</li>
            <li>定期安全审计</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. 数据保留</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>账户数据：账户活跃期间保留</li>
            <li>使用数据：最多保疙2年</li>
            <li>删除账户后30天内清除所有数据</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. 您的权利</h2>
          <p className="text-gray-700">您有权：</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>访问您的个人数据</li>
            <li>更正不准确的信息</li>
            <li>删除您的账户和数据</li>
            <li>数据可携带性</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Cookie使用</h2>
          <p className="text-gray-700">我们使用Cookie来：</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>维持登录状态</li>
            <li>记住用户偏好</li>
            <li>分析网站使用情况</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. 联系我们</h2>
          <p className="text-gray-700">
            隐私相关问题请联系：<a href="mailto:privacy@yourapp.com" className="text-blue-600 hover:underline">privacy@yourapp.com</a>
          </p>
        </section>

        <div className="text-sm text-gray-500 mt-8 pt-4 border-t">
          <p>最后更新：{new Date().toLocaleDateString('zh-CN')}</p>
        </div>
      </div>
    </div>
  )
} 