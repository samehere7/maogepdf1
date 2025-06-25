'use client'

import { useState, useEffect } from 'react'

export default function UltimateDebugPage() {
  const [diagnosis, setDiagnosis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchDiagnosis = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ultimate-diagnosis')
      const data = await response.json()
      setDiagnosis(data)
    } catch (error) {
      console.error('诊断失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnosis()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchDiagnosis, 10000) // 每10秒刷新
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌'
  }

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🔍 超级诊断工具</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">🔍 超级数据库诊断工具</h1>
          <p className="text-gray-600">全面检查所有可能的数据库连接问题</p>
          
          <div className="flex gap-4 mt-4">
            <button
              onClick={fetchDiagnosis}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔄 刷新诊断
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded ${
                autoRefresh 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {autoRefresh ? '⏹️ 停止自动刷新' : '▶️ 自动刷新'}
            </button>
          </div>
        </div>

        {diagnosis && (
          <>
            {/* 总结 */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h2 className="text-2xl font-bold mb-4">📊 诊断总结</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-600">{diagnosis.summary?.totalTests}</div>
                  <div className="text-sm text-gray-600">总测试数</div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">{diagnosis.summary?.successful}</div>
                  <div className="text-sm text-gray-600">成功测试</div>
                </div>
                <div className="bg-red-50 p-4 rounded">
                  <div className="text-2xl font-bold text-red-600">{diagnosis.summary?.failed}</div>
                  <div className="text-sm text-gray-600">失败测试</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{diagnosis.summary?.criticalIssues?.length}</div>
                  <div className="text-sm text-gray-600">关键问题</div>
                </div>
              </div>

              {diagnosis.summary?.recommendations && diagnosis.summary.recommendations.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <h3 className="font-bold text-yellow-800 mb-2">🚨 关键建议</h3>
                  <ul className="space-y-1">
                    {diagnosis.summary.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-yellow-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 详细测试结果 */}
            <div className="space-y-6">
              {diagnosis.tests?.map((test: any, index: number) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{getStatusIcon(test.success)}</span>
                    <h3 className={`text-xl font-bold ${getStatusColor(test.success)}`}>
                      {test.name}
                    </h3>
                  </div>

                  {test.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                      <strong className="text-red-700">错误:</strong>
                      <div className="text-red-600 font-mono text-sm">{test.error}</div>
                    </div>
                  )}

                  {/* 环境变量详情 */}
                  {test.variables && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {Object.entries(test.variables).map(([key, info]: [string, any]) => (
                        <div key={key} className={`p-3 rounded border ${
                          info.status === 'MISSING' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        }`}>
                          <div className="font-mono text-sm font-bold">{key}</div>
                          <div className="text-xs text-gray-600">
                            状态: {info.status} | 长度: {info.length || 0}
                          </div>
                          {info.masked && <div className="text-xs font-mono bg-gray-100 p-1 rounded mt-1">{info.masked}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Prisma 查询结果 */}
                  {test.queries && (
                    <div className="space-y-2">
                      {test.queries.map((query: any, qIdx: number) => (
                        <div key={qIdx} className={`p-3 rounded ${
                          query.success ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{getStatusIcon(query.success)} {query.name}</span>
                            {query.time && <span className="text-sm text-gray-500">{query.time}</span>}
                          </div>
                          {query.error && <div className="text-red-600 text-sm mt-1">{query.error}</div>}
                          {query.result && <div className="text-gray-600 text-xs mt-1 font-mono">{query.result}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Supabase 操作结果 */}
                  {test.operations && (
                    <div className="space-y-2">
                      {test.operations.map((op: any, opIdx: number) => (
                        <div key={opIdx} className={`p-3 rounded ${
                          op.success ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{getStatusIcon(op.success)} {op.name}</span>
                            {op.time && <span className="text-sm text-gray-500">{op.time}</span>}
                          </div>
                          {op.error && <div className="text-red-600 text-sm mt-1">{op.error}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 网络测试结果 */}
                  {test.tests && (
                    <div className="space-y-2">
                      {test.tests.map((netTest: any, netIdx: number) => (
                        <div key={netIdx} className={`p-3 rounded ${
                          netTest.success ? 'bg-green-50' : 'bg-yellow-50'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{getStatusIcon(netTest.success)} {netTest.target}</span>
                            {netTest.time && <span className="text-sm text-gray-500">{netTest.time}</span>}
                          </div>
                          {netTest.note && <div className="text-gray-600 text-sm mt-1">{netTest.note}</div>}
                          {netTest.error && <div className="text-red-600 text-sm mt-1">{netTest.error}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 其他结构化数据 */}
                  {(test.parsed || test.config || test.info) && (
                    <div className="bg-gray-50 rounded p-3 mt-4">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(test.parsed || test.config || test.info, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 系统信息 */}
            <div className="bg-gray-100 rounded-lg p-4 mt-8 text-xs text-gray-600">
              <div>诊断时间: {diagnosis.timestamp}</div>
              <div>环境: {diagnosis.environment}</div>
              <div>Vercel 区域: {diagnosis.vercel?.region}</div>
              <div>部署ID: {diagnosis.vercel?.deployment}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}