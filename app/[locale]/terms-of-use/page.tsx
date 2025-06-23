"use client"

import { useTranslations } from 'next-intl'

export default function TermsOfUsePage() {
  const t = useTranslations()
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t('footer.termsOfService')}</h1>
      <div className="prose prose-lg max-w-none space-y-6">
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. 服务描述</h2>
          <p className="text-gray-700">
            本服务提供基于AI的PDF文档分析和对话功能，包括：
          </p>
          <ul className="list-disc pl-6 text-gray-700">
            <li>PDF文档上传和分析</li>
            <li>智能问答功能</li>
            <li>Plus会员高级功能</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Plus会员服务</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>月度订阅：$11.99/月</li>
            <li>年度订阅：$86.40/年（相当于$7.20/月）</li>
            <li>自动续费，可随时取消</li>
            <li>提供无限PDF上传、无限对话等高级功能</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. 付款和退款</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>所有付款通过Paddle安全处理</li>
            <li>自动续费可在账户设置中管理</li>
            <li>退款政策：订阅7天内可申请全额退款</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. 用户义务</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>提供准确的账户信息</li>
            <li>不上传违法或有害内容</li>
            <li>不滥用服务或进行恶意活动</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. 服务限制</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>服务可用性不保证100%</li>
            <li>我们保留终止滥用账户的权利</li>
            <li>AI回答仅供参考，不构成专业建议</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. 知识产权</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>用户保留上传内容的所有权</li>
            <li>我们保留服务技术和界面的知识产权</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. 责任限制</h2>
          <p className="text-gray-700">
            在法律允许的最大范围内，我们不对以下情况承担责任：
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>服务中断或数据丢失</li>
            <li>因使用服务而产生的间接损失</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. 联系方式</h2>
          <p className="text-gray-700">
            如有疑问，请联系：<a href="mailto:support@yourapp.com" className="text-blue-600 hover:underline">support@yourapp.com</a>
          </p>
        </section>

        <div className="text-sm text-gray-500 mt-8 pt-4 border-t">
          <p>最后更新：{new Date().toLocaleDateString('zh-CN')}</p>
        </div>
      </div>
    </div>
  )
} 