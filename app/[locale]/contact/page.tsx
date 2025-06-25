import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '联系我们 | MaogePDF',
  description: '联系MaogePDF客服团队，获取技术支持和服务帮助',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">联系我们</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 联系信息 */}
            <div>
              <h2 className="text-xl font-semibold mb-6">联系方式</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.947a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">客服邮箱</h3>
                    <p className="text-gray-600">maogepdf@163.com</p>
                    <p className="text-sm text-gray-500 mt-1">我们会在1-2个工作日内回复</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">官方网站</h3>
                    <p className="text-gray-600">https://maogepdf.com</p>
                    <p className="text-sm text-gray-500 mt-1">访问我们的官网了解更多功能</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">客服时间</h3>
                    <p className="text-gray-600">周一至周五 9:00-18:00</p>
                    <p className="text-sm text-gray-500 mt-1">北京时间（UTC+8）</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">公司信息</h3>
                    <p className="text-gray-600">四川壳叽互联网信息服务有限公司</p>
                    <p className="text-sm text-gray-500 mt-1">四川省内江市东兴区兰桂大道337号孵化器</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">🚀 Plus会员专属支持</h3>
                <p className="text-yellow-800 text-sm">
                  Plus会员享有优先客服支持，平均响应时间不超过12小时。
                </p>
              </div>
            </div>

            {/* 常见问题 */}
            <div>
              <h2 className="text-xl font-semibold mb-6">常见问题</h2>
              
              <div className="space-y-4">
                <details className="group">
                  <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium">如何升级到Plus会员？</span>
                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-2 p-4 text-sm text-gray-600">
                    点击右上角头像 → 我的账户 → 升级按钮，选择月付或年付计划即可。支持信用卡、PayPal等多种支付方式。
                  </div>
                </details>

                <details className="group">
                  <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium">PDF处理失败怎么办？</span>
                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-2 p-4 text-sm text-gray-600">
                    请检查PDF文件大小是否超限（免费版最大10MB，Plus会员支持更大文件）。如果问题持续，请联系客服并提供错误截图。
                  </div>
                </details>

                <details className="group">
                  <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium">如何取消Plus订阅？</span>
                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-2 p-4 text-sm text-gray-600">
                    在我的账户页面可以管理订阅，或发送邮件到maogepdf@163.com申请取消。取消后您仍可使用Plus功能直到当前周期结束。
                  </div>
                </details>

                <details className="group">
                  <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium">数据安全如何保障？</span>
                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-2 p-4 text-sm text-gray-600">
                    我们使用企业级加密存储，所有数据传输采用HTTPS加密。您可以随时删除上传的文档，我们不会与第三方分享您的文件内容。
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* 支持类型 */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6">我们能为您提供什么帮助？</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-2">技术支持</h3>
                <p className="text-sm text-gray-600">功能使用问题、错误报告、性能优化建议</p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-2">付费支持</h3>
                <p className="text-sm text-gray-600">订阅管理、支付问题、退款申请、发票需求</p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-2">产品建议</h3>
                <p className="text-sm text-gray-600">功能建议、产品反馈、合作咨询、API接入</p>
              </div>
            </div>
          </div>

          {/* 紧急联系 */}
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-900 mb-2">🆘 紧急情况</h3>
            <p className="text-red-800 text-sm">
              如遇账户安全问题、数据丢失或其他紧急情况，请立即发送邮件至 
              <strong> maogepdf@163.com</strong>，我们将优先处理。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}