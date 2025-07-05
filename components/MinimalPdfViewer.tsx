"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { getPDFJS } from '@/lib/pdf-manager'
import TextSelectionToolbar from './text-selection-toolbar'
import './pdf-text-selection.css'

interface MinimalPdfViewerProps {
  file: File | string | null
  onTextSelect?: (text: string, action: 'explain' | 'summarize' | 'rewrite') => void
}

export default function MinimalPdfViewer({ file, onTextSelect }: MinimalPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1.2)
  const [numPages, setNumPages] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const pdfDocRef = useRef<any>(null)
  const [needsRerender, setNeedsRerender] = useState(false)
  
  // 文本选择相关状态
  const [selectedText, setSelectedText] = useState('')
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null)
  const [isToolbarLoading, setIsToolbarLoading] = useState(false)

  // 处理文本选择
  const handleTextSelection = useCallback(() => {
    try {
      // 确保在客户端环境中运行
      if (typeof window === 'undefined') return
      
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        setToolbarPosition(null)
        setSelectedText('')
        return
      }

      const range = selection.getRangeAt(0)
      const selectedText = range.toString().trim()

      // 检查文本长度和内容质量
      if (selectedText.length < 3 || selectedText.length > 2000) {
        setToolbarPosition(null)
        setSelectedText('')
        return
      }

      // 检查是否在PDF容器内选择
      const container = containerRef.current
      if (!container) return

      const rect = range.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      
      // 验证选择区域是否有效
      if (!rect || rect.width === 0 || rect.height === 0) {
        setToolbarPosition(null)
        setSelectedText('')
        return
      }

      // 确保选择在容器内
      if (rect.left < containerRect.left || 
          rect.right > containerRect.right || 
          rect.top < containerRect.top || 
          rect.bottom > containerRect.bottom) {
        // 选择可能超出容器边界，但仍然可以处理
      }
      
      // 计算工具栏位置，确保不超出视窗
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
      
      let x = rect.left + rect.width / 2 - containerRect.left
      let y = rect.top - containerRect.top - 70
      
      // 边界检查
      x = Math.max(10, Math.min(x - 100, viewportWidth - 220))
      y = Math.max(10, y)
      
      // 如果工具栏会被遮挡，调整到选择区域下方
      if (y < 80) {
        y = rect.bottom - containerRect.top + 10
      }
      
      setSelectedText(selectedText)
      setToolbarPosition({ x, y })
      
      console.log('[文本选择] 选中文本:', selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''))
      
    } catch (error) {
      console.error('[文本选择] 处理选择事件时出错:', error)
      setToolbarPosition(null)
      setSelectedText('')
    }
  }, [])

  // 处理工具栏按钮点击
  const handleToolbarAction = useCallback(async (action: 'explain' | 'summarize' | 'rewrite') => {
    if (!selectedText || !onTextSelect) {
      console.warn('[工具栏] 无效的操作条件:', { selectedText: !!selectedText, onTextSelect: !!onTextSelect })
      return
    }
    
    setIsToolbarLoading(true)
    console.log(`[工具栏] 开始处理文本 (${action}):`, selectedText.substring(0, 50) + '...')
    
    try {
      await onTextSelect(selectedText, action)
      console.log(`[工具栏] ${action} 操作完成`)
    } catch (error) {
      console.error(`[工具栏] ${action} 操作失败:`, error)
      // 即使出错也要清理状态
    } finally {
      setIsToolbarLoading(false)
      setToolbarPosition(null)
      setSelectedText('')
      // 清除选择
      try {
        if (typeof window !== 'undefined') {
          window.getSelection()?.removeAllRanges()
        }
      } catch (error) {
        console.warn('[工具栏] 清除选择时出错:', error)
      }
    }
  }, [selectedText, onTextSelect])

  // 缩放控制函数
  const handleZoomIn = useCallback(() => {
    setScale(prevScale => {
      const newScale = Math.min(prevScale + 0.2, 3.0)
      console.log('[PDF缩放] 放大到:', newScale)
      setNeedsRerender(true)
      return newScale
    })
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale(prevScale => {
      const newScale = Math.max(prevScale - 0.2, 0.5)
      console.log('[PDF缩放] 缩小到:', newScale)
      setNeedsRerender(true)
      return newScale
    })
  }, [])

  const handleResetZoom = useCallback(() => {
    console.log('[PDF缩放] 重置缩放到 1.0')
    setScale(1.0)
    setNeedsRerender(true)
  }, [])

  // 添加错误处理，防止模块初始化冲突
  useEffect(() => {
    // 确保在客户端环境中运行
    if (typeof window === 'undefined') return
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('ee') || event.reason?.message?.includes('initialization')) {
        console.warn('[MinimalPdfViewer] 检测到PDF.js模块初始化冲突，将忽略此错误')
        event.preventDefault()
      }
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [])

  // 添加文本选择事件监听
  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return

    const container = containerRef.current
    
    const handleSelectionChange = () => {
      try {
        setTimeout(handleTextSelection, 10) // 小延迟确保选择完成
      } catch (error) {
        console.error('[事件监听] 选择变化处理出错:', error)
      }
    }

    const handleMouseUp = (event: MouseEvent) => {
      try {
        // 只在PDF容器内的鼠标抬起时处理
        if (container.contains(event.target as Node)) {
          setTimeout(handleTextSelection, 10)
        }
      } catch (error) {
        console.error('[事件监听] 鼠标抬起处理出错:', error)
      }
    }

    const handleClickOutside = (event: Event) => {
      try {
        const target = event.target as Node
        if (!container.contains(target)) {
          setToolbarPosition(null)
          setSelectedText('')
        }
      } catch (error) {
        console.error('[事件监听] 点击外部处理出错:', error)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      try {
        // ESC键隐藏工具栏
        if (event.key === 'Escape') {
          setToolbarPosition(null)
          setSelectedText('')
          if (typeof window !== 'undefined') {
            window.getSelection()?.removeAllRanges()
          }
        }
      } catch (error) {
        console.error('[事件监听] 键盘事件处理出错:', error)
      }
    }

    // 添加事件监听器
    document.addEventListener('selectionchange', handleSelectionChange)
    container.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    console.log('[事件监听] 文本选择事件监听器已注册')

    return () => {
      try {
        document.removeEventListener('selectionchange', handleSelectionChange)
        container.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
        console.log('[事件监听] 文本选择事件监听器已清理')
      } catch (error) {
        console.error('[事件监听] 清理事件监听器时出错:', error)
      }
    }
  }, [handleTextSelection])

  // 添加键盘快捷键支持
  useEffect(() => {
    // 确保在客户端环境中运行
    if (typeof window === 'undefined') return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否在输入框中
      const activeElement = document.activeElement
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return
      }
      
      // Ctrl/Cmd + 缩放快捷键
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '=':
          case '+':
            event.preventDefault()
            handleZoomIn()
            break
          case '-':
            event.preventDefault()
            handleZoomOut()
            break
          case '0':
            event.preventDefault()
            handleResetZoom()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleZoomIn, handleZoomOut, handleResetZoom])

  useEffect(() => {
    if (!file || !containerRef.current) return

    const loadPDF = async () => {
      try {
        console.log('[MinimalPdfViewer] 开始加载PDF.js...')
        
        // 使用统一的PDF.js管理器
        const pdfjs = await getPDFJS()
        console.log('[MinimalPdfViewer] PDF.js获取成功，版本:', pdfjs.version)
        
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
        
        // 清空容器
        containerRef.current!.innerHTML = ''
        
        // 渲染所有页面
        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          const page = await doc.getPage(pageNum)
          const viewport = page.getViewport({ scale })
          
          // 创建页面容器
          const pageContainer = document.createElement('div')
          pageContainer.className = 'pdf-page-container'
          pageContainer.style.position = 'relative'
          pageContainer.style.margin = '20px auto'
          pageContainer.style.display = 'block'
          pageContainer.style.width = `${viewport.width}px`
          pageContainer.style.height = `${viewport.height}px`
          pageContainer.style.maxWidth = '100%'
          pageContainer.style.border = '1px solid #e5e7eb'
          pageContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
          pageContainer.style.borderRadius = '8px'
          pageContainer.style.overflow = 'hidden'
          pageContainer.style.backgroundColor = 'white'
          pageContainer.style.transition = 'all 0.2s ease-in-out'
          
          // 创建canvas
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          
          if (!context) {
            console.error('[MinimalPdfViewer] 无法获取Canvas 2D上下文')
            continue
          }
          
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.display = 'block'
          canvas.style.position = 'absolute'
          canvas.style.top = '0'
          canvas.style.left = '0'
          
          // 渲染页面到canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise
          
          // 创建文本层
          const textLayerDiv = document.createElement('div')
          textLayerDiv.className = 'textLayer'
          textLayerDiv.style.position = 'absolute'
          textLayerDiv.style.top = '0'
          textLayerDiv.style.left = '0'
          textLayerDiv.style.width = `${viewport.width}px`
          textLayerDiv.style.height = `${viewport.height}px`
          textLayerDiv.style.overflow = 'hidden'
          textLayerDiv.style.opacity = '0'
          textLayerDiv.style.lineHeight = '1.0'
          textLayerDiv.style.fontSize = '1px'
          textLayerDiv.style.pointerEvents = 'auto'
          textLayerDiv.style.mixBlendMode = 'multiply'
          
          // 获取文本内容并渲染文本层
          try {
            const textContent = await page.getTextContent()
            
            // 创建优化的文本层
            let textHtml = ''
            textContent.items.forEach((item: any) => {
              if (item.str && item.str.trim()) {
                const transform = item.transform
                const x = transform[4]
                const y = viewport.height - transform[5] - item.height
                const width = item.width
                const height = item.height
                
                // 转义HTML特殊字符
                const escapedText = item.str
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;')
                
                textHtml += `<span style="position: absolute; left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; font-size: ${Math.max(height * 0.8, 8)}px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: transparent; line-height: 1; white-space: nowrap; user-select: text; cursor: text; border: none; background: transparent;">${escapedText}</span>`
              }
            })
            
            textLayerDiv.innerHTML = textHtml
          } catch (error) {
            console.warn(`[MinimalPdfViewer] 页面${pageNum}文本层创建失败:`, error)
          }
          
          // 组装页面
          pageContainer.appendChild(canvas)
          pageContainer.appendChild(textLayerDiv)
          containerRef.current!.appendChild(pageContainer)
          
          console.log(`[MinimalPdfViewer] 页面${pageNum}渲染完成（包含文本层）`)
        }
        
        console.log('[MinimalPdfViewer] 所有页面渲染完成')
        
        // 保存文档引用和设置页面数量
        setNumPages(doc.numPages)
        pdfDocRef.current = doc
        setIsLoading(false)
        
      } catch (error) {
        console.error('[MinimalPdfViewer] 加载失败:', error)
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="text-align: center; padding: 20px; color: red;">
              <h3>PDF加载失败</h3>
              <p>${error instanceof Error ? error.message : String(error)}</p>
            </div>
          `
        }
      }
    }

    setIsLoading(true)
    loadPDF()
  }, [file])

  // 监听缩放变化，重新渲染PDF
  useEffect(() => {
    if (needsRerender && pdfDocRef.current && containerRef.current) {
      const rerenderPDF = async () => {
        try {
          console.log('[PDF重新渲染] 开始重新渲染，新缩放比例:', scale)
          const doc = pdfDocRef.current
          
          // 清空容器
          containerRef.current!.innerHTML = ''
          
          // 重新渲染所有页面
          for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
            const page = await doc.getPage(pageNum)
            const viewport = page.getViewport({ scale })
            
            // 创建页面容器
            const pageContainer = document.createElement('div')
            pageContainer.className = 'pdf-page-container'
            pageContainer.style.position = 'relative'
            pageContainer.style.margin = '20px auto'
            pageContainer.style.display = 'block'
            pageContainer.style.width = `${viewport.width}px`
            pageContainer.style.height = `${viewport.height}px`
            pageContainer.style.maxWidth = '100%'
            pageContainer.style.border = '1px solid #e5e7eb'
            pageContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            pageContainer.style.borderRadius = '8px'
            pageContainer.style.overflow = 'hidden'
            pageContainer.style.backgroundColor = 'white'
            pageContainer.style.transition = 'all 0.2s ease-in-out'
            
            // 创建canvas
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            
            if (!context) {
              console.error('[PDF重新渲染] 无法获取Canvas 2D上下文')
              continue
            }
            
            canvas.width = viewport.width
            canvas.height = viewport.height
            canvas.style.display = 'block'
            canvas.style.position = 'absolute'
            canvas.style.top = '0'
            canvas.style.left = '0'
            
            // 渲染页面到canvas
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise
            
            // 创建文本层
            const textLayerDiv = document.createElement('div')
            textLayerDiv.className = 'textLayer'
            textLayerDiv.style.position = 'absolute'
            textLayerDiv.style.top = '0'
            textLayerDiv.style.left = '0'
            textLayerDiv.style.width = `${viewport.width}px`
            textLayerDiv.style.height = `${viewport.height}px`
            textLayerDiv.style.overflow = 'hidden'
            textLayerDiv.style.opacity = '0'
            textLayerDiv.style.lineHeight = '1.0'
            textLayerDiv.style.fontSize = '1px'
            textLayerDiv.style.pointerEvents = 'auto'
            textLayerDiv.style.mixBlendMode = 'multiply'
            
            // 获取文本内容并渲染文本层
            try {
              const textContent = await page.getTextContent()
              
              // 创建优化的文本层
              let textHtml = ''
              textContent.items.forEach((item: any) => {
                if (item.str && item.str.trim()) {
                  const transform = item.transform
                  const x = transform[4]
                  const y = viewport.height - transform[5] - item.height
                  const width = item.width
                  const height = item.height
                  
                  // 转义HTML特殊字符
                  const escapedText = item.str
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                  
                  textHtml += `<span style="position: absolute; left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; font-size: ${Math.max(height * 0.8, 8)}px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: transparent; line-height: 1; white-space: nowrap; user-select: text; cursor: text; border: none; background: transparent;">${escapedText}</span>`
                }
              })
              
              textLayerDiv.innerHTML = textHtml
            } catch (error) {
              console.warn(`[PDF重新渲染] 页面${pageNum}文本层创建失败:`, error)
            }
            
            // 组装页面
            pageContainer.appendChild(canvas)
            pageContainer.appendChild(textLayerDiv)
            containerRef.current!.appendChild(pageContainer)
          }
          
          console.log('[PDF重新渲染] 重新渲染完成')
          setNeedsRerender(false)
          
        } catch (error) {
          console.error('[PDF重新渲染] 重新渲染失败:', error)
          setNeedsRerender(false)
        }
      }
      
      rerenderPDF()
    }
  }, [scale, needsRerender])

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 relative">
      {/* 缩放控制工具栏 */}
      <div className="flex-shrink-0 zoom-toolbar px-4 py-2 flex items-center justify-center gap-2">
        <button
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="缩小 (Ctrl+-)"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        
        <span 
          className="px-3 py-1 bg-gray-50 rounded-md text-sm font-medium min-w-[80px] text-center cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={handleResetZoom}
          title="点击重置为100% (Ctrl+0)"
        >
          {Math.round(scale * 100)}%
        </span>
        
        <button
          onClick={handleResetZoom}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          title="重置为100% (Ctrl+0)"
        >
          1:1
        </button>
        
        <button
          onClick={handleZoomIn}
          disabled={scale >= 3.0}
          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="放大 (Ctrl++)"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        
        {numPages > 0 && (
          <div className="ml-4 text-sm text-gray-600">
            共 {numPages} 页
          </div>
        )}
      </div>

      {/* PDF显示区域 */}
      <div className="flex-1 overflow-auto pdf-viewer-container">
        <div ref={containerRef} className="text-center p-4 min-h-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-2">正在加载PDF...</p>
                <p className="text-gray-400 text-sm">请稍候，正在解析文档内容</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* 文本选择工具栏 */}
      {toolbarPosition && selectedText && (
        <TextSelectionToolbar
          position={toolbarPosition}
          onExplain={() => handleToolbarAction('explain')}
          onRewrite={() => handleToolbarAction('rewrite')}
          onSummarize={() => handleToolbarAction('summarize')}
          isLoading={isToolbarLoading}
        />
      )}
    </div>
  )
}