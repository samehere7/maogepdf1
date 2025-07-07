"use client"

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'

// 动态导入PDF.js，避免模块冲突
let pdfjsLib: any = null
let pdfjsLoaded = false

if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((pdfjs) => {
    pdfjsLib = pdfjs
    pdfjsLoaded = true
    
    // 配置 PDF.js worker - 使用官方CDN避免Next.js打包问题
    const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
    
    console.log('[SimplePdfViewer] PDF.js加载完成')
  }).catch((error) => {
    console.error('[SimplePdfViewer] PDF.js加载失败:', error)
  })
}

interface OutlineItem {
  title: string
  dest: any
  items?: OutlineItem[]
  pageNumber?: number
  level: number
}

interface SimplePdfViewerProps {
  file: File | string | null
  onOutlineLoaded?: (outline: OutlineItem[]) => void
  onPageChange?: (currentPage: number) => void
  className?: string
}

export interface SimplePdfViewerRef {
  jumpToPage: (pageNumber: number) => void
  getCurrentPage: () => number
  getOutline: () => OutlineItem[]
}

const SimplePdfViewer = forwardRef<SimplePdfViewerRef, SimplePdfViewerProps>(({ 
  file, 
  onOutlineLoaded, 
  onPageChange,
  className = ""
}, ref) => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outline, setOutline] = useState<OutlineItem[]>([])
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set())
  
  const containerRef = useRef<HTMLDivElement>(null)

  // 提取PDF outline信息
  const extractOutline = useCallback(async (doc: PDFDocumentProxy) => {
    try {
      console.log('[SimplePdfViewer] 提取PDF目录信息...')
      
      const outlineData = await doc.getOutline()
      if (!outlineData || outlineData.length === 0) {
        console.log('[SimplePdfViewer] 此PDF没有目录信息')
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
              console.warn('[SimplePdfViewer] 解析目录项页码失败:', item.title, error)
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
      
      console.log('[SimplePdfViewer] 目录提取完成，共', processedOutline.length, '个顶级项目')
      
    } catch (error) {
      console.error('[SimplePdfViewer] 提取目录失败:', error)
      setOutline([])
      onOutlineLoaded?.([])
    }
  }, [onOutlineLoaded])

  // 加载PDF文档
  useEffect(() => {
    if (!file) return

    const loadPDF = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // 等待PDF.js加载完成
        if (!pdfjsLoaded || !pdfjsLib) {
          console.log('[SimplePdfViewer] 等待PDF.js加载...')
          
          // 最多等待10秒
          let attempts = 0
          const maxAttempts = 100
          
          while ((!pdfjsLoaded || !pdfjsLib) && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100))
            attempts++
          }
          
          if (!pdfjsLoaded || !pdfjsLib) {
            throw new Error('PDF.js加载超时，请刷新页面重试')
          }
        }
        
        console.log('[SimplePdfViewer] PDF.js已就绪，开始加载文档')
        
        let arrayBuffer: ArrayBuffer
        
        if (file instanceof File) {
          console.log('[SimplePdfViewer] 加载本地文件:', file.name)
          arrayBuffer = await file.arrayBuffer()
        } else {
          console.log('[SimplePdfViewer] 加载远程文件:', file)
          const response = await fetch(file)
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }
          arrayBuffer = await response.arrayBuffer()
        }
        
        console.log('[SimplePdfViewer] 文件加载完成，大小:', arrayBuffer.byteLength, 'bytes')
        
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        console.log('[SimplePdfViewer] PDF文档解析完成，页数:', doc.numPages)
        
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        
        // 提取目录
        await extractOutline(doc)
        
        // 只渲染第一页，其他页面懒加载
        await renderPage(doc, 1)
        
      } catch (err) {
        console.error('[SimplePdfViewer] PDF加载失败:', err)
        setError(err instanceof Error ? err.message : '加载PDF失败')
      } finally {
        setIsLoading(false)
      }
    }

    loadPDF()
  }, [file, extractOutline])

  // 懒加载逻辑
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageElement = entry.target as HTMLElement
            const pageNumber = parseInt(pageElement.getAttribute('data-page-num') || '0')
            
            if (pageNumber > 0 && !renderedPages.has(pageNumber)) {
              renderPage(pdfDoc, pageNumber)
            }
          }
        })
      },
      {
        rootMargin: '200px',
        threshold: 0.1
      }
    )

    const pageElements = containerRef.current.querySelectorAll('[data-page-num]')
    pageElements.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [pdfDoc]) // 移除renderPage和renderedPages依赖项，避免循环

  // 渲染单个页面
  const renderPage = useCallback(async (doc: PDFDocumentProxy, pageNumber: number) => {
    if (renderedPages.has(pageNumber)) return

    try {
      console.log(`[SimplePdfViewer] 开始渲染页面${pageNumber}`)
      
      const page = await doc.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      
      // 找到页面容器
      const pageContainer = containerRef.current?.querySelector(`[data-page-num="${pageNumber}"]`) as HTMLElement
      if (!pageContainer) return

      // 创建canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) return

      const devicePixelRatio = window.devicePixelRatio || 1
      canvas.width = viewport.width * devicePixelRatio
      canvas.height = viewport.height * devicePixelRatio
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      
      context.scale(devicePixelRatio, devicePixelRatio)
      
      // 渲染PDF页面
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      // 替换页面内容
      pageContainer.innerHTML = ''
      pageContainer.appendChild(canvas)
      
      // 标记为已渲染
      setRenderedPages(prev => new Set([...prev, pageNumber]))
      
      console.log(`[SimplePdfViewer] 页面${pageNumber}渲染完成`)
      
    } catch (error) {
      console.error(`[SimplePdfViewer] 页面${pageNumber}渲染失败:`, error)
    }
  }, [scale, renderedPages])

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
          const isRendered = renderedPages.has(pageNumber)
          
          return (
            <div
              key={pageNumber}
              data-page-num={pageNumber}
              className="bg-white shadow-lg border border-gray-200 relative"
              style={{ 
                width: 'fit-content',
                minHeight: isRendered ? 'auto' : '800px'
              }}
            >
              {!isRendered && (
                <div className="flex items-center justify-center h-full min-h-[800px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">加载页面 {pageNumber}...</p>
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

SimplePdfViewer.displayName = 'SimplePdfViewer'

export default SimplePdfViewer