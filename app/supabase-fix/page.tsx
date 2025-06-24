"use client"

import { useState } from 'react'

export default function SupabaseFix() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-red-600">🚨 Supabase JWT Token 问题诊断</h1>
      
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold text-red-800 mb-4">❌ 问题确认</h2>
        <p className="text-red-700 mb-4">
          你的 Supabase anon key 缺少必要的 JWT claims：
        </p>
        <ul className="list-disc list-inside text-red-700 space-y-2">
          <li><strong>missing sub claim</strong> - 主体标识符缺失</li>
          <li><strong>missing aud claim</strong> - 受众标识符缺失</li>
        </ul>
        <p className="text-red-700 mt-4">
          这导致所有 Supabase Auth 操作失败，包括 getUser() 和 getSession() 超时。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 解决方案 */}
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-green-800 mb-4">✅ 解决方案</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-green-700 mb-2">1. 重新生成 API Keys</h3>
              <p className="text-sm text-green-600 mb-3">
                访问 Supabase Dashboard 重新生成你的 API keys：
              </p>
              <a 
                href="https://supabase.com/dashboard/project/pwlvfmywfzllopuiisxg/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                🔗 打开 API 设置
              </a>
            </div>

            <div>
              <h3 className="font-bold text-green-700 mb-2">2. 检查项目设置</h3>
              <p className="text-sm text-green-600 mb-3">
                确保项目配置正确：
              </p>
              <ul className="text-sm text-green-600 list-disc list-inside space-y-1">
                <li>项目已完全初始化</li>
                <li>Database 已创建</li>
                <li>Auth 配置已启用</li>
                <li>JWT Secret 已正确设置</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-green-700 mb-2">3. 更新环境变量</h3>
              <p className="text-sm text-green-600 mb-3">
                获取新的 anon key 后，更新以下文件：
              </p>
              <div className="bg-green-100 p-3 rounded text-sm font-mono">
                .env.local<br/>
                .env.production (Vercel)
              </div>
            </div>

            <div>
              <h3 className="font-bold text-green-700 mb-2">4. 验证修复</h3>
              <p className="text-sm text-green-600 mb-3">
                部署后，重新运行测试确认修复：
              </p>
              <a 
                href="/simple-auth-test"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                🧪 重新测试
              </a>
            </div>
          </div>
        </div>

        {/* 当前问题详情 */}
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">🔍 当前问题详情</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-yellow-700 mb-2">JWT Token 分析</h3>
              <div className="bg-yellow-100 p-3 rounded text-sm font-mono">
                <div className="text-green-600">✅ iss: "supabase"</div>
                <div className="text-green-600">✅ role: "anon"</div>
                <div className="text-green-600">✅ ref: "pwlvfmywfzllopuiisxg"</div>
                <div className="text-green-600">✅ exp: 有效期至 2035年</div>
                <div className="text-red-600">❌ sub: 缺失</div>
                <div className="text-red-600">❌ aud: 缺失</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-yellow-700 mb-2">网络状态</h3>
              <div className="bg-yellow-100 p-3 rounded text-sm">
                <div className="text-green-600">✅ REST API: 200 OK</div>
                <div className="text-red-600">❌ Auth API: 403 Forbidden</div>
                <div className="text-red-600">❌ getUser(): 超时</div>
                <div className="text-red-600">❌ getSession(): 超时</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-yellow-700 mb-2">预期的正确 JWT</h3>
              <div className="bg-yellow-100 p-3 rounded text-sm font-mono">
                {`{
  "iss": "supabase",
  "ref": "your-project-ref",
  "role": "anon", 
  "aud": "authenticated",
  "sub": "anon-user-id",
  "iat": ...,
  "exp": ...
}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-blue-800 mb-4">💡 临时解决方案</h2>
        <p className="text-blue-700 mb-4">
          如果需要快速修复，你可以尝试：
        </p>
        <ol className="list-decimal list-inside text-blue-700 space-y-2">
          <li>在 Supabase Dashboard 中完全重置项目</li>
          <li>重新创建 Database 和 Auth 配置</li>
          <li>重新生成所有 API keys</li>
          <li>重新配置 OAuth providers (Google 等)</li>
        </ol>
        
        <div className="mt-4 p-4 bg-blue-100 rounded">
          <strong className="text-blue-800">注意：</strong>
          <span className="text-blue-700">
            这个问题与你的代码无关，而是 Supabase 项目配置的问题。
            修复后，所有认证功能应该立即恢复正常。
          </span>
        </div>
      </div>
    </div>
  )
}