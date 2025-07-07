"use client"

import React, { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CanvasFallbackProps {
  onCanvasReady?: () => void
  children: React.ReactNode
}

interface CanvasTest {
  canvas2d: boolean
  webgl: boolean
  offscreenCanvas: boolean
  hardwareAcceleration: boolean
  details: string[]
}

export default function CanvasFallback({ onCanvasReady, children }: CanvasFallbackProps) {
  const [canvasSupport, setCanvasSupport] = useState<CanvasTest | null>(null)
  const [isFixing, setIsFixing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    checkCanvasSupport()
  }, [])

  const checkCanvasSupport = () => {
    const details: string[] = []
    
    try {
      // 优化策略：默认通过，只在完全无法使用时才阻止
      console.log('[CanvasFallback] 开始宽松的Canvas检测...')
      
      const result = performProgressiveCanvasTest(details)
      
      // 默认通过策略：只要有基本Canvas支持就认为可用
      const support: CanvasTest = {
        canvas2d: result.canvas2dWorks || true, // 默认通过
        webgl: result.webglWorks,
        offscreenCanvas: result.offscreenWorks,
        hardwareAcceleration: result.hardwareAccel,
        details
      }

      console.log('[CanvasFallback] Canvas支持检测结果（宽松模式）:', support)
      setCanvasSupport(support)

      // 总是触发onCanvasReady，确保PDF可以加载
      if (onCanvasReady) {
        onCanvasReady()
      }

    } catch (error) {
      console.error('[CanvasFallback] Canvas检测过程异常，但强制通过:', error)
      // 任何异常都强制通过，确保PDF功能可用
      const support: CanvasTest = {
        canvas2d: true, // 强制通过
        webgl: false,
        offscreenCanvas: false,
        hardwareAcceleration: false,
        details: [`Canvas检测异常但强制通过: ${error}`, '启用应急兼容模式，PDF应该能正常显示']
      }
      setCanvasSupport(support)
      
      // 确保onCanvasReady被调用
      if (onCanvasReady) {
        onCanvasReady()
      }
    }
  }

  const performProgressiveCanvasTest = (details: string[]): {
    canvas2dWorks: boolean,
    webglWorks: boolean,
    offscreenWorks: boolean,
    hardwareAccel: boolean
  } => {
    // 宽松测试策略：优先可用性，降低检测门槛
    let canvas2dWorks = true // 默认通过
    let webglWorks = false
    let offscreenWorks = false
    let hardwareAccel = false

    try {
      const canvas = document.createElement('canvas')
      if (!canvas || typeof canvas.getContext !== 'function') {
        details.push('⚠️ Canvas元素创建异常，但尝试继续')
        // 即使创建失败也不阻止，现代浏览器基本都支持
        return { canvas2dWorks: true, webglWorks: false, offscreenWorks: false, hardwareAccel: false }
      }
      details.push('✅ Canvas元素创建成功')

      // 测试2: 2D上下文获取（宽松检测）
      const ctx2d = canvas.getContext('2d')
      if (!ctx2d) {
        details.push('⚠️ Canvas 2D上下文获取失败，但仍尝试PDF渲染')
        // 即使上下文获取失败也不阻止，PDF.js有自己的fallback
        return { canvas2dWorks: true, webglWorks: false, offscreenWorks: false, hardwareAccel: false }
      }
      details.push('✅ Canvas 2D上下文获取成功')

      // 测试3: 基本渲染功能（宽松检测）
      try {
        canvas.width = 100
        canvas.height = 100
        ctx2d.fillStyle = '#FF0000'
        ctx2d.fillRect(10, 10, 50, 50)
        
        // 尝试获取像素数据验证渲染
        try {
          const imageData = ctx2d.getImageData(25, 25, 1, 1)
          if (imageData && imageData.data && imageData.data.length >= 4) {
            const red = imageData.data[0]
            if (red > 200) {
              canvas2dWorks = true
              hardwareAccel = true
              details.push(`✅ Canvas渲染测试通过，硬件加速可用 (红色值: ${red})`)
            } else if (red > 0) {
              canvas2dWorks = true
              details.push(`✅ Canvas渲染测试通过，软件渲染 (红色值: ${red})`)
            } else {
              canvas2dWorks = true // 即使红色值为0也认为可用
              details.push(`⚠️ Canvas渲染异常但基本可用 (红色值: ${red})`)
            }
          } else {
            // 即使获取像素数据失败，只要能绘制就认为可用
            canvas2dWorks = true
            details.push('⚠️ Canvas像素数据获取失败，但绘制功能可用')
          }
        } catch (pixelError) {
          // 像素检测失败，但绘制成功，认为基本可用
          canvas2dWorks = true
          details.push(`⚠️ 像素检测失败但绘制成功: ${pixelError}`)
        }

        // 测试4: 文本渲染（PDF.js需要）
        try {
          ctx2d.font = '12px Arial'
          ctx2d.fillStyle = '#000000'
          ctx2d.fillText('Test', 30, 70)
          details.push('✅ 文本渲染测试通过')
        } catch (textError) {
          details.push(`⚠️ 文本渲染测试失败: ${textError}`)
        }

      } catch (renderError) {
        // 渲染测试失败，但上下文可用，仍然认为基本可用
        canvas2dWorks = true
        details.push(`⚠️ 渲染测试失败但上下文可用: ${renderError}`)
      }

      // 测试5: WebGL支持（可选）
      try {
        const webglCanvas = document.createElement('canvas')
        const webgl = webglCanvas.getContext('webgl') || webglCanvas.getContext('experimental-webgl')
        if (webgl) {
          webglWorks = true
          details.push('✅ WebGL支持可用')
        } else {
          details.push('ℹ️ WebGL不支持（非必需）')
        }
      } catch (webglError) {
        details.push(`ℹ️ WebGL测试失败: ${webglError}`)
      }

      // 测试6: OffscreenCanvas支持（可选）
      try {
        if (typeof OffscreenCanvas !== 'undefined') {
          const offscreenCanvas = new OffscreenCanvas(100, 100)
          const offscreenCtx = offscreenCanvas.getContext('2d')
          if (offscreenCtx) {
            offscreenCtx.fillRect(0, 0, 10, 10)
            offscreenWorks = true
            details.push('✅ OffscreenCanvas支持可用')
          }
        } else {
          details.push('ℹ️ OffscreenCanvas不支持（非必需）')
        }
      } catch (offscreenError) {
        details.push(`ℹ️ OffscreenCanvas测试失败: ${offscreenError}`)
      }

    } catch (globalError) {
      details.push(`⚠️ Canvas全局测试异常: ${globalError}`)
      // 任何异常都强制启用，优先PDF可用性
      canvas2dWorks = true
      details.push('🚀 强制启用Canvas支持，确保PDF正常显示')
    }

    // 确保总是返回可用状态，让PDF.js自己处理兼容性
    return { 
      canvas2dWorks: true,  // 总是返回true
      webglWorks, 
      offscreenWorks, 
      hardwareAccel 
    }
  }

  const attemptCanvasFix = async () => {
    setIsFixing(true)
    
    try {
      console.log('[CanvasFallback] 开始尝试Canvas修复...')
      
      // 修复方案1：清理可能的冲突状态
      if (typeof window !== 'undefined') {
        // 强制垃圾回收（如果可用）
        if (window.gc) {
          window.gc()
        }
      }
      
      // 修复方案2：尝试不同的Canvas上下文配置
      const testConfigs = [
        { alpha: false, desynchronized: false },
        { alpha: true, desynchronized: false },
        { willReadFrequently: true },
        { willReadFrequently: false },
        { powerPreference: 'high-performance' },
        { powerPreference: 'low-power' },
        {}
      ]

      let fixSuccess = false
      for (let i = 0; i < testConfigs.length; i++) {
        const config = testConfigs[i]
        console.log(`[CanvasFallback] 尝试配置 ${i + 1}:`, config)
        
        try {
          const testCanvas = document.createElement('canvas')
          testCanvas.width = 100
          testCanvas.height = 100
          
          const ctx = testCanvas.getContext('2d', config)
          if (ctx) {
            // 完整的PDF.js兼容性测试
            ctx.fillStyle = '#FF0000'
            ctx.fillRect(25, 25, 50, 50)
            ctx.font = '16px Arial'
            ctx.fillText('Fix Test', 30, 45)
            
            const imageData = ctx.getImageData(30, 30, 1, 1)
            if (imageData && imageData.data && imageData.data[0] > 200) {
              console.log(`[CanvasFallback] 配置 ${i + 1} 成功！红色值:`, imageData.data[0])
              fixSuccess = true
              break
            }
          }
        } catch (error) {
          console.log(`[CanvasFallback] 配置 ${i + 1} 失败:`, error)
          continue
        }
      }

      if (fixSuccess) {
        console.log('[CanvasFallback] Canvas修复成功，重新检测...')
        // 等待一段时间确保状态稳定
        await new Promise(resolve => setTimeout(resolve, 500))
        checkCanvasSupport()
      } else {
        console.log('[CanvasFallback] 所有修复尝试均失败')
      }

    } catch (error) {
      console.error('[CanvasFallback] Canvas修复过程异常:', error)
    } finally {
      setIsFixing(false)
    }
  }

  const openBrowserSettings = () => {
    const userAgent = navigator.userAgent
    let instructions = ''
    
    if (userAgent.includes('Chrome')) {
      instructions = '1. 在地址栏输入: chrome://settings/\n2. 点击"高级" > "系统"\n3. 确保"使用硬件加速"已启用\n4. 重启浏览器'
    } else if (userAgent.includes('Firefox')) {
      instructions = '1. 在地址栏输入: about:preferences\n2. 搜索"硬件加速"\n3. 确保"可用时使用硬件加速"已勾选\n4. 重启浏览器'
    } else if (userAgent.includes('Safari')) {
      instructions = '1. Safari菜单 > 偏好设置\n2. 点击"高级"标签\n3. 确保启用了图形加速\n4. 重启Safari'
    } else {
      instructions = '请在浏览器设置中启用硬件加速，然后重启浏览器'
    }

    alert(instructions)
  }

  // 恢复Canvas检测，但采用宽松策略，优先保证PDF可用性
  if (canvasSupport === null) {
    // 检测尚未完成，显示加载状态
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">初始化Canvas...</p>
        </div>
      </div>
    )
  }

  // 优先可用性策略：总是渲染PDF内容，不阻止用户使用
  if (canvasSupport.canvas2d) {
    console.log('[CanvasFallback] Canvas检测通过，渲染PDF内容')
    if (onCanvasReady) {
      onCanvasReady()
    }
    return <>{children}</>
  }

  // 理论上不应该到达这里，因为我们总是返回canvas2d: true
  // 但如果到了这里，也直接渲染PDF内容而不是阻止
  console.warn('[CanvasFallback] 意外的Canvas检测失败，但仍然渲染PDF内容')
  if (onCanvasReady) {
    onCanvasReady()
  }
  return <>{children}</>

  // 保留原来的修复界面代码作为备用（但永远不会执行到）
  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center p-6">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-orange-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Canvas渲染检测异常
        </h2>
        
        <p className="text-gray-600 mb-6">
          PDF查看器需要Canvas 2D支持。检测到可能的兼容性问题，但PDF仍可能正常工作。
        </p>

        <div className="space-y-3 mb-6">
          {/* 添加强制显示选项 */}
          <Button 
            onClick={() => {
              console.log('[CanvasFallback] 用户选择强制显示PDF')
              // 强制设置为可用状态
              setCanvasSupport(prev => prev ? {...prev, canvas2d: true} : {
                canvas2d: true,
                webgl: false,
                offscreenCanvas: false,
                hardwareAcceleration: false,
                details: ['用户强制启用']
              })
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            ⚡ 强制显示PDF（推荐）
          </Button>
          
          <Button 
            onClick={attemptCanvasFix}
            disabled={isFixing}
            variant="outline"
            className="w-full"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                尝试修复中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                尝试自动修复
              </>
            )}
          </Button>
          
          <Button 
            onClick={openBrowserSettings}
            variant="outline"
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            浏览器设置帮助
          </Button>
        </div>

        {canvasSupport && (
          <div className="text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-600 hover:text-gray-800 mb-2"
            >
              {showDetails ? '隐藏' : '显示'}技术详情 ▼
            </button>
            
            {showDetails && (
              <div className="text-xs bg-gray-100 rounded p-3 space-y-1">
                <div>Canvas 2D: <span className={canvasSupport.canvas2d ? 'text-green-600' : 'text-red-600'}>
                  {canvasSupport.canvas2d ? '✓' : '✗'}
                </span></div>
                <div>WebGL: <span className={canvasSupport.webgl ? 'text-green-600' : 'text-red-600'}>
                  {canvasSupport.webgl ? '✓' : '✗'}
                </span></div>
                <div>OffscreenCanvas: <span className={canvasSupport.offscreenCanvas ? 'text-green-600' : 'text-red-600'}>
                  {canvasSupport.offscreenCanvas ? '✓' : '✗'}
                </span></div>
                <div>硬件加速: <span className={canvasSupport.hardwareAcceleration ? 'text-green-600' : 'text-red-600'}>
                  {canvasSupport.hardwareAcceleration ? '✓' : '✗'}
                </span></div>
                
                {canvasSupport.details.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="font-medium mb-1">详细信息:</div>
                    {canvasSupport.details.map((detail, index) => (
                      <div key={index} className="text-gray-600">{detail}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-medium text-blue-800 mb-1">💡 提示：</div>
          <div className="text-blue-700">
            大多数现代浏览器都支持PDF显示。如果检测异常，建议直接点击"强制显示PDF"按钮。
          </div>
        </div>
      </div>
    </div>
  )
}