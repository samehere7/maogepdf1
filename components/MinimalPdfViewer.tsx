"use client"

import React, { useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MinimalPdfViewerProps {
  file: File | string | null
}

export default function MinimalPdfViewer({ file }: MinimalPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfContentRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<any>(null)
  
  // 状态管理
  const [scale, setScale] = useState(1.0)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [pageInput, setPageInput] = useState('1')
  const [isLoading, setIsLoading] = useState(false)

  const renderPDF = async (doc: any, customScale?: number) => {
    if (!pdfContentRef.current) return

    // 清空容器
    pdfContentRef.current.innerHTML = ''
    
    const actualScale = customScale || scale
    
    // 渲染所有页面
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum)
      const viewport = page.getViewport({ scale: actualScale })
      
      // 创建页面容器
      const pageContainer = document.createElement('div')
      pageContainer.style.display = 'flex'
      pageContainer.style.justifyContent = 'center'
      pageContainer.style.marginBottom = '20px'
      pageContainer.setAttribute('data-page-number', pageNum.toString())
      
      // 创建canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) {
        console.error('[MinimalPdfViewer] 无法获取Canvas 2D上下文')
        continue
      }
      
      // 设置canvas尺寸（考虑设备像素比）
      const devicePixelRatio = window.devicePixelRatio || 1
      canvas.width = viewport.width * devicePixelRatio
      canvas.height = viewport.height * devicePixelRatio
      
      // 设置canvas样式尺寸
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      canvas.style.maxWidth = '100%'
      canvas.style.border = '1px solid #e5e7eb'
      canvas.style.borderRadius = '8px'
      canvas.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      canvas.style.backgroundColor = 'white'
      
      // 缩放context以匹配设备像素比
      context.scale(devicePixelRatio, devicePixelRatio)
      
      // 渲染页面到canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      // 添加到容器
      pageContainer.appendChild(canvas)
      pdfContentRef.current!.appendChild(pageContainer)
      
      console.log(`[MinimalPdfViewer] 页面${pageNum}渲染完成，缩放比例: ${actualScale.toFixed(2)}`)
    }
    
    console.log('[MinimalPdfViewer] 所有页面渲染完成')
  }

  // 控制函数
  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.2, 3.0)
    setScale(newScale)
  }

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.5)
    setScale(newScale)
  }

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault()
    const pageNum = parseInt(pageInput, 10)
    
    if (isNaN(pageNum) || pageNum < 1 || pageNum > numPages) {
      alert(`请输入1到${numPages}之间的页码`)
      return
    }
    
    // 跳转到指定页面
    const pageElement = pdfContentRef.current?.querySelector(`[data-page-number="${pageNum}"]`)
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setCurrentPage(pageNum)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1
      const pageElement = pdfContentRef.current?.querySelector(`[data-page-number="${prevPage}"]`)
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setCurrentPage(prevPage)
        setPageInput(prevPage.toString())
      }
    }
  }

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const nextPage = currentPage + 1
      const pageElement = pdfContentRef.current?.querySelector(`[data-page-number="${nextPage}"]`)
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setCurrentPage(nextPage)
        setPageInput(nextPage.toString())
      }
    }
  }

  useEffect(() => {
    if (!file) return

    const loadPDF = async () => {
      try {
        setIsLoading(true)
        console.log('[MinimalPdfViewer] 开始加载PDF.js...')
        
        // 动态导入PDF.js
        const pdfjs = await import('pdfjs-dist')
        console.log('[MinimalPdfViewer] PDF.js版本:', pdfjs.version)
        
        // 强制确保Worker配置正确 - 多重验证
        const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
        
        // 第一次设置
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
        console.log('[MinimalPdfViewer] 第一次Worker设置:', workerSrc)
        
        // 验证设置是否生效，如果没有则强制重设
        if (!pdfjs.GlobalWorkerOptions.workerSrc || pdfjs.GlobalWorkerOptions.workerSrc !== workerSrc) {
          console.warn('[MinimalPdfViewer] Worker配置验证失败，强制重新设置')
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
          
          // 再次验证
          if (!pdfjs.GlobalWorkerOptions.workerSrc) {
            throw new Error('Worker源配置失败，无法继续加载PDF')
          }
        }
        
        console.log('[MinimalPdfViewer] 最终Worker设置:', pdfjs.GlobalWorkerOptions.workerSrc)
        console.log('[MinimalPdfViewer] GlobalWorkerOptions:', pdfjs.GlobalWorkerOptions)
        
        // 获取PDF数据
        let arrayBuffer: ArrayBuffer
        
        if (file instanceof File) {
          console.log('[MinimalPdfViewer] 处理本地文件')
          arrayBuffer = await file.arrayBuffer()
        } else {
          console.log('[MinimalPdfViewer] 获取远程文件:', file)
          const response = await fetch(file)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          arrayBuffer = await response.arrayBuffer()
        }
        
        console.log('[MinimalPdfViewer] 文件大小:', arrayBuffer.byteLength)
        
        // 解析PDF
        const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
        console.log('[MinimalPdfViewer] PDF解析成功，页数:', doc.numPages)
        
        // 保存PDF文档引用和设置状态
        pdfDocRef.current = doc
        setNumPages(doc.numPages)
        setCurrentPage(1)
        setPageInput('1')
        
        // 渲染PDF
        await renderPDF(doc)
        
      } catch (error) {
        console.error('[MinimalPdfViewer] 加载失败:', error)
        if (pdfContentRef.current) {
          pdfContentRef.current.innerHTML = `
            <div style="text-align: center; padding: 20px; color: red;">
              <h3>PDF加载失败</h3>
              <p>${error instanceof Error ? error.message : String(error)}</p>
            </div>
          `
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadPDF()
  }, [file])

  // 监听scale变化，重新渲染PDF
  useEffect(() => {
    if (pdfDocRef.current) {
      console.log('[MinimalPdfViewer] 缩放级别变化，重新渲染PDF')
      renderPDF(pdfDocRef.current, scale)
    }
  }, [scale])

  // 添加窗口大小变化监听器
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (pdfDocRef.current) {
          console.log('[MinimalPdfViewer] 窗口大小变化，重新渲染PDF')
          renderPDF(pdfDocRef.current)
        }
      }, 300) // 防抖300ms
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      {/* 控制栏 */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 flex-shrink-0">
        {/* 左侧：页面导航 */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
            variant="outline"
            size="sm"
            className="px-2 py-1"
          >
            <ChevronLeft size={16} />
          </Button>
          
          <form onSubmit={handlePageJump} className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max={numPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="w-16 h-8 text-center text-sm"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-600">/ {numPages}</span>
          </form>
          
          <Button
            onClick={handleNextPage}
            disabled={currentPage >= numPages || isLoading}
            variant="outline"
            size="sm"
            className="px-2 py-1"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
        
        {/* 右侧：缩放控制 */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleZoomOut}
            disabled={scale <= 0.5 || isLoading}
            variant="outline"
            size="sm"
            className="px-2 py-1"
          >
            <ZoomOut size={16} />
          </Button>
          
          <span className="px-2 py-1 bg-gray-50 rounded border text-sm min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            onClick={handleZoomIn}
            disabled={scale >= 3.0 || isLoading}
            variant="outline"
            size="sm"
            className="px-2 py-1"
          >
            <ZoomIn size={16} />
          </Button>
        </div>
      </div>

      {/* PDF内容区域 */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div ref={pdfContentRef} className="text-center p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">正在加载PDF...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}