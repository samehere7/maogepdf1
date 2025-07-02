"use client"

import React, { useEffect, useRef } from 'react'

interface MinimalPdfViewerProps {
  file: File | string | null
}

export default function MinimalPdfViewer({ file }: MinimalPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!file || !containerRef.current) return

    const loadPDF = async () => {
      try {
        console.log('[MinimalPdfViewer] 开始加载PDF.js...')
        
        // 动态导入PDF.js
        const pdfjs = await import('pdfjs-dist')
        console.log('[MinimalPdfViewer] PDF.js版本:', pdfjs.version)
        
        // 设置Worker - 使用CDN
        const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
        console.log('[MinimalPdfViewer] Worker设置:', workerSrc)
        
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
          canvas.style.margin = '10px auto'
          canvas.style.border = '1px solid #ccc'
          
          // 渲染页面到canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise
          
          // 添加到容器
          containerRef.current!.appendChild(canvas)
          
          console.log(`[MinimalPdfViewer] 页面${pageNum}渲染完成`)
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
    <div className="w-full h-full overflow-auto bg-gray-100">
      <div ref={containerRef} className="text-center p-4">
        <div>正在加载PDF...</div>
      </div>
    </div>
  )
}