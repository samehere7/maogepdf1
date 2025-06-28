"use client"

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { VariableSizeList as List } from 'react-window'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

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

interface PdfViewerProps {
  file: File | string | null
  onOutlineLoaded?: (outline: OutlineItem[]) => void
  onPageChange?: (currentPage: number) => void
  className?: string
}

export interface PdfViewerRef {
  jumpToPage: (pageNumber: number) => void
  getCurrentPage: () => number
  getOutline: () => OutlineItem[]
}

interface PageData {
  pageNumber: number
  height: number
  rendered: boolean
  canvas?: HTMLCanvasElement
}

const PdfViewer = forwardRef<PdfViewerRef, PdfViewerProps>(({ 
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
  const [pageData, setPageData] = useState<PageData[]>([])
  
  const listRef = useRef<List>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // 提取PDF outline信息
  const extractOutline = useCallback(async (doc: PDFDocumentProxy) => {
    try {
      console.log('[PdfViewer] 提取PDF目录信息...')
      
      const outlineData = await doc.getOutline()
      if (!outlineData || outlineData.length === 0) {
        console.log('[PdfViewer] 此PDF没有目录信息')
        setOutline([])
        onOutlineLoaded?.([])
        return
      }

      // 递归处理outline项
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
              console.warn('[PdfViewer] 解析目录项页码失败:', item.title, error)
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
      
      console.log('[PdfViewer] 目录提取完成，共', processedOutline.length, '个顶级项目')
      
    } catch (error) {
      console.error('[PdfViewer] 提取目录失败:', error)
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
        
        let arrayBuffer: ArrayBuffer
        
        if (file instanceof File) {
          // 本地文件
          console.log('[PdfViewer] 加载本地文件:', file.name)
          arrayBuffer = await file.arrayBuffer()
        } else {
          // 远程URL
          console.log('[PdfViewer] 加载远程文件:', file)
          const response = await fetch(file)
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }
          arrayBuffer = await response.arrayBuffer()
        }
        
        console.log('[PdfViewer] 文件加载完成，大小:', arrayBuffer.byteLength, 'bytes')
        
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        console.log('[PdfViewer] PDF文档解析完成，页数:', doc.numPages)
        
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        
        // 初始化页面数据
        const initialPageData: PageData[] = Array.from({ length: doc.numPages }, (_, index) => ({
          pageNumber: index + 1,
          height: 800, // 默认高度，渲染后会更新
          rendered: false
        }))
        setPageData(initialPageData)
        
        // 提取目录
        await extractOutline(doc)
        
        // 预渲染第一页
        await renderPage(doc, 1, initialPageData)
        
      } catch (err) {
        console.error('[PdfViewer] PDF加载失败:', err)
        setError(err instanceof Error ? err.message : '加载PDF失败')
      } finally {
        setIsLoading(false)
      }
    }

    loadPDF()
  }, [file, extractOutline])

  // 渲染单个页面
  const renderPage = useCallback(async (
    doc: PDFDocumentProxy, 
    pageNumber: number, 
    currentPageData: PageData[]
  ) => {
    try {
      const page = await doc.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      
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

      // 更新页面数据
      setPageData(prev => {
        const newData = [...prev]
        newData[pageNumber - 1] = {
          ...newData[pageNumber - 1],
          height: viewport.height,
          rendered: true,
          canvas
        }
        return newData
      })

      console.log(`[PdfViewer] 页面${pageNumber}渲染完成`)
      
    } catch (error) {
      console.error(`[PdfViewer] 页面${pageNumber}渲染失败:`, error)
    }
  }, [scale])

  // 页面组件
  const PageItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const pageNumber = index + 1
    const pageInfo = pageData[index]
    const pageRef = useRef<HTMLDivElement>(null)

    // 注册页面引用
    useEffect(() => {
      if (pageRef.current) {
        pageRefs.current.set(pageNumber, pageRef.current)
      }
      return () => {
        pageRefs.current.delete(pageNumber)
      }
    }, [pageNumber])

    // 懒加载页面
    useEffect(() => {
      if (pdfDoc && !pageInfo?.rendered) {
        renderPage(pdfDoc, pageNumber, pageData)
      }
    }, [pageNumber, pageInfo?.rendered, pdfDoc])

    return (
      <div style={style} className="flex justify-center p-4">
        <div 
          ref={pageRef}
          className="bg-white shadow-lg border border-gray-200 relative"
          style={{ 
            width: 'fit-content',
            minHeight: pageInfo?.height || 800
          }}
        >
          {pageInfo?.canvas ? (
            <div
              ref={node => {
                if (node && pageInfo.canvas && !node.contains(pageInfo.canvas)) {
                  node.appendChild(pageInfo.canvas)
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">加载页面 {pageNumber}...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 获取页面高度（用于虚拟滚动）
  const getItemSize = useCallback((index: number) => {
    const pageInfo = pageData[index]
    return (pageInfo?.height || 800) + 32 // 加上padding
  }, [pageData])

  // 滚动到指定页面
  const jumpToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= numPages && listRef.current) {
      listRef.current.scrollToItem(pageNumber - 1, 'start')
      setCurrentPage(pageNumber)
      onPageChange?.(pageNumber)
    }
  }, [numPages, onPageChange])

  // 更新当前页面
  const handleScroll = useCallback(() => {
    // 这里可以实现滚动时更新当前页面的逻辑
    // 暂时简化处理
  }, [])

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

  if (!pdfDoc || pageData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <p className="text-gray-500">暂无PDF内容</p>
      </div>
    )
  }

  return (
    <div className={`h-full bg-gray-100 ${className}`}>
      <List
        ref={listRef}
        height={window.innerHeight - 100} // 动态计算高度
        itemCount={numPages}
        itemSize={getItemSize}
        onScroll={handleScroll}
        className="pdf-viewer-list"
      >
        {PageItem}
      </List>
    </div>
  )
})

PdfViewer.displayName = 'PdfViewer'

export default PdfViewer