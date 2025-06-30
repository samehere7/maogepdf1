"use client"

import React, { useState, useRef } from 'react'
import StaticPdfViewer, { StaticPdfViewerRef } from '@/components/StaticPdfViewer'

export default function TestPDFPage() {
  const [renderCount, setRenderCount] = useState(0)
  const pdfViewerRef = useRef<StaticPdfViewerRef>(null)
  
  // 计数每次重渲染
  React.useEffect(() => {
    setRenderCount(prev => prev + 1)
    console.log('[TestPDF] 组件重渲染次数:', renderCount + 1)
  })

  return (
    <div className="h-screen flex flex-col">
      {/* 调试信息 */}
      <div className="bg-blue-100 p-4 border-b">
        <h1 className="text-lg font-bold text-blue-800">PDF测试页面</h1>
        <p className="text-blue-600">重渲染次数: {renderCount}</p>
        <p className="text-sm text-gray-600">测试StaticPdfViewer组件是否能正常加载PDF</p>
      </div>

      {/* 简化的PDF查看器 */}
      <div className="flex-1 bg-gray-100">
        <div className="p-4">
          <p className="mb-4 text-sm text-gray-600">
            测试文件：/sample.pdf | 
            <a href="/sample.pdf" target="_blank" className="text-blue-600 hover:underline ml-2">
              直接访问PDF文件
            </a>
          </p>
        </div>
        <StaticPdfViewer 
          ref={pdfViewerRef}
          file="/sample.pdf"
          className="test-pdf-viewer"
        />
      </div>
    </div>
  )
}