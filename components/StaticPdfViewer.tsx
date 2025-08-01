"use client"

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import dynamic from 'next/dynamic'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CanvasFallback from './CanvasFallback'
import './text-layer.css'

// 改进的PDF.js动态加载系统
class PDFJSLoader {
  private static instance: PDFJSLoader | null = null
  private pdfjsLib: any = null
  private loadPromise: Promise<any> | null = null
  private isLoaded = false

  static getInstance(): PDFJSLoader {
    if (!PDFJSLoader.instance) {
      PDFJSLoader.instance = new PDFJSLoader()
    }
    return PDFJSLoader.instance
  }

  async loadPDFJS(): Promise<any> {
    // 环境检查
    if (typeof window === 'undefined') {
      throw new Error('PDF.js只能在客户端环境中加载')
    }

    // 如果已经加载完成，直接返回
    if (this.isLoaded && this.pdfjsLib) {
      return this.pdfjsLib
    }

    // 如果正在加载中，等待加载完成
    if (this.loadPromise) {
      return this.loadPromise
    }

    // 开始新的加载过程
    this.loadPromise = this.performLoad()
    return this.loadPromise
  }

  private async performLoad(): Promise<any> {
    try {
      console.log('[PDFJSLoader] 开始加载PDF.js...')
      
      // 动态导入PDF.js
      const pdfjs = await import('pdfjs-dist')
      
      // 验证PDF.js是否正确加载
      if (!pdfjs || !pdfjs.getDocument) {
        throw new Error('PDF.js模块加载不完整')
      }
      
      // 改进的Worker配置策略
      await this.configureWorker(pdfjs)
      
      this.pdfjsLib = pdfjs
      this.isLoaded = true
      
      console.log('[PDFJSLoader] PDF.js加载完成，版本:', pdfjs.version)
      
      return pdfjs
      
    } catch (error) {
      console.error('[PDFJSLoader] PDF.js加载失败:', error)
      
      // 重置状态，允许重试
      this.loadPromise = null
      this.isLoaded = false
      this.pdfjsLib = null
      
      throw new Error(`PDF.js加载失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async configureWorker(pdfjs: any): Promise<void> {
    if (!pdfjs.GlobalWorkerOptions) {
      console.warn('[PDFJSLoader] GlobalWorkerOptions不可用，跳过Worker配置')
      return
    }

    // 优先级策略：本地 > CDN fallback > 内联Worker
    const workerStrategies = [
      // 策略1：使用本地Worker文件（如果存在）
      `/pdf.worker.min.js`,
      
      // 策略2：使用稳定的CDN
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
      
      // 策略3：使用unpkg作为备选
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
      
      // 策略4：使用jsdelivr作为第二备选
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
    ]

    for (const workerSrc of workerStrategies) {
      try {
        console.log(`[PDFJSLoader] 尝试Worker配置: ${workerSrc}`)
        
        // 测试Worker是否可访问（仅对远程URL）
        if (workerSrc.startsWith('http')) {
          const testResponse = await fetch(workerSrc, { 
            method: 'HEAD',
            mode: 'no-cors' // 避免CORS问题
          })
          console.log(`[PDFJSLoader] Worker测试响应: ${testResponse.status}`)
        }
        
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
        console.log(`[PDFJSLoader] Worker配置成功: ${workerSrc}`)
        return
        
      } catch (error) {
        console.warn(`[PDFJSLoader] Worker配置失败: ${workerSrc}`, error)
        continue
      }
    }

    // 如果所有策略都失败，尝试内联Worker作为最后手段
    try {
      console.log('[PDFJSLoader] 尝试内联Worker配置')
      pdfjs.GlobalWorkerOptions.workerSrc = 'data:application/javascript;base64,aW1wb3J0U2NyaXB0cygiaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvcGRmLmpzLzMuMTEuMTc0L3BkZi53b3JrZXIubWluLmpzIik7'
    } catch (error) {
      console.error('[PDFJSLoader] 内联Worker配置也失败，继续无Worker模式')
    }
  }

  // 重置加载器状态（用于错误恢复）
  reset(): void {
    this.loadPromise = null
    this.isLoaded = false
    this.pdfjsLib = null
    console.log('[PDFJSLoader] 加载器状态已重置')
  }
}

// 全局PDF.js加载器实例
const pdfLoader = PDFJSLoader.getInstance()

// 兼容性包装函数
const loadPDFJS = () => pdfLoader.loadPDFJS()

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
  onTextSelect?: (text: string, action: 'explain' | 'summarize' | 'rewrite') => void
  className?: string
}

export interface StaticPdfViewerRef {
  jumpToPage: (pageNumber: number) => void
  getCurrentPage: () => number
  getOutline: () => OutlineItem[]
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

const StaticPdfViewer = forwardRef<StaticPdfViewerRef, StaticPdfViewerProps>(({ 
  file, 
  onOutlineLoaded, 
  onPageChange,
  onTextSelect,
  className = ""
}, ref) => {
  const [pdfDoc, setPdfDoc] = useState<any | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outline, setOutline] = useState<OutlineItem[]>([])
  const [canvases, setCanvases] = useState<Map<number, HTMLCanvasElement>>(new Map())
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  
  // 新增：PDF查看器控制状态
  const [scale, setScale] = useState(1.2) // 可变缩放比例
  const [rotation, setRotation] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [pageInput, setPageInput] = useState('')
  
  // 文本选择相关状态
  const [selectedText, setSelectedText] = useState('')
  const [showTextActions, setShowTextActions] = useState(false)
  const [textActionsPosition, setTextActionsPosition] = useState<{x: number, y: number} | null>(null)
  
  // 客户端渲染检查
  const [isClient, setIsClient] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const renderingPages = useRef<Set<number>>(new Set())
  const canvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // 客户端初始化和安全模式检测
  useEffect(() => {
    setIsClient(true)
    
    // 监听安全模式激活事件
    const handleSafeModeEvent = () => {
      console.log('[StaticPdfViewer] 安全模式已激活')
      setIsSafeMode(true)
      setError(null) // 清除错误，让安全模式接管
    }
    
    window.addEventListener('enableSafeMode', handleSafeModeEvent)
    
    return () => {
      window.removeEventListener('enableSafeMode', handleSafeModeEvent)
    }
  }, [])
  
  // 同步canvases状态到ref
  useEffect(() => {
    canvasesRef.current = canvases
  }, [canvases])

  // 当缩放或旋转变化时，重新渲染所有已渲染的页面
  useEffect(() => {
    if (!pdfDoc) return
    
    const currentCanvases = canvasesRef.current
    if (currentCanvases.size > 0) {
      console.log('[StaticPdfViewer] 缩放/旋转变化，重新渲染所有页面')
      // 清空当前canvas
      setCanvases(new Map())
      canvasesRef.current.clear()
      renderingPages.current.clear()
      
      // 重新渲染所有之前渲染过的页面
      const pagesToRerender = Array.from(currentCanvases.keys())
      pagesToRerender.forEach(pageNum => {
        setTimeout(() => renderPage(pdfDoc, pageNum), pageNum * 50) // 错开渲染时间
      })
    }
  }, [scale, rotation, pdfDoc, renderPage])

  // 提取PDF outline信息
  const extractOutline = useCallback(async (doc: any) => {
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

  // 渲染文本层
  const renderTextLayer = useCallback(async (page: any, viewport: any, pageContainer: HTMLElement, pageNum: number) => {
    try {
      // 确保PDF.js已加载且完全可用
      const pdfjsLib = await loadPDFJS()
      if (!pdfjsLib) {
        console.warn('[StaticPdfViewer] PDF.js未加载，跳过文本层渲染')
        return
      }
      
      const textContent = await page.getTextContent()
      
      // 创建文本层容器
      const textLayerDiv = document.createElement('div')
      textLayerDiv.className = 'textLayer'
      textLayerDiv.style.position = 'absolute'
      textLayerDiv.style.inset = '0'
      textLayerDiv.style.overflow = 'clip'
      textLayerDiv.style.opacity = '1'
      textLayerDiv.style.lineHeight = '1'
      textLayerDiv.style.zIndex = '10'
      textLayerDiv.style.transformOrigin = '0 0'
      
      // 渲染文本项
      textContent.items.forEach((item: any, index: number) => {
        const span = document.createElement('span')
        
        // 安全检查PDF.js工具函数的可用性
        if (!pdfjsLib.Util || !pdfjsLib.Util.transform || typeof pdfjsLib.Util.transform !== 'function') {
          console.warn('[StaticPdfViewer] PDF.js Util.transform未可用，使用fallback')
          // 使用简化的坐标计算作为fallback
          const fallbackLeft = item.transform ? item.transform[4] : 0
          const fallbackTop = item.transform ? (item.transform[5] - (item.height || 12)) : 0
          
          span.style.position = 'absolute'
          span.style.left = `${((100 * fallbackLeft) / viewport.width).toFixed(4)}%`
          span.style.top = `${((100 * fallbackTop) / viewport.height).toFixed(4)}%`
          span.style.fontSize = `${item.height || 12}px`
          span.style.fontFamily = 'sans-serif'
          span.style.whiteSpace = 'pre'
          span.style.color = 'transparent'
          span.style.cursor = 'text'
          span.style.userSelect = 'text'
          span.style.webkitUserSelect = 'text'
          span.style.pointerEvents = 'auto'
          span.style.transformOrigin = '0% 0%'
          
          span.textContent = item.str
          span.setAttribute('data-text-index', index.toString())
          span.setAttribute('data-page-num', pageNum.toString())
          
          textLayerDiv.appendChild(span)
          return
        }
        
        // 安全调用PDF.js工具函数
        let tx
        try {
          tx = pdfjsLib.Util.transform(viewport.transform, item.transform)
        } catch (error) {
          console.warn('[StaticPdfViewer] PDF.js transform调用失败，使用fallback:', error)
          // 使用fallback
          const fallbackLeft = item.transform ? item.transform[4] : 0
          const fallbackTop = item.transform ? (item.transform[5] - (item.height || 12)) : 0
          
          span.style.position = 'absolute'
          span.style.left = `${((100 * fallbackLeft) / viewport.width).toFixed(4)}%`
          span.style.top = `${((100 * fallbackTop) / viewport.height).toFixed(4)}%`
          span.style.fontSize = `${item.height || 12}px`
          span.style.fontFamily = 'sans-serif'
          span.style.whiteSpace = 'pre'
          span.style.color = 'transparent'
          span.style.cursor = 'text'
          span.style.userSelect = 'text'
          span.style.webkitUserSelect = 'text'
          span.style.pointerEvents = 'auto'
          span.style.transformOrigin = '0% 0%'
          
          span.textContent = item.str
          span.setAttribute('data-text-index', index.toString())
          span.setAttribute('data-page-num', pageNum.toString())
          
          textLayerDiv.appendChild(span)
          return
        }
        
        let angle = Math.atan2(tx[1], tx[0])
        const style = textContent.styles[item.fontName]
        const fontFamily = style?.fontFamily || 'sans-serif'
        
        if (style?.vertical) {
          angle += Math.PI / 2
        }
        
        const fontHeight = Math.hypot(tx[2], tx[3])
        const fontAscent = fontHeight * 0.8
        
        let left, top
        if (angle === 0) {
          left = tx[4]
          top = tx[5] - fontAscent
        } else {
          left = tx[4] + fontAscent * Math.sin(angle)
          top = tx[5] - fontAscent * Math.cos(angle)
        }
        
        const pageWidth = viewport.width
        const pageHeight = viewport.height
        
        span.style.position = 'absolute'
        span.style.left = `${((100 * left) / pageWidth).toFixed(4)}%`
        span.style.top = `${((100 * top) / pageHeight).toFixed(4)}%`
        span.style.fontSize = `${fontHeight.toFixed(2)}px`
        span.style.fontFamily = fontFamily
        span.style.whiteSpace = 'pre'
        span.style.color = 'transparent'
        span.style.cursor = 'text'
        span.style.userSelect = 'text'
        span.style.webkitUserSelect = 'text'
        span.style.pointerEvents = 'auto'
        span.style.transformOrigin = '0% 0%'
        
        if (angle !== 0) {
          span.style.transform = `rotate(${angle}rad)`
        }
        
        span.textContent = item.str
        span.setAttribute('data-text-index', index.toString())
        span.setAttribute('data-page-num', pageNum.toString())
        
        textLayerDiv.appendChild(span)
      })
      
      // 添加endOfContent元素
      const endOfContent = document.createElement('div')
      endOfContent.className = 'endOfContent'
      endOfContent.style.display = 'block'
      endOfContent.style.position = 'absolute'
      endOfContent.style.inset = '100% 0 0'
      endOfContent.style.zIndex = '-1'
      endOfContent.style.cursor = 'default'
      endOfContent.style.userSelect = 'none'
      textLayerDiv.appendChild(endOfContent)
      
      pageContainer.appendChild(textLayerDiv)
      
    } catch (err) {
      console.error('文本层渲染错误:', err)
    }
  }, [])

  // 加载PDF文档
  useEffect(() => {
    if (!file) {
      console.log('[StaticPdfViewer] 没有文件，跳过加载')
      setError(null) // 清除之前的错误
      setIsLoading(false)
      setLoadingTimeout(false)
      return
    }

    console.log('[StaticPdfViewer] 开始加载PDF文件:', file)
    console.log('[StaticPdfViewer] 文件类型:', typeof file)
    console.log('[StaticPdfViewer] 是否为File对象:', file instanceof File)

    // 设置15秒加载超时（缩短超时时间）
    const timeoutId = setTimeout(() => {
      console.warn('[StaticPdfViewer] PDF加载超时，可能网络较慢或文件较大')
      setLoadingTimeout(true)
      setError('PDF加载时间较长，请检查网络连接或文件大小')
      setIsLoading(false)
    }, 15000)

    const loadPDF = async (retryCount = 0) => {
      const maxRetries = 3
      
      try {
        setIsLoading(true)
        setError(null)
        setLoadingTimeout(false)
        console.log(`[StaticPdfViewer] 开始PDF加载尝试 ${retryCount + 1}/${maxRetries + 1}`)
        
        // 使用改进的PDF.js加载器
        console.log('[StaticPdfViewer] 开始加载PDF.js...')
        const pdfjsLib = await loadPDFJS()
        console.log('[StaticPdfViewer] PDF.js加载验证成功')
        
        let arrayBuffer: ArrayBuffer
        
        if (file instanceof File) {
          console.log('[StaticPdfViewer] 处理本地文件:', file.name)
          arrayBuffer = await file.arrayBuffer()
        } else {
          console.log('[StaticPdfViewer] 获取远程文件:', file)
          arrayBuffer = await fetchPDFWithRetry(file, retryCount)
        }
        
        console.log('[StaticPdfViewer] ArrayBuffer大小:', arrayBuffer.byteLength)
        
        // 验证PDF文件完整性
        if (arrayBuffer.byteLength === 0) {
          throw new Error('PDF文件为空')
        }
        
        // 检查PDF文件头
        const header = new Uint8Array(arrayBuffer.slice(0, 4))
        const headerStr = String.fromCharCode(...header)
        if (!headerStr.startsWith('%PDF')) {
          throw new Error('文件不是有效的PDF格式')
        }
        
        const doc = await pdfjsLib.getDocument({ 
          data: arrayBuffer,
          // 添加PDF.js配置选项
          verbosity: 0, // 减少控制台输出
          disableAutoFetch: false,
          disableStream: false,
          disableRange: false
        }).promise
        
        console.log('[StaticPdfViewer] PDF文档加载成功，页数:', doc.numPages)
        
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        
        // 提取目录
        console.log('[StaticPdfViewer] 开始提取目录')
        await extractOutline(doc)
        
        // 智能渲染策略
        await performSmartRendering(doc)
        
        console.log('[StaticPdfViewer] PDF加载完成')
        
      } catch (err) {
        console.error(`[StaticPdfViewer] PDF加载失败 (尝试 ${retryCount + 1}):`, err)
        
        // 智能重试逻辑
        if (retryCount < maxRetries && shouldRetry(err)) {
          console.log(`[StaticPdfViewer] 准备重试 (${retryCount + 2}/${maxRetries + 1})`)
          
          // 重置PDF.js加载器状态
          pdfLoader.reset()
          
          // 指数退避延迟
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
          setTimeout(() => {
            loadPDF(retryCount + 1)
          }, delay)
          
          return
        }
        
        // 最终失败处理
        const errorMessage = generateUserFriendlyError(err)
        setError(errorMessage)
        
        // 记录详细错误信息用于调试
        logDetailedError(err, retryCount)
        
      } finally {
        console.log('[StaticPdfViewer] 设置加载状态为false')
        clearTimeout(timeoutId)
        setIsLoading(false)
      }
    }

    // 智能远程文件获取
    const fetchPDFWithRetry = async (url: string, retryCount: number): Promise<ArrayBuffer> => {
      const timeout = Math.min(8000 + (retryCount * 2000), 15000) // 递增超时
      const controller = new AbortController()
      const fetchTimeoutId = setTimeout(() => controller.abort(), timeout)
      
      try {
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/pdf,*/*',
            'Cache-Control': retryCount > 0 ? 'no-cache' : 'default'
          }
        })
        clearTimeout(fetchTimeoutId)
        
        console.log('[StaticPdfViewer] 远程响应状态:', response.status)
        console.log('[StaticPdfViewer] 响应Content-Type:', response.headers.get('content-type'))
        
        if (!response.ok) {
          throw new Error(`PDF文件下载失败: ${response.status} ${response.statusText}`)
        }
        
        return await response.arrayBuffer()
        
      } catch (fetchError) {
        clearTimeout(fetchTimeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error(`PDF文件下载超时 (${timeout}ms)，请检查网络连接`)
        }
        throw fetchError
      }
    }

    // 智能渲染策略
    const performSmartRendering = async (doc: any) => {
      try {
        // 第一阶段：立即渲染第一页
        console.log('[StaticPdfViewer] 第一阶段：渲染第一页')
        await renderPage(doc, 1)
        
        // 第二阶段：预渲染前几页
        const initialPages = Math.min(doc.numPages, 5)
        console.log(`[StaticPdfViewer] 第二阶段：预渲染前${initialPages}页`)
        
        const initialPromises = []
        for (let i = 2; i <= initialPages; i++) {
          initialPromises.push(renderPage(doc, i))
        }
        
        await Promise.allSettled(initialPromises)
        console.log('[StaticPdfViewer] 初始页面渲染完成')
        
        // 第三阶段：后台渲染剩余页面
        if (doc.numPages > initialPages) {
          setTimeout(async () => {
            console.log('[StaticPdfViewer] 第三阶段：后台渲染剩余页面')
            const remainingPromises = []
            
            for (let i = initialPages + 1; i <= doc.numPages; i++) {
              remainingPromises.push(renderPage(doc, i))
            }
            
            await Promise.allSettled(remainingPromises)
            console.log('[StaticPdfViewer] 所有页面渲染完成')
          }, 500)
        }
        
      } catch (renderError) {
        console.error('[StaticPdfViewer] 智能渲染过程中出错:', renderError)
        // 即使渲染出错，也不影响PDF的基本加载
      }
    }

    // 判断是否应该重试
    const shouldRetry = (error: any): boolean => {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // 网络相关错误通常可以重试
      if (errorMessage.includes('超时') || 
          errorMessage.includes('网络') || 
          errorMessage.includes('fetch') ||
          errorMessage.includes('AbortError')) {
        return true
      }
      
      // PDF.js Worker相关错误可以重试
      if (errorMessage.includes('Worker') || 
          errorMessage.includes('worker')) {
        return true
      }
      
      // 暂时性错误可以重试
      if (errorMessage.includes('暂时') || 
          errorMessage.includes('临时')) {
        return true
      }
      
      return false
    }

    // 生成用户友好的错误消息
    const generateUserFriendlyError = (error: any): string => {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('超时')) {
        return 'PDF加载超时，请检查网络连接或稍后重试'
      }
      
      if (errorMessage.includes('Worker')) {
        return 'PDF处理器初始化失败，请刷新页面重试'
      }
      
      if (errorMessage.includes('不是有效的PDF')) {
        return '文件格式不正确，请确保上传的是有效的PDF文件'
      }
      
      if (errorMessage.includes('下载失败')) {
        return 'PDF文件下载失败，请检查文件链接或网络连接'
      }
      
      return `PDF加载失败：${errorMessage}`
    }

    // 记录详细错误信息
    const logDetailedError = (error: any, retryCount: number) => {
      const errorInfo = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        retryCount,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        fileType: typeof file,
        fileName: file instanceof File ? file.name : file
      }
      
      console.error('[StaticPdfViewer] 详细错误信息:', errorInfo)
      
      // 保存到本地存储用于调试
      try {
        const existingErrors = JSON.parse(localStorage.getItem('pdf-errors') || '[]')
        existingErrors.push(errorInfo)
        localStorage.setItem('pdf-errors', JSON.stringify(existingErrors.slice(-5)))
      } catch (storageError) {
        console.warn('[StaticPdfViewer] 无法保存错误信息到本地存储:', storageError)
      }
    }

    loadPDF()
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [file])

  // 渲染单个页面
  const renderPage = useCallback(async (doc: any, pageNumber: number) => {
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
      const viewport = page.getViewport({ scale, rotation })
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
      
      // 渲染文本层
      const pageContainer = document.querySelector(`[data-page-num="${pageNumber}"]`) as HTMLElement
      if (pageContainer) {
        await renderTextLayer(page, viewport, pageContainer, pageNumber)
      }
      
    } catch (error) {
      console.error(`[StaticPdfViewer] 页面${pageNumber}渲染失败:`, error)
    } finally {
      renderingPages.current.delete(pageNumber)
      console.log(`[StaticPdfViewer] 页面${pageNumber}渲染流程结束`)
    }
  }, [scale, rotation, renderTextLayer])

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

  // 缩放控制函数
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.2, 3.0))
  }, [])

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1.2)
  }, [])

  // 旋转控制
  const rotatePage = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  // 页面导航
  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      jumpToPage(currentPage - 1)
    }
  }, [currentPage, jumpToPage])

  const goToNextPage = useCallback(() => {
    if (currentPage < numPages) {
      jumpToPage(currentPage + 1)
    }
  }, [currentPage, numPages, jumpToPage])

  // 页面跳转输入处理
  const handlePageInput = useCallback((value: string) => {
    const pageNum = parseInt(value)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      jumpToPage(pageNum)
      setPageInput('')
    }
  }, [numPages, jumpToPage])

  // 搜索功能
  const handleSearch = useCallback(async (text: string) => {
    if (!pdfDoc || !text.trim()) {
      setSearchResults([])
      return
    }

    const results = []
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdfDoc.getPage(i)
        const textContent = await page.getTextContent()
        const textItems = textContent.items
        
        for (let j = 0; j < textItems.length; j++) {
          const item = textItems[j] as any
          if (item.str && item.str.toLowerCase().includes(text.toLowerCase())) {
            results.push({
              pageNumber: i,
              text: item.str,
              index: j
            })
          }
        }
      } catch (error) {
        console.error(`搜索页面${i}时出错:`, error)
      }
    }
    
    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)
    
    if (results.length > 0) {
      jumpToPage(results[0].pageNumber)
    }
  }, [pdfDoc, numPages, jumpToPage])

  // 搜索导航
  const goToNextSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length
      setCurrentSearchIndex(nextIndex)
      jumpToPage(searchResults[nextIndex].pageNumber)
    }
  }, [searchResults, currentSearchIndex, jumpToPage])

  const goToPrevSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1
      setCurrentSearchIndex(prevIndex)
      jumpToPage(searchResults[prevIndex].pageNumber)
    }
  }, [searchResults, currentSearchIndex, jumpToPage])

  // 计算浮动面板位置
  const calculateOptimalPosition = useCallback((selectionRect: DOMRect) => {
    const PANEL_WIDTH = 300
    const PANEL_HEIGHT = 120
    const MARGIN = 15
    const OFFSET_FROM_SELECTION = 10
    
    // 水平位置：居中对齐选中区域
    let x = selectionRect.left + (selectionRect.width - PANEL_WIDTH) / 2
    
    // 检查左右边界
    if (x < MARGIN) {
      x = MARGIN
    } else if (x + PANEL_WIDTH > window.innerWidth - MARGIN) {
      x = window.innerWidth - PANEL_WIDTH - MARGIN
    }
    
    // 垂直位置：优先显示在选中区域上方
    let y = selectionRect.top - PANEL_HEIGHT - OFFSET_FROM_SELECTION
    
    // 如果上方空间不够，放在下方
    if (y < MARGIN) {
      y = selectionRect.bottom + OFFSET_FROM_SELECTION
    }
    
    // 确保不超出下边界
    if (y + PANEL_HEIGHT > window.innerHeight - MARGIN) {
      y = selectionRect.top - PANEL_HEIGHT / 2
      if (y < MARGIN) y = MARGIN
    }
    
    return { x, y }
  }, [])

  // 处理文本选择
  useEffect(() => {
    let selectionTimeout: NodeJS.Timeout | null = null
    
    const handleSelectionChange = () => {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout)
      }
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection()
        
        if (!selection || selection.isCollapsed) {
          setShowTextActions(false)
          setSelectedText('')
          return
        }
        
        const selectedText = selection.toString().trim()
        if (!selectedText || selectedText.length < 1) {
          return
        }
        
        // 检查选择是否在PDF文本层内
        try {
          const range = selection.getRangeAt(0)
          const startElement = range.startContainer.nodeType === Node.TEXT_NODE 
            ? range.startContainer.parentElement 
            : range.startContainer as Element
            
          const textLayer = startElement?.closest('.textLayer')
          if (!textLayer) {
            return
          }
          
          setSelectedText(selectedText)
          
          // 获取选择范围的位置并显示操作面板
          const rect = range.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            const position = calculateOptimalPosition(rect)
            setTextActionsPosition(position)
            setShowTextActions(true)
          }
        } catch (error) {
          console.warn('处理选择时出错:', error)
        }
      }, 300)
    }
    
    document.addEventListener('selectionchange', handleSelectionChange)
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      if (selectionTimeout) {
        clearTimeout(selectionTimeout)
      }
    }
  }, [calculateOptimalPosition])

  // 处理点击外部区域
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (showTextActions && !target.closest('.text-actions-panel')) {
        const isTextLayerClick = target.closest('.textLayer')
        const currentSelection = window.getSelection()
        const hasActiveSelection = currentSelection && !currentSelection.isCollapsed
        
        if (!hasActiveSelection || !isTextLayerClick) {
          setTimeout(() => {
            setShowTextActions(false)
            setSelectedText('')
            if (currentSelection) {
              currentSelection.removeAllRanges()
            }
          }, 50)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showTextActions])

  // 处理文本操作
  const handleTextAction = useCallback((action: 'explain' | 'summarize' | 'rewrite') => {
    if (onTextSelect && selectedText) {
      onTextSelect(selectedText, action)
    }
    
    // 清除选择和面板
    setTimeout(() => {
      setShowTextActions(false)
      setSelectedText('')
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
      }
    }, 100)
  }, [onTextSelect, selectedText])

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    jumpToPage,
    getCurrentPage: () => currentPage,
    getOutline: () => outline,
    zoomIn,
    zoomOut,
    resetZoom
  }), [jumpToPage, currentPage, outline, zoomIn, zoomOut, resetZoom])

  // 服务端渲染时显示加载状态
  if (!isClient) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">初始化PDF查看器...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">正在加载PDF...</p>
          <p className="text-sm text-gray-500">
            {loadingTimeout ? '网络较慢，请耐心等待或刷新重试' : '正在初始化PDF查看器'}
          </p>
          {loadingTimeout && (
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                重新加载
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 安全模式渲染
  if (isSafeMode) {
    return (
      <div className={`h-full bg-gray-100 flex flex-col ${className}`}>
        <div className="flex-shrink-0 bg-orange-50 border-b border-orange-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600">🛡️</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-orange-800">安全模式已启用</h3>
              <p className="text-xs text-orange-600">PDF将以兼容性模式显示，功能可能受限</p>
            </div>
            <button
              onClick={() => {
                setIsSafeMode(false)
                setError(null)
                // 尝试重新正常加载
                console.log('[StaticPdfViewer] 退出安全模式，尝试正常加载')
              }}
              className="ml-auto px-3 py-1 text-xs bg-orange-200 text-orange-800 rounded hover:bg-orange-300 transition-colors"
            >
              退出安全模式
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">📄</span>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">PDF安全模式</h3>
            <p className="text-sm text-gray-600 mb-4">
              当前处于安全模式，PDF预览功能暂时不可用。<br/>
              您可以下载文件或尝试在其他浏览器中打开。
            </p>
            
            {typeof file === 'string' && (
              <div className="space-y-2">
                <a
                  href={file}
                  download
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📥 下载PDF文件
                </a>
                <br/>
                <a
                  href={file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  🔗 在新窗口中打开
                </a>
              </div>
            )}
            
            {file instanceof File && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const url = URL.createObjectURL(file)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = file.name
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📥 下载PDF文件
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF加载失败</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          
          {/* 智能建议 */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-left">
            <div className="text-xs font-medium text-blue-800 mb-1">💡 可能的解决方案：</div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 检查网络连接是否正常</li>
              <li>• 尝试刷新页面</li>
              <li>• 启用浏览器硬件加速</li>
              <li>• 使用安全模式查看PDF</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => {
                console.log('[StaticPdfViewer] 用户点击重试加载')
                // 重置所有相关状态
                pdfLoader.reset()
                setError(null)
                setIsLoading(true)
                setLoadingTimeout(false)
                setPdfDoc(null)
                setNumPages(0)
                setCanvases(new Map())
                
                // 不刷新页面，而是重新触发PDF加载
                console.log('[StaticPdfViewer] 状态重置完成，将重新触发PDF加载')
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              🔄 智能重试
            </button>
            <button
              onClick={() => {
                console.log('[StaticPdfViewer] 用户选择安全模式')
                setIsSafeMode(true)
                setError(null)
              }}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              🛡️ 安全模式（推荐）
            </button>
            <button
              onClick={() => {
                console.log('[StaticPdfViewer] 用户选择强制刷新页面')
                window.location.reload()
              }}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              🔧 刷新页面
            </button>
          </div>
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

  const renderStaticPdfContent = () => (
    <div className={`h-full bg-gray-100 flex flex-col ${className}`}>
      {/* PDF工具栏 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* 左侧：页面导航 */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={currentPage.toString()}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePageInput(pageInput)
                  }
                }}
                onBlur={() => {
                  if (pageInput) {
                    handlePageInput(pageInput)
                  }
                }}
                className="w-12 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">/ {numPages}</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 中间：缩放控制 */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetZoom}>
              重置
            </Button>
            <Button variant="outline" size="sm" onClick={rotatePage}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          {/* 右侧：搜索 */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowSearchBar(!showSearchBar)
                if (!showSearchBar) {
                  setTimeout(() => searchInputRef.current?.focus(), 100)
                }
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 搜索栏 */}
        {showSearchBar && (
          <div className="mt-2 flex items-center gap-2">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索文档内容..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchText)
                }
              }}
              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button size="sm" onClick={() => handleSearch(searchText)}>
              搜索
            </Button>
            {searchResults.length > 0 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={goToPrevSearchResult}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs text-gray-600">
                  {currentSearchIndex + 1} / {searchResults.length}
                </span>
                <Button variant="outline" size="sm" onClick={goToNextSearchResult}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowSearchBar(false)
                setSearchText('')
                setSearchResults([])
                setCurrentSearchIndex(-1)
              }}
            >
              关闭
            </Button>
          </div>
        )}
      </div>

      {/* PDF内容区域 */}
      <div className="flex-1 overflow-y-auto">
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
      
      {/* 文本选择操作面板 */}
      {showTextActions && textActionsPosition && (
        <div 
          className="fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-300 text-actions-panel"
          style={{ 
            left: `${textActionsPosition.x}px`, 
            top: `${textActionsPosition.y}px`,
            width: '300px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 选中文本预览 */}
          <div className="p-3 border-b border-gray-100">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <span>📝</span> 选中文本
            </div>
            <div className="text-sm text-gray-700 max-h-12 overflow-y-auto bg-gray-50 rounded px-2 py-1">
              "{selectedText.slice(0, 60)}{selectedText.length > 60 ? '...' : ''}"
            </div>
          </div>
          
          {/* AI操作按钮 */}
          <div className="p-3">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <span>✨</span> AI功能
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                className="px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors border border-blue-200 hover:border-blue-300 font-medium"
                onClick={() => handleTextAction('explain')}
              >
                🔍 解释
              </button>
              <button
                className="px-3 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded transition-colors border border-green-200 hover:border-green-300 font-medium"
                onClick={() => handleTextAction('summarize')}
              >
                📝 总结
              </button>
              <button
                className="px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded transition-colors border border-purple-200 hover:border-purple-300 font-medium"
                onClick={() => handleTextAction('rewrite')}
              >
                ✏️ 改写
              </button>
            </div>
          </div>
          
          {/* 关闭按钮 */}
          <button
            className="absolute top-1 right-1 w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors text-xs"
            onClick={() => {
              setShowTextActions(false)
              setSelectedText('')
              window.getSelection()?.removeAllRanges()
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )

  return (
    <CanvasFallback onCanvasReady={() => console.log('[StaticPdfViewer] Canvas就绪，PDF可以正常渲染')}>
      {renderStaticPdfContent()}
    </CanvasFallback>
  )
})

StaticPdfViewer.displayName = 'StaticPdfViewer'

export default StaticPdfViewer