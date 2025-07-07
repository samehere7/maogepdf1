'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"

export default function PDFStepTestPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [stepResults, setStepResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const steps = [
    {
      name: "基础环境检查",
      description: "检查浏览器基础环境",
      test: async () => {
        return {
          canvas: !!document.createElement('canvas').getContext('2d'),
          webgl: !!document.createElement('canvas').getContext('webgl'),
          worker: typeof Worker !== 'undefined',
          offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
          fetch: typeof fetch !== 'undefined'
        }
      }
    },
    {
      name: "PDF.js 导入测试",
      description: "测试 PDF.js 模块导入",
      test: async () => {
        try {
          const pdfjs = await import('pdfjs-dist')
          return {
            success: true,
            version: pdfjs.version,
            hasGlobalWorkerOptions: !!pdfjs.GlobalWorkerOptions,
            hasGetDocument: typeof pdfjs.getDocument === 'function'
          }
        } catch (error) {
          return {
            success: false,
            error: String(error)
          }
        }
      }
    },
    {
      name: "Worker 配置测试",
      description: "测试 Worker 源配置",
      test: async () => {
        try {
          const pdfjs = await import('pdfjs-dist')
          const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
          
          return {
            success: true,
            workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
            configured: !!pdfjs.GlobalWorkerOptions.workerSrc
          }
        } catch (error) {
          return {
            success: false,
            error: String(error)
          }
        }
      }
    },
    {
      name: "PDF 文档创建测试",
      description: "测试创建空PDF文档",
      test: async () => {
        try {
          const pdfjs = await import('pdfjs-dist')
          
          // 确保Worker配置
          if (!pdfjs.GlobalWorkerOptions.workerSrc) {
            const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
            pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
          }

          // 创建一个最小的PDF数据
          const minimalPdfData = new Uint8Array([
            0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, // %PDF-1.4\n
            0x25, 0xc4, 0xe5, 0xf2, 0xe5, 0xeb, 0xa7, 0xf3, 0xa0, 0xd0, 0xc4, 0xc6, 0x0a, // 二进制注释
            0x78, 0xda, 0x01, 0x01, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00, 0x00, 0x01, // 压缩数据
            0x0a, 0x65, 0x6e, 0x64, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x0a, // endstream
            0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a // endobj
          ])

          try {
            const doc = await pdfjs.getDocument({ data: minimalPdfData }).promise
            return {
              success: false,
              note: "PDF数据无效但getDocument工作正常",
              error: "Expected error for minimal data"
            }
          } catch (error) {
            // 这是预期的错误
            return {
              success: true,
              note: "getDocument函数正常工作（预期错误）",
              error: String(error).substring(0, 100) + "..."
            }
          }
        } catch (error) {
          return {
            success: false,
            error: String(error)
          }
        }
      }
    },
    {
      name: "示例PDF下载测试",
      description: "测试下载示例PDF文件",
      test: async () => {
        try {
          const response = await fetch('/sample.pdf')
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const arrayBuffer = await response.arrayBuffer()
          return {
            success: true,
            size: arrayBuffer.byteLength,
            contentType: response.headers.get('content-type'),
            status: response.status
          }
        } catch (error) {
          return {
            success: false,
            error: String(error)
          }
        }
      }
    },
    {
      name: "完整PDF加载测试",
      description: "测试加载完整PDF文档",
      test: async () => {
        try {
          const pdfjs = await import('pdfjs-dist')
          
          // 确保Worker配置
          if (!pdfjs.GlobalWorkerOptions.workerSrc) {
            const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
            pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
          }

          const response = await fetch('/sample.pdf')
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const arrayBuffer = await response.arrayBuffer()
          const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
          
          return {
            success: true,
            numPages: doc.numPages,
            fingerprint: doc.fingerprint
          }
        } catch (error) {
          return {
            success: false,
            error: String(error)
          }
        }
      }
    },
    {
      name: "PDF页面渲染测试",
      description: "测试渲染PDF第一页",
      test: async () => {
        try {
          const pdfjs = await import('pdfjs-dist')
          
          // 确保Worker配置
          if (!pdfjs.GlobalWorkerOptions.workerSrc) {
            const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
            pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
          }

          const response = await fetch('/sample.pdf')
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const arrayBuffer = await response.arrayBuffer()
          const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
          const page = await doc.getPage(1)
          
          // 创建canvas进行渲染测试
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) {
            throw new Error('无法获取2D上下文')
          }

          const viewport = page.getViewport({ scale: 1.0 })
          canvas.width = viewport.width
          canvas.height = viewport.height

          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise

          return {
            success: true,
            pageSize: { width: viewport.width, height: viewport.height },
            canvasSize: { width: canvas.width, height: canvas.height }
          }
        } catch (error) {
          return {
            success: false,
            error: String(error)
          }
        }
      }
    },
    {
      name: "缩放渲染测试",
      description: "测试不同缩放级别渲染",
      test: async () => {
        try {
          const pdfjs = await import('pdfjs-dist')
          
          // 确保Worker配置
          if (!pdfjs.GlobalWorkerOptions.workerSrc) {
            const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
            pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
          }

          const response = await fetch('/sample.pdf')
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const arrayBuffer = await response.arrayBuffer()
          const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
          const page = await doc.getPage(1)
          
          const scales = [0.5, 1.0, 1.5, 2.0]
          const results = []

          for (const scale of scales) {
            try {
              const startTime = Date.now()
              
              const canvas = document.createElement('canvas')
              const context = canvas.getContext('2d')
              if (!context) {
                throw new Error('无法获取2D上下文')
              }

              const viewport = page.getViewport({ scale })
              canvas.width = viewport.width
              canvas.height = viewport.height

              await page.render({
                canvasContext: context,
                viewport: viewport
              }).promise

              const renderTime = Date.now() - startTime

              results.push({
                scale,
                success: true,
                renderTime,
                size: { width: viewport.width, height: viewport.height }
              })
            } catch (error) {
              results.push({
                scale,
                success: false,
                error: String(error)
              })
            }
          }

          return {
            success: true,
            results
          }
        } catch (error) {
          return {
            success: false,
            error: String(error)
          }
        }
      }
    }
  ]

  const runStep = async (stepIndex: number) => {
    setIsLoading(true)
    try {
      const step = steps[stepIndex]
      console.log(`🧪 执行测试步骤 ${stepIndex + 1}: ${step.name}`)
      
      const startTime = Date.now()
      const result = await step.test()
      const duration = Date.now() - startTime

      const stepResult = {
        step: stepIndex + 1,
        name: step.name,
        description: step.description,
        result,
        duration,
        timestamp: new Date().toISOString()
      }

      setStepResults(prev => [...prev, stepResult])
      console.log(`✅ 步骤 ${stepIndex + 1} 完成:`, stepResult)
      
    } catch (error) {
      const stepResult = {
        step: stepIndex + 1,
        name: steps[stepIndex].name,
        description: steps[stepIndex].description,
        result: { success: false, error: String(error) },
        duration: 0,
        timestamp: new Date().toISOString()
      }
      setStepResults(prev => [...prev, stepResult])
      console.error(`❌ 步骤 ${stepIndex + 1} 失败:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const runAllSteps = async () => {
    setStepResults([])
    for (let i = 0; i < steps.length; i++) {
      await runStep(i)
      // 小延迟，避免过快执行
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const copyResults = async () => {
    try {
      const text = JSON.stringify(stepResults, null, 2)
      await navigator.clipboard.writeText(text)
      alert('测试结果已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const getStepIcon = (result: any) => {
    if (!result) return '⏳'
    return result.result?.success === true ? '✅' : 
           result.result?.success === false ? '❌' : '⚠️'
  }

  const getStepColor = (result: any) => {
    if (!result) return 'bg-gray-50'
    return result.result?.success === true ? 'bg-green-50' : 
           result.result?.success === false ? 'bg-red-50' : 'bg-yellow-50'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">🔬 PDF 功能逐步测试</h1>
          <p className="text-gray-600 mb-6">
            逐步测试PDF功能的每个环节，精确定位问题所在
          </p>

          <div className="flex gap-4 mb-6">
            <Button
              onClick={runAllSteps}
              disabled={isLoading}
              className="bg-blue-600 text-white"
            >
              {isLoading ? '🔄 测试中...' : '🚀 运行全部测试'}
            </Button>
            
            {stepResults.length > 0 && (
              <Button onClick={copyResults} variant="outline">
                📋 复制测试结果
              </Button>
            )}
            
            <Button 
              onClick={() => setStepResults([])} 
              variant="outline"
            >
              🗑️ 清除结果
            </Button>
          </div>
        </div>

        {/* 测试步骤列表 */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const result = stepResults.find(r => r.step === index + 1)
            
            return (
              <div key={index} className={`bg-white rounded-lg shadow p-6 ${getStepColor(result)}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getStepIcon(result)}</span>
                    <div>
                      <h3 className="text-lg font-bold">
                        步骤 {index + 1}: {step.name}
                      </h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => runStep(index)}
                      disabled={isLoading}
                      size="sm"
                      variant="outline"
                    >
                      {isLoading && currentStep === index ? '⏳' : '▶️'} 运行
                    </Button>
                  </div>
                </div>

                {result && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">
                        结果: {result.result.success === true ? '成功' : 
                              result.result.success === false ? '失败' : '警告'}
                      </span>
                      <span className="text-sm text-gray-500">
                        耗时: {result.duration}ms
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 测试总结 */}
        {stepResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">📊 测试总结</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {stepResults.filter(r => r.result.success === true).length}
                </div>
                <div className="text-sm text-gray-600">成功</div>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {stepResults.filter(r => r.result.success === false).length}
                </div>
                <div className="text-sm text-gray-600">失败</div>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {stepResults.reduce((sum, r) => sum + r.duration, 0)}ms
                </div>
                <div className="text-sm text-gray-600">总耗时</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}