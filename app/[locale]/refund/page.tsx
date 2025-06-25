import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '退款政策 | MaogePDF',
  description: 'MaogePDF Plus会员退款政策和流程',
}

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">退款政策</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              最后更新：{new Date().toLocaleDateString('zh-CN')}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. 退款保证</h2>
              <p className="mb-4">
                我们为MaogePDF Plus会员提供<strong>7天无理由退款保证</strong>。如果您对我们的服务不满意，可以在购买后7天内申请全额退款。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. 退款条件</h2>
              <p className="mb-4">
                以下情况符合退款条件：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>在购买Plus会员后7天内提出申请</li>
                <li>服务存在技术问题且无法及时解决</li>
                <li>对服务功能不满意</li>
                <li>意外重复购买</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. 退款流程</h2>
              <p className="mb-4">
                申请退款请按以下步骤操作：
              </p>
              <ol className="list-decimal pl-6 mb-4">
                <li>发送邮件至 <strong>maogepdf@163.com</strong></li>
                <li>邮件主题：申请Plus会员退款</li>
                <li>提供以下信息：
                  <ul className="list-disc pl-6 mt-2">
                    <li>注册邮箱地址</li>
                    <li>购买时间</li>
                    <li>Paddle订单号（如有）</li>
                    <li>退款原因</li>
                  </ul>
                </li>
                <li>我们将在1-2个工作日内回复处理结果</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. 退款时间</h2>
              <p className="mb-4">
                退款处理时间：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>审核时间</strong>：收到申请后1-2个工作日</li>
                <li><strong>处理时间</strong>：通过Paddle支付平台处理，通常3-5个工作日</li>
                <li><strong>到账时间</strong>：根据您的支付方式，可能需要额外1-7个工作日</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. 部分退款</h2>
              <p className="mb-4">
                以下情况可能适用部分退款：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>年付用户在使用几个月后申请退款</li>
                <li>因我们服务中断造成的损失补偿</li>
                <li>特殊情况下的协商解决</li>
              </ul>
              <p className="mb-4">
                部分退款金额将按实际使用时间计算。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. 不符合退款的情况</h2>
              <p className="mb-4">
                以下情况不符合退款条件：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>超过7天退款期限</li>
                <li>已大量使用Plus功能（如处理大量PDF文档）</li>
                <li>违反服务条款导致账户被封</li>
                <li>因用户自身网络问题无法使用服务</li>
                <li>对免费版本功能的不满意</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. 自动续费取消</h2>
              <p className="mb-4">
                如不希望自动续费，您可以：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>在账户设置中取消订阅</li>
                <li>联系客服协助取消</li>
                <li>通过Paddle客户门户管理订阅</li>
              </ul>
              <p className="mb-4">
                取消订阅后，您仍可使用Plus功能直到当前付费期结束。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. 争议解决</h2>
              <p className="mb-4">
                如果您对退款决定有异议：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>可向我们的客服主管申请复审</li>
                <li>提供更详细的情况说明</li>
                <li>我们将公平公正地重新评估</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. 支付平台政策</h2>
              <p className="mb-4">
                我们通过Paddle处理所有支付和退款。某些情况下，退款政策可能受到Paddle条款的限制。我们会尽力为您争取最好的解决方案。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. 联系客服</h2>
              <p className="mb-4">
                退款相关问题请联系：
              </p>
              <ul className="list-none mb-4">
                <li><strong>公司</strong>：四川壳叽互联网信息服务有限公司</li>
                <li><strong>地址</strong>：四川省内江市东兴区兰桂大道337号孵化器</li>
                <li><strong>邮箱</strong>：maogepdf@163.com</li>
                <li><strong>主题</strong>：Plus会员退款申请</li>
                <li><strong>响应时间</strong>：1-2个工作日</li>
              </ul>
              <p className="mb-4">
                我们承诺提供友好、专业的客户服务，确保您的问题得到及时解决。
              </p>
            </section>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
              <h3 className="font-semibold text-blue-900 mb-2">💡 小贴士</h3>
              <p className="text-blue-800 text-sm">
                建议在购买Plus会员后立即体验所有功能，确保服务符合您的需求。如有任何问题，请及时联系我们的客服团队。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}