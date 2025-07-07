'use client'

import { useState, useEffect, useRef } from 'react'

export default function EmergencyPDFPage() {
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 最简化的PDF.js加载
  useEffect(() => {
    const loadPDFJS = async () => {
      try {
        console.log('🔄 开始加载PDF.js...')
        const pdfjs = await import('pdfjs-dist')
        
        // 简单的worker配置
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
        console.log('✅ PDF.js加载成功，版本:', pdfjs.version)
        console.log('🔧 Worker源:', pdfjs.GlobalWorkerOptions.workerSrc)
        
        return pdfjs
      } catch (error) {
        console.error('❌ PDF.js加载失败:', error)
        setError(`PDF.js加载失败: ${error}`)
        throw error
      }
    }

    loadPDFJS()
  }, [])

  // 加载PDF文件
  const loadPDF = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 开始加载PDF文件...')

      const pdfjs = await import('pdfjs-dist')
      
      // 确保worker配置
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
      }

      const response = await fetch('/sample.pdf')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      console.log('📄 PDF文件下载成功，大小:', arrayBuffer.byteLength, 'bytes')

      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
      console.log('✅ PDF文档加载成功，页数:', doc.numPages)

      setPdfDoc(doc)
      setNumPages(doc.numPages)
      setCurrentPage(1)

    } catch (error) {
      console.error('❌ PDF加载失败:', error)
      setError(`PDF加载失败: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 渲染页面
  const renderPage = async (pageNumber: number) => {
    if (!pdfDoc || !canvasRef.current) return

    try {
      console.log(`🎨 渲染页面 ${pageNumber}，缩放 ${scale}x`)
      
      const page = await pdfDoc.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!context) {
        throw new Error('无法获取Canvas 2D上下文')
      }

      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`

      // 清空canvas
      context.clearRect(0, 0, canvas.width, canvas.height)

      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport
      })

      await renderTask.promise
      console.log(`✅ 页面 ${pageNumber} 渲染完成`)
      
    } catch (error) {
      console.error(`❌ 页面 ${pageNumber} 渲染失败:`, error)
      setError(`页面渲染失败: ${error}`)
    }
  }

  // 当文档或页面变化时重新渲染
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage)
    }
  }, [pdfDoc, currentPage, scale])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🚑 应急PDF查看器</h1>
        <p className="text-gray-600 mb-6">
          超级简化版PDF查看器，用于紧急测试基础功能
        </p>

        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 items-center flex-wrap">
            <button
              onClick={loadPDF}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔄 加载中...' : '📁 加载示例PDF'}
            </button>

            {pdfDoc && (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    ◀
                  </button>
                  <span className="px-3 py-1 bg-gray-100 rounded">
                    {currentPage} / {numPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                    disabled={currentPage >= numPages}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    ▶
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScale(Math.max(0.25, scale - 0.25))}
                    className="px-3 py-1 bg-gray-200 rounded"
                  >
                    🔍-
                  </button>
                  <span className="px-3 py-1 bg-gray-100 rounded">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={() => setScale(Math.min(3.0, scale + 0.25))}
                    className="px-3 py-1 bg-gray-200 rounded"
                  >
                    🔍+
                  </button>
                </div>

                <button
                  onClick={() => setScale(1.0)}
                  className="px-3 py-1 bg-gray-200 rounded"
                >
                  重置缩放
                </button>
              </>
            )}
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-red-800 mb-2">❌ 错误</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* PDF显示区域 */}
        <div className="bg-white rounded-lg shadow p-4">
          {!pdfDoc && !loading && !error && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📄</div>
              <p>点击"加载示例PDF"开始测试</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载PDF...</p>
            </div>
          )}

          {pdfDoc && (
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="border border-gray-300 shadow-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          )}
        </div>

        {/* 状态信息 */}
        <div className="bg-gray-100 rounded-lg p-4 mt-6 text-sm text-gray-600">
          <h3 className="font-bold mb-2">📊 状态信息</h3>
          <div className="space-y-1">
            <div>PDF文档: {pdfDoc ? '✅ 已加载' : '❌ 未加载'}</div>
            <div>当前页面: {currentPage} / {numPages}</div>
            <div>缩放级别: {Math.round(scale * 100)}%</div>
            <div>Canvas状态: {canvasRef.current ? '✅ 就绪' : '❌ 未就绪'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}