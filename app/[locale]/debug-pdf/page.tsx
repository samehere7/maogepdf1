"use client"

import React, { useState, useRef } from 'react'
import PdfViewer, { PdfViewerRef } from '@/components/PdfViewer'

export default function DebugPDFPage() {
  const [renderCount, setRenderCount] = useState(0)
  const pdfViewerRef = useRef<PdfViewerRef>(null)
  
  // 计数每次重渲染
  React.useEffect(() => {
    setRenderCount(prev => prev + 1)
    console.log('[Debug] 组件重渲染次数:', renderCount + 1)
  })

  return (
    <div className="h-screen flex flex-col">
      {/* 调试信息 */}
      <div className="bg-red-100 p-4 border-b">
        <h1 className="text-lg font-bold text-red-800">PDF调试页面</h1>
        <p className="text-red-600">重渲染次数: {renderCount}</p>
        <p className="text-sm text-gray-600">如果这个数字持续增加，说明存在无限重渲染问题</p>
      </div>

      {/* 简化的PDF查看器 */}
      <div className="flex-1 bg-gray-100">
        <PdfViewer 
          ref={pdfViewerRef}
          file="/sample.pdf"
          className="debug-pdf-viewer"
        />
      </div>
    </div>
  )
}