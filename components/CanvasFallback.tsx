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
      // 测试Canvas 2D
      const canvas = document.createElement('canvas')
      const ctx2d = canvas.getContext('2d')
      
      // 测试WebGL
      const webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      
      // 测试OffscreenCanvas
      let offscreen = false
      try {
        if (typeof OffscreenCanvas !== 'undefined') {
          const offscreenCanvas = new OffscreenCanvas(100, 100)
          const offscreenCtx = offscreenCanvas.getContext('2d')
          offscreen = !!offscreenCtx
        }
      } catch (error) {
        details.push(`OffscreenCanvas失败: ${error}`)
      }

      // 检测硬件加速
      let hardwareAccel = false
      if (ctx2d) {
        const testCanvas = document.createElement('canvas')
        testCanvas.width = 100
        testCanvas.height = 100
        const testCtx = testCanvas.getContext('2d')
        if (testCtx) {
          testCtx.fillStyle = 'red'
          testCtx.fillRect(0, 0, 50, 50)
          const imageData = testCtx.getImageData(0, 0, 1, 1)
          hardwareAccel = imageData.data[0] === 255
        }
      }

      if (!ctx2d) {
        details.push('Canvas 2D上下文获取失败')
        details.push('可能原因：硬件加速被禁用')
        details.push('可能原因：浏览器Canvas被阻止')
        details.push('可能原因：系统图形驱动问题')
      }

      const support: CanvasTest = {
        canvas2d: !!ctx2d,
        webgl: !!webgl,
        offscreenCanvas: offscreen,
        hardwareAcceleration: hardwareAccel,
        details
      }

      setCanvasSupport(support)

      if (support.canvas2d && onCanvasReady) {
        onCanvasReady()
      }

    } catch (error) {
      const support: CanvasTest = {
        canvas2d: false,
        webgl: false,
        offscreenCanvas: false,
        hardwareAcceleration: false,
        details: [`Canvas检测失败: ${error}`]
      }
      setCanvasSupport(support)
    }
  }

  const attemptCanvasFix = async () => {
    setIsFixing(true)
    
    try {
      // 尝试修复方案1：强制重新获取上下文
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      
      // 尝试不同的上下文选项
      const contextOptions = [
        { alpha: false },
        { alpha: true },
        { willReadFrequently: true },
        { willReadFrequently: false },
        {}
      ]

      let success = false
      for (const options of contextOptions) {
        try {
          const ctx = canvas.getContext('2d', options)
          if (ctx) {
            // 测试基本绘制
            ctx.fillStyle = 'red'
            ctx.fillRect(0, 0, 1, 1)
            const imageData = ctx.getImageData(0, 0, 1, 1)
            if (imageData && imageData.data[0] === 255) {
              success = true
              break
            }
          }
        } catch (error) {
          continue
        }
      }

      if (success) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        checkCanvasSupport()
      }

    } catch (error) {
      console.error('Canvas修复失败:', error)
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

  // 如果Canvas正常工作，直接渲染子组件
  if (canvasSupport?.canvas2d) {
    return <>{children}</>
  }

  // 如果Canvas不可用，显示修复界面
  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center p-6">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-orange-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Canvas渲染不可用
        </h2>
        
        <p className="text-gray-600 mb-6">
          PDF查看器需要Canvas 2D支持才能正常工作。检测到您的浏览器Canvas功能异常。
        </p>

        <div className="space-y-3 mb-6">
          <Button 
            onClick={attemptCanvasFix}
            disabled={isFixing}
            className="w-full bg-blue-600 hover:bg-blue-700"
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

          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重新加载页面
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
                      <div key={index} className="text-red-600">{detail}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-medium text-blue-800 mb-1">常见解决方案：</div>
          <div className="text-blue-700 space-y-1">
            <div>• 启用浏览器硬件加速</div>
            <div>• 更新显卡驱动程序</div>
            <div>• 尝试无痕/隐身模式</div>
            <div>• 清除浏览器缓存</div>
            <div>• 重启浏览器</div>
          </div>
        </div>
      </div>
    </div>
  )
}