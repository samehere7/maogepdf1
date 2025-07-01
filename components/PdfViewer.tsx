"use client"

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { VariableSizeList as List } from 'react-window'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import CanvasFallback from './CanvasFallback'
import './paragraph-highlight.css'

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
  textContent?: any
}

interface TextItem {
  str: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontName: string
  transform: number[]
  dir: string
}

interface Paragraph {
  id: string
  items: TextItem[]
  x: number
  y: number
  width: number
  height: number
  text: string
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
  const [containerHeight, setContainerHeight] = useState(600)
  
  // 添加缺失的状态变量
  const [highlightCanvas, setHighlightCanvas] = useState<Map<number, HTMLCanvasElement>>(new Map())
  const [hoveredParagraph, setHoveredParagraph] = useState<string | null>(null)
  
  const listRef = useRef<List>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // 监听容器尺寸变化 - 防抖优化
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const updateHeight = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (containerRef.current) {
          const newHeight = containerRef.current.clientHeight
          // 只有高度变化超过10px才更新，避免频繁重渲染
          if (Math.abs(newHeight - containerHeight) > 10) {
            setContainerHeight(newHeight)
          }
        } else {
          setContainerHeight(600) // 使用固定默认高度而不是动态计算
        }
      }, 100) // 防抖延迟100ms
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => {
      window.removeEventListener('resize', updateHeight)
      clearTimeout(timeoutId)
    }
  }, []) // 移除containerHeight依赖项，避免无限循环

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

  // 段落分组算法 - 增强版
  const groupIntoParagraphs = useCallback((textItems: TextItem[], viewport: any): Paragraph[] => {
    if (!textItems || textItems.length === 0) return []
    
    const paragraphs: Paragraph[] = []
    let currentParagraph: TextItem[] = []
    let paragraphId = 0
    
    // 按Y坐标和X坐标排序文本项
    const sortedItems = textItems.sort((a, b) => {
      const yDiff = Math.abs(a.y - b.y)
      if (yDiff < 3) { // 同一行的容差更小，提高精度
        return a.x - b.x
      }
      return a.y - b.y
    })
    
    // 计算平均字体大小和行高
    const avgFontSize = sortedItems.reduce((sum, item) => sum + item.fontSize, 0) / sortedItems.length
    const avgLineHeight = avgFontSize * 1.2
    
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i]
      const prevItem = i > 0 ? sortedItems[i - 1] : null
      const nextItem = i < sortedItems.length - 1 ? sortedItems[i + 1] : null
      
      let shouldStartNewParagraph = false
      
      if (!prevItem) {
        // 第一个项目，开始新段落
        shouldStartNewParagraph = true
      } else {
        // 增强的段落分割启发式规则
        const verticalGap = item.y - (prevItem.y + prevItem.height)
        const horizontalAlignment = Math.abs(item.x - prevItem.x)
        
        // 字体变化检测
        const fontSizeChange = Math.abs(item.fontSize - prevItem.fontSize) > avgFontSize * 0.15
        const significantFontChange = Math.abs(item.fontSize - prevItem.fontSize) > avgFontSize * 0.3
        
        // 缩进检测（段落开始的重要指标）
        const hasIndent = item.x > prevItem.x + 15 // 明显的缩进
        const hasOutdent = item.x < prevItem.x - 15 // 突出（如标题）
        
        // 行间距检测
        const normalLineBreak = verticalGap > avgLineHeight * 0.6 && verticalGap < avgLineHeight * 2
        const largeParagraphBreak = verticalGap > avgLineHeight * 1.5
        
        // 连续性检测
        const textContinuity = item.str.trim().length > 0 && prevItem.str.trim().length > 0
        
        // 特殊文本模式检测
        const isTitle = item.fontSize > avgFontSize * 1.2 || significantFontChange
        const isListItem = /^[\d\w\s]*[\.\)]\s/.test(item.str) // 列表项检测
        const isPunctuation = /^[。！？，；：""''（）[\]{}—–-]/.test(item.str)
        
        // 段落边界判断逻辑
        if (largeParagraphBreak || (normalLineBreak && (hasIndent || hasOutdent))) {
          shouldStartNewParagraph = true
        } else if (isTitle && (fontSizeChange || verticalGap > avgLineHeight * 0.8)) {
          shouldStartNewParagraph = true
        } else if (isListItem && (hasIndent || verticalGap > avgLineHeight * 0.7)) {
          shouldStartNewParagraph = true
        } else if (significantFontChange && verticalGap > avgLineHeight * 0.5) {
          shouldStartNewParagraph = true
        }
        
        // 特殊情况：避免不必要的分割
        if (shouldStartNewParagraph) {
          // 如果是标点符号，不分割
          if (isPunctuation) {
            shouldStartNewParagraph = false
          }
          // 如果文本太短且间距不大，不分割
          else if (item.str.trim().length < 3 && verticalGap < avgLineHeight) {
            shouldStartNewParagraph = false
          }
        }
      }
      
      if (shouldStartNewParagraph && currentParagraph.length > 0) {
        // 完成当前段落
        const paragraph = createParagraphFromItems(currentParagraph, `paragraph-${paragraphId++}`)
        if (paragraph && paragraph.text.trim().length > 0) { // 确保段落有内容
          paragraphs.push(paragraph)
        }
        currentParagraph = []
      }
      
      currentParagraph.push(item)
    }
    
    // 处理最后一个段落
    if (currentParagraph.length > 0) {
      const paragraph = createParagraphFromItems(currentParagraph, `paragraph-${paragraphId++}`)
      if (paragraph && paragraph.text.trim().length > 0) {
        paragraphs.push(paragraph)
      }
    }
    
    console.log(`[段落分组] 页面共分组为 ${paragraphs.length} 个段落，平均字体大小: ${avgFontSize.toFixed(1)}px`)
    return paragraphs
  }, [])
  
  // 从文本项创建段落对象
  const createParagraphFromItems = useCallback((items: TextItem[], id: string): Paragraph | null => {
    if (items.length === 0) return null
    
    const minX = Math.min(...items.map(item => item.x))
    const maxX = Math.max(...items.map(item => item.x + item.width))
    const minY = Math.min(...items.map(item => item.y))
    const maxY = Math.max(...items.map(item => item.y + item.height))
    
    return {
      id,
      items,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      text: items.map(item => item.str).join('').trim()
    }
  }, [])
  
  // 渲染高亮层
  const renderHighlightLayer = useCallback((pageContainer: HTMLElement, pageNumber: number, viewport: any, paragraphs: Paragraph[]) => {
    // 移除旧的高亮层
    const existingCanvas = pageContainer.querySelector('.highlight-canvas')
    if (existingCanvas) {
      // 清理旧的事件监听器
      if ((existingCanvas as any)._cleanup) {
        (existingCanvas as any)._cleanup()
      }
      existingCanvas.remove()
    }
    
    // 创建高亮canvas
    const canvas = document.createElement('canvas')
    canvas.className = 'highlight-canvas'
    const context = canvas.getContext('2d')
    if (!context) return
    
    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = viewport.width * devicePixelRatio
    canvas.height = viewport.height * devicePixelRatio
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '10'
    
    context.scale(devicePixelRatio, devicePixelRatio)
    
    // 保存canvas引用
    setHighlightCanvas(prev => new Map(prev).set(pageNumber, canvas))
    
    // 添加鼠标事件监听
    const textLayer = pageContainer.querySelector('.textLayer')
    if (textLayer) {
      let currentHoveredId: string | null = null
      
      const handleMouseMove = (e: MouseEvent) => {
        const rect = textLayer.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * viewport.width
        const y = ((e.clientY - rect.top) / rect.height) * viewport.height
        
        // 查找悬停的段落
        const hoveredPara = paragraphs.find(para => 
          x >= para.x && x <= para.x + para.width &&
          y >= para.y && y <= para.y + para.height
        )
        
        if (hoveredPara && hoveredPara.id !== currentHoveredId) {
          currentHoveredId = hoveredPara.id
          setHoveredParagraph(hoveredPara.id)
          drawParagraphHighlight(context, hoveredPara, viewport, devicePixelRatio)
        } else if (!hoveredPara && currentHoveredId) {
          currentHoveredId = null
          setHoveredParagraph(null)
          clearHighlight(context, canvas)
        }
      }
      
      const handleMouseLeave = () => {
        currentHoveredId = null
        setHoveredParagraph(null)
        clearHighlight(context, canvas)
      }
      
      // 添加事件监听器
      textLayer.addEventListener('mousemove', handleMouseMove)
      textLayer.addEventListener('mouseleave', handleMouseLeave)
      
      // 存储清理函数
      const cleanupFn = () => {
        textLayer.removeEventListener('mousemove', handleMouseMove)
        textLayer.removeEventListener('mouseleave', handleMouseLeave)
      }
      
      // 存储清理函数到canvas的自定义属性
      ;(canvas as any)._cleanup = cleanupFn
    }
    
    pageContainer.appendChild(canvas)
  }, [])
  
  // 绘制段落高亮
  const drawParagraphHighlight = useCallback((context: CanvasRenderingContext2D, paragraph: Paragraph, viewport: any, devicePixelRatio: number) => {
    // 清除之前的高亮
    context.clearRect(0, 0, viewport.width, viewport.height)
    
    // 设置高亮样式 - 渐变效果
    const padding = 6
    const x = paragraph.x - padding
    const y = paragraph.y - padding
    const width = paragraph.width + padding * 2
    const height = paragraph.height + padding * 2
    
    // 创建渐变背景
    const gradient = context.createLinearGradient(x, y, x, y + height)
    gradient.addColorStop(0, 'rgba(255, 235, 59, 0.25)')
    gradient.addColorStop(0.5, 'rgba(255, 235, 59, 0.35)')
    gradient.addColorStop(1, 'rgba(255, 235, 59, 0.25)')
    
    // 绘制圆角矩形背景
    context.fillStyle = gradient
    context.beginPath()
    const radius = 4
    
    // 手动绘制圆角矩形（兼容性更好）
    context.moveTo(x + radius, y)
    context.lineTo(x + width - radius, y)
    context.quadraticCurveTo(x + width, y, x + width, y + radius)
    context.lineTo(x + width, y + height - radius)
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    context.lineTo(x + radius, y + height)
    context.quadraticCurveTo(x, y + height, x, y + height - radius)
    context.lineTo(x, y + radius)
    context.quadraticCurveTo(x, y, x + radius, y)
    context.closePath()
    
    context.fill()
    
    // 绘制边框
    context.strokeStyle = 'rgba(255, 193, 7, 0.7)'
    context.lineWidth = 1.5
    context.stroke()
    
    // 添加左侧强调线
    context.strokeStyle = 'rgba(255, 152, 0, 0.8)'
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(x + 2, y + radius)
    context.lineTo(x + 2, y + height - radius)
    context.stroke()
    
    // 添加微妙的阴影效果
    context.shadowColor = 'rgba(255, 193, 7, 0.3)'
    context.shadowBlur = 4
    context.shadowOffsetX = 1
    context.shadowOffsetY = 1
    
    // 重置阴影
    context.shadowColor = 'transparent'
    context.shadowBlur = 0
    context.shadowOffsetX = 0
    context.shadowOffsetY = 0
  }, [])
  
  // 清除高亮
  const clearHighlight = useCallback((context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    context.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1))
  }, [])
  
  // 渲染单个页面
  const renderPage = useCallback(async (
    doc: PDFDocumentProxy, 
    pageNumber: number, 
    currentPageData: PageData[]
  ) => {
    try {
      const page = await doc.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      
      // 获取文本内容
      const textContent = await page.getTextContent()
      
      // 简化文本处理，移除段落分组
      // const textItems: TextItem[] = textContent.items.map((item: any) => {
      //   const transform = item.transform
      //   const fontHeight = Math.hypot(transform[2], transform[3])
      //   
      //   return {
      //     str: item.str,
      //     x: transform[4],
      //     y: transform[5],
      //     width: item.width,
      //     height: fontHeight,
      //     fontSize: fontHeight,
      //     fontName: item.fontName || 'sans-serif',
      //     transform: transform,
      //     dir: item.dir || 'ltr'
      //   }
      // })
      
      // 移除段落分组功能
      // const paragraphs = groupIntoParagraphs(textItems, viewport)
      
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
      
      // 渲染文本层（简化版，禁用段落高亮）
      // await renderTextLayer(page, viewport, pageNumber)

      // 更新页面数据
      setPageData(prev => {
        const newData = [...prev]
        newData[pageNumber - 1] = {
          ...newData[pageNumber - 1],
          height: viewport.height,
          rendered: true,
          canvas,
          textContent
        }
        return newData
      })

      console.log(`[PdfViewer] 页面${pageNumber}渲染完成`)
      
    } catch (error) {
      console.error(`[PdfViewer] 页面${pageNumber}渲染失败:`, error)
    }
  }, [scale])
  
  // 渲染文本层（简化版，主要用于悬停检测）
  const renderTextLayer = useCallback(async (page: any, viewport: any, pageNumber: number) => {
    const pageContainer = containerRef.current?.querySelector(`.pdf-page[data-page-num="${pageNumber}"]`) as HTMLElement
    if (!pageContainer) return
    
    // 移除旧的文本层
    const existingTextLayer = pageContainer.querySelector('.textLayer')
    if (existingTextLayer) {
      existingTextLayer.remove()
    }
    
    // 创建透明文本层用于悬停检测
    const textLayerDiv = document.createElement('div')
    textLayerDiv.className = 'textLayer'
    textLayerDiv.style.position = 'absolute'
    textLayerDiv.style.left = '0'
    textLayerDiv.style.top = '0'
    textLayerDiv.style.right = '0'
    textLayerDiv.style.bottom = '0'
    textLayerDiv.style.overflow = 'hidden'
    textLayerDiv.style.opacity = '0' // 透明，仅用于悬停检测
    textLayerDiv.style.lineHeight = '1'
    textLayerDiv.style.zIndex = '2'
    
    pageContainer.appendChild(textLayerDiv)
    
    // 渲染高亮层（简化版，移除段落依赖）
    // 注释掉段落相关功能，因为已经在前面简化了段落分组功能
  }, [])

  // 页面组件 - 移到 useCallback 中优化性能
  const PageItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const pageNumber = index + 1
    const pageInfo = pageData[index]
    
    return (
      <div style={style} className="flex justify-center p-4">
        <div 
          data-page-num={pageNumber}
          className="bg-white shadow-lg border border-gray-200 relative pdf-page"
          style={{ 
            width: 'fit-content',
            minHeight: pageInfo?.height || 800
          }}
        >
          {pageInfo?.canvas ? (
            <div
              ref={node => {
                if (node && pageInfo.canvas && !node.contains(pageInfo.canvas)) {
                  // 清空并添加新内容
                  node.innerHTML = ''
                  node.appendChild(pageInfo.canvas)
                }
              }}
              style={{ position: 'relative' }}
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
  }, [pageData]) // 需要保持pageData依赖以获取最新数据

  // 获取页面高度（用于虚拟滚动）- 使用固定高度避免重渲染
  const getItemSize = useCallback((index: number) => {
    // 使用固定高度，避免动态计算导致的重渲染
    return 832 // 800 + 32 padding，固定高度
  }, []) // 不依赖任何变量，保持稳定

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

  // 渲染初始页面 - 简化版本
  useEffect(() => {
    if (!pdfDoc || !numPages || pageData.length === 0) return

    // 简单地渲染第一页，不检查是否已渲染
    const timer = setTimeout(() => {
      renderPage(pdfDoc, 1, pageData)
    }, 100)

    return () => clearTimeout(timer)
  }, [pdfDoc, numPages]) // 只依赖基本参数

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

  const renderPdfContent = () => (
    <div className={`h-full bg-gray-100 ${className}`}>
      <List
        ref={listRef}
        height={containerHeight} // 使用状态中的固定高度
        itemCount={numPages}
        itemSize={getItemSize}
        onScroll={handleScroll}
        className="pdf-viewer-list"
      >
        {PageItem}
      </List>
    </div>
  )

  return (
    <CanvasFallback onCanvasReady={() => console.log('[PdfViewer] Canvas就绪，PDF可以正常渲染')}>
      {renderPdfContent()}
    </CanvasFallback>
  )
})

PdfViewer.displayName = 'PdfViewer'

export default PdfViewer