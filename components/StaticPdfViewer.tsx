"use client"

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocumentProxy } from 'pdfjs-dist'

// 配置 PDF.js worker
if (typeof window !== 'undefined') {
  const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
}

interface OutlineItem {
  title: string
  dest: any
  items?: OutlineItem[]
  pageNumber?: number
  level: number
}

interface StaticPdfViewerProps {
  file: File | string | null
  onOutlineLoaded?: (outline: OutlineItem[]) => void
  onPageChange?: (currentPage: number) => void
  className?: string
}

export interface StaticPdfViewerRef {
  jumpToPage: (pageNumber: number) => void
  getCurrentPage: () => number
  getOutline: () => OutlineItem[]
}

const StaticPdfViewer = forwardRef<StaticPdfViewerRef, StaticPdfViewerProps>(({ 
  file, 
  onOutlineLoaded, 
  onPageChange,
  className = ""
}, ref) => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outline, setOutline] = useState<OutlineItem[]>([])
  const [canvases, setCanvases] = useState<Map<number, HTMLCanvasElement>>(new Map())
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const renderingPages = useRef<Set<number>>(new Set())
  const canvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const scale = 1.2 // 固定缩放比例
  
  // 同步canvases状态到ref
  useEffect(() => {
    canvasesRef.current = canvases
  }, [canvases])

  // 提取PDF outline信息
  const extractOutline = useCallback(async (doc: PDFDocumentProxy) => {
    try {
      const outlineData = await doc.getOutline()
      if (!outlineData || outlineData.length === 0) {
        setOutline([])
        onOutlineLoaded?.([])
        return
      }

      const processOutlineItems = async (items: any[], level = 0): Promise<OutlineItem[]> => {
        const result: OutlineItem[] = []
        
        for (const item of items) {
          let pageNumber: number | undefined
          
          if (item.dest) {
            try {
              let dest = item.dest
              if (typeof dest === 'string') {
                dest = await doc.getDestination(dest)
              }
              
              if (dest && Array.isArray(dest) && dest.length > 0) {
                const pageRef = dest[0]
                if (pageRef && typeof pageRef === 'object' && 'num' in pageRef) {
                  const pageIndex = await doc.getPageIndex(pageRef)
                  pageNumber = pageIndex + 1
                } else if (typeof pageRef === 'number') {
                  pageNumber = pageRef + 1
                }
              }
            } catch (error) {
              console.warn('解析目录项页码失败:', item.title, error)
            }
          }
          
          const outlineItem: OutlineItem = {
            title: item.title || '未命名',
            dest: item.dest,
            pageNumber,
            level,
            items: item.items ? await processOutlineItems(item.items, level + 1) : undefined
          }
          
          result.push(outlineItem)
        }
        
        return result
      }
      
      const processedOutline = await processOutlineItems(outlineData)
      setOutline(processedOutline)
      onOutlineLoaded?.(processedOutline)
      
    } catch (error) {
      console.error('提取目录失败:', error)
      setOutline([])
      onOutlineLoaded?.([])
    }
  }, [])

  // 加载PDF文档
  useEffect(() => {
    if (!file) {
      console.log('[StaticPdfViewer] 没有文件，跳过加载')
      setError(null) // 清除之前的错误
      setIsLoading(false)
      return
    }

    console.log('[StaticPdfViewer] 开始加载PDF文件:', file)
  console.log('[StaticPdfViewer] 文件类型:', typeof file)
  console.log('[StaticPdfViewer] 是否为File对象:', file instanceof File)

    // 设置30秒加载超时
    const timeoutId = setTimeout(() => {
      console.log('[StaticPdfViewer] 加载超时，设置超时状态')
      setLoadingTimeout(true)
    }, 30000)

    const loadPDF = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setLoadingTimeout(false)
        console.log('[StaticPdfViewer] 设置加载状态为true')
        
        let arrayBuffer: ArrayBuffer
        
        if (file instanceof File) {
          console.log('[StaticPdfViewer] 处理本地文件:', file.name)
          arrayBuffer = await file.arrayBuffer()
        } else {
          console.log('[StaticPdfViewer] 获取远程文件:', file)
          
          // 添加超时机制
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
          
          try {
            const response = await fetch(file, { 
              signal: controller.signal,
              headers: {
                'Accept': 'application/pdf,*/*'
              }
            })
            clearTimeout(timeoutId)
            
            console.log('[StaticPdfViewer] 远程响应状态:', response.status)
            console.log('[StaticPdfViewer] 响应Content-Type:', response.headers.get('content-type'))
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            
            arrayBuffer = await response.arrayBuffer()
          } catch (fetchError) {
            clearTimeout(timeoutId)
            if (fetchError.name === 'AbortError') {
              throw new Error('PDF下载超时')
            }
            throw fetchError
          }
        }
        
        console.log('[StaticPdfViewer] ArrayBuffer大小:', arrayBuffer.byteLength)
        
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        console.log('[StaticPdfViewer] PDF文档加载成功，页数:', doc.numPages)
        
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        
        // 提取目录
        console.log('[StaticPdfViewer] 开始提取目录')
        await extractOutline(doc)
        
        // 立即渲染第一页，确保用户看到内容
        console.log('[StaticPdfViewer] 开始渲染第一页')
        await renderPage(doc, 1)
        
        // 批量预渲染所有页面，实现ChatPDF式的即时显示
        console.log('[StaticPdfViewer] 开始批量渲染所有页面')
        const renderPromises = []
        for (let i = 2; i <= Math.min(doc.numPages, 20); i++) {
          // 限制前20页进行立即渲染，防止内存过载
          renderPromises.push(renderPage(doc, i))
        }
        
        // 并发渲染多个页面
        Promise.allSettled(renderPromises).then(() => {
          console.log('[StaticPdfViewer] 前20页渲染完成')
          
          // 如果还有更多页面，继续渲染
          if (doc.numPages > 20) {
            setTimeout(() => {
              console.log('[StaticPdfViewer] 开始渲染剩余页面')
              const remainingPromises = []
              for (let i = 21; i <= doc.numPages; i++) {
                remainingPromises.push(renderPage(doc, i))
              }
              Promise.allSettled(remainingPromises).then(() => {
                console.log('[StaticPdfViewer] 所有页面渲染完成')
              })
            }, 1000) // 1秒后渲染剩余页面
          }
        })
        
        console.log('[StaticPdfViewer] PDF加载完成')
        
      } catch (err) {
        console.error('[StaticPdfViewer] PDF加载失败:', err)
        setError(err instanceof Error ? err.message : '加载PDF失败')
      } finally {
        console.log('[StaticPdfViewer] 设置加载状态为false')
        clearTimeout(timeoutId)
        setIsLoading(false)
      }
    }

    loadPDF()
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [file])

  // 渲染单个页面
  const renderPage = useCallback(async (doc: PDFDocumentProxy, pageNumber: number) => {
    console.log(`[StaticPdfViewer] 开始渲染页面${pageNumber}`)
    
    // 防止重复渲染同一页面
    if (renderingPages.current.has(pageNumber) || canvasesRef.current.has(pageNumber)) {
      console.log(`[StaticPdfViewer] 页面${pageNumber}已渲染或正在渲染中，跳过`)
      return
    }
    
    renderingPages.current.add(pageNumber)

    try {
      console.log(`[StaticPdfViewer] 获取页面${pageNumber}对象`)
      const page = await doc.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      console.log(`[StaticPdfViewer] 页面${pageNumber}视口大小:`, viewport.width, 'x', viewport.height)
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) {
        console.error(`[StaticPdfViewer] 无法获取页面${pageNumber}的2D上下文`)
        return
      }

      const devicePixelRatio = window.devicePixelRatio || 1
      canvas.width = viewport.width * devicePixelRatio
      canvas.height = viewport.height * devicePixelRatio
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      
      context.scale(devicePixelRatio, devicePixelRatio)
      
      console.log(`[StaticPdfViewer] 开始渲染页面${pageNumber}到Canvas`)
      
      // 异步渲染，立即更新状态以显示canvas容器
      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport
      })
      
      // 立即设置canvas到状态，让UI显示canvas容器
      console.log(`[StaticPdfViewer] 页面${pageNumber}开始渲染，立即更新状态`)
      setCanvases(prev => new Map(prev).set(pageNumber, canvas))
      
      // 等待渲染完成
      await renderTask.promise
      console.log(`[StaticPdfViewer] 页面${pageNumber}渲染完成`)
      
    } catch (error) {
      console.error(`[StaticPdfViewer] 页面${pageNumber}渲染失败:`, error)
    } finally {
      renderingPages.current.delete(pageNumber)
      console.log(`[StaticPdfViewer] 页面${pageNumber}渲染流程结束`)
    }
  }, [scale])

  // 懒加载逻辑
  useEffect(() => {
    if (!pdfDoc || !containerRef.current || numPages === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageElement = entry.target as HTMLElement
            const pageNumber = parseInt(pageElement.getAttribute('data-page-num') || '0')
            
            if (pageNumber > 0 && !renderingPages.current.has(pageNumber)) {
              // 使用ref检查是否已渲染，避免重复渲染
              if (!canvasesRef.current.has(pageNumber)) {
                console.log(`[StaticPdfViewer] 懒加载触发，渲染页面${pageNumber}`)
                renderPage(pdfDoc, pageNumber)
              }
            }
          }
        })
      },
      {
        rootMargin: '800px', // 大幅增加预加载范围
        threshold: 0 // 完全降低阈值，任何部分可见即触发
      }
    )

    // 立即设置观察器，不再延迟
    const pageElements = containerRef.current?.querySelectorAll('[data-page-num]')
    pageElements?.forEach((element) => {
      observer.observe(element)
    })
    
    // 备用：手动触发前几页的渲染
    const timeoutId = setTimeout(() => {
      for (let i = 1; i <= Math.min(5, numPages); i++) {
        if (!canvasesRef.current.has(i) && !renderingPages.current.has(i)) {
          console.log(`[StaticPdfViewer] 手动触发页面${i}渲染`)
          renderPage(pdfDoc, i)
        }
      }
    }, 50)

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [pdfDoc, numPages])

  // 滚动到指定页面
  const jumpToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= numPages && containerRef.current) {
      const pageElement = containerRef.current.querySelector(`[data-page-num="${pageNumber}"]`)
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setCurrentPage(pageNumber)
        onPageChange?.(pageNumber)
      }
    }
  }, [numPages, onPageChange])

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    jumpToPage,
    getCurrentPage: () => currentPage,
    getOutline: () => outline
  }), [jumpToPage, currentPage, outline])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载PDF...</p>
          {loadingTimeout && (
            <p className="text-orange-600 text-sm mt-2">加载时间较长，请检查网络连接</p>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center text-red-600">
          <p className="mb-2">加载失败</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!pdfDoc || numPages === 0) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <p className="text-gray-500">暂无PDF内容</p>
      </div>
    )
  }

  return (
    <div className={`h-full bg-gray-100 overflow-y-auto ${className}`}>
      <div ref={containerRef} className="flex flex-col items-center p-4 space-y-4">
        {Array.from({ length: numPages }, (_, index) => {
          const pageNumber = index + 1
          const canvas = canvases.get(pageNumber)
          
          return (
            <div
              key={pageNumber}
              data-page-num={pageNumber}
              className="bg-white shadow-lg border border-gray-200 relative"
              style={{ 
                width: 'fit-content',
                minHeight: canvas ? 'auto' : '800px'
              }}
            >
              {canvas ? (
                <div ref={(node) => {
                  if (node && canvas && !node.contains(canvas)) {
                    node.innerHTML = ''
                    node.appendChild(canvas)
                  }
                }} />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[800px] bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                      <div className="text-2xl text-gray-400">📄</div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-2 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-16 mx-auto"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">页面 {pageNumber}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

StaticPdfViewer.displayName = 'StaticPdfViewer'

export default StaticPdfViewer