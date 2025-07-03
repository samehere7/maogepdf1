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
  
  // 文本选择相关状态
  const [selectedText, setSelectedText] = useState('')
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null)
  const [isToolbarLoading, setIsToolbarLoading] = useState(false)

  // 处理文本选择
  const handleTextSelection = useCallback(() => {
    try {
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
        window.getSelection()?.removeAllRanges()
      } catch (error) {
        console.warn('[工具栏] 清除选择时出错:', error)
      }
    }
  }, [selectedText, onTextSelect])

  // 添加错误处理，防止模块初始化冲突
  useEffect(() => {
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
    if (!containerRef.current) return

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
          window.getSelection()?.removeAllRanges()
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
          const viewport = page.getViewport({ scale: 1.2 })
          
          // 创建页面容器
          const pageContainer = document.createElement('div')
          pageContainer.className = 'pdf-page-container'
          pageContainer.style.position = 'relative'
          pageContainer.style.margin = '10px auto'
          pageContainer.style.display = 'block'
          pageContainer.style.width = `${viewport.width}px`
          pageContainer.style.height = `${viewport.height}px`
          pageContainer.style.border = '1px solid #ddd'
          pageContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
          pageContainer.style.borderRadius = '4px'
          pageContainer.style.overflow = 'hidden'
          pageContainer.style.backgroundColor = 'white'
          
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

    loadPDF()
  }, [file])

  return (
    <div className="w-full h-full overflow-auto bg-gray-100 relative">
      <div ref={containerRef} className="text-center p-4">
        <div>正在加载PDF...</div>
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