"use client"

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// 最简化的PDF测试页面
export default function PDFTestPage() {
  const [pdfjs, setPdfjs] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<boolean>(false)

  useEffect(() => {
    const testPDF = async () => {
      try {
        console.log('开始加载PDF.js...')
        
        // 动态导入PDF.js
        const pdfjsLib = await import('pdfjs-dist')
        console.log('PDF.js加载成功，版本:', pdfjsLib.version)
        
        // 设置Worker
        const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
        console.log('Worker设置完成:', workerSrc)
        
        setPdfjs(pdfjsLib)
        
        // 测试Canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Canvas 2D上下文获取失败')
        }
        console.log('Canvas测试通过')
        
        // 创建最简单的PDF
        const testPdfBase64 = "JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCgoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDQgMCBSCj4+Cj4+Ci9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNSAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzIgNzIwIFRkCihIZWxsbyBXb3JsZCEpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDc0IDAwMDAwIG4gCjAwMDAwMDAxMjAgMDAwMDBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ3MwolJUVPRgo="
        
        const binaryString = atob(testPdfBase64)
        const arrayBuffer = new ArrayBuffer(binaryString.length)
        const uint8Array = new Uint8Array(arrayBuffer)
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i)
        }
        
        console.log('测试PDF创建完成，大小:', arrayBuffer.byteLength)
        
        // 使用PDF.js解析
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        console.log('PDF文档解析成功，页数:', doc.numPages)
        
        // 渲染第一页
        const page = await doc.getPage(1)
        const viewport = page.getViewport({ scale: 1.0 })
        console.log('视口创建成功:', viewport.width, 'x', viewport.height)
        
        // 渲染到Canvas
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise
        
        console.log('PDF渲染成功！')
        
        // 将Canvas添加到页面
        const container = document.getElementById('pdf-container')
        if (container) {
          container.innerHTML = ''
          container.appendChild(canvas)
        }
        
        setSuccess(true)
        
      } catch (err) {
        console.error('PDF测试失败:', err)
        setError(err instanceof Error ? err.message : String(err))
      }
    }
    
    testPDF()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">PDF功能测试</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">测试状态</h2>
          {error ? (
            <div className="text-red-600 bg-red-50 p-4 rounded">
              <strong>错误：</strong> {error}
            </div>
          ) : success ? (
            <div className="text-green-600 bg-green-50 p-4 rounded">
              <strong>成功！</strong> PDF.js功能正常工作
            </div>
          ) : (
            <div className="text-blue-600 bg-blue-50 p-4 rounded">
              <strong>测试中...</strong> 正在检测PDF.js功能
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">PDF渲染结果</h2>
          <div 
            id="pdf-container" 
            className="border-2 border-dashed border-gray-300 p-4 min-h-[400px] flex items-center justify-center"
          >
            {!success && !error && (
              <div className="text-gray-500">等待PDF渲染...</div>
            )}
            {error && (
              <div className="text-red-500">渲染失败</div>
            )}
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-600">
          <p>这个页面用于测试最基础的PDF.js功能。如果这里能正常显示PDF，说明问题在于组件包装层。</p>
        </div>
      </div>
    </div>
  )
}