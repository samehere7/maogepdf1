"use client"

import { useState } from 'react'

export default function PdfMinimalPage() {
  const [error, setError] = useState<string | null>(null)

  const testPdfjs = async () => {
    try {
      setError(null)
      console.log('开始测试PDF.js...')
      
      // 动态导入PDF.js
      const pdfjs = await import('pdfjs-dist')
      console.log('PDF.js版本:', pdfjs.version)
      
      // 简单设置Worker
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
      
      console.log('PDF.js加载成功!')
      setError('✅ PDF.js加载成功，版本: ' + pdfjs.version)
      
    } catch (err) {
      console.error('PDF.js测试失败:', err)
      setError('❌ 错误: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>PDF.js 最小测试</h1>
      
      <button 
        onClick={testPdfjs}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007cba',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        测试 PDF.js 加载
      </button>
      
      {error && (
        <div style={{
          padding: '10px',
          borderRadius: '4px',
          backgroundColor: error.startsWith('✅') ? '#d4edda' : '#f8d7da',
          border: error.startsWith('✅') ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}
      
      <div style={{ fontSize: '14px', color: '#666' }}>
        <p>这是一个极简的PDF.js测试页面，用于验证PDF.js是否能正常加载。</p>
        <p>如果这个页面都无法正常显示，说明问题出在更基础的层面。</p>
      </div>
    </div>
  )
}