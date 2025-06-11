"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// 设置 PDF.js worker
if (typeof window !== 'undefined') {
  const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  console.log('设置PDF worker路径:', workerSrc);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}

interface PDFViewerProps {
  file: string | null;
  onPageClick?: (text: string) => void;
}

export default function PDFViewer({ file, onPageClick }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);

  // 加载PDF文件
  useEffect(() => {
    if (!file) return;
    
    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 确保使用完整的URL
        const fullUrl = file.startsWith('http') ? file : 
                      (typeof window !== 'undefined' ? `${window.location.origin}${file}` : file);
        
        console.log('开始加载PDF文件:', fullUrl);
        
        // 添加重试逻辑
        let retries = 3;
        let response;
        
        while (retries > 0) {
          try {
            response = await fetch(fullUrl);
            if (response.ok) break;
            retries--;
            if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            console.error('PDF加载重试失败:', err);
            retries--;
            if (retries === 0) throw err;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!response?.ok) {
          throw new Error(`HTTP错误! 状态: ${response?.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log('PDF文件加载成功，大小:', arrayBuffer.byteLength, '字节');
        setPdfData(arrayBuffer);
      } catch (err) {
        console.error('PDF文件加载错误:', err);
        setError('无法加载PDF文件: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [file]);

  // 处理PDF数据
  useEffect(() => {
    if (!pdfData) return;

    const loadDocument = async () => {
      try {
        console.log('开始加载PDF文档');
        const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;
        console.log('PDF文档加载成功，页数:', doc.numPages);
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setError(null);
      } catch (err) {
        console.error('PDF文档处理错误:', err);
        setError('无法处理PDF文档: ' + (err instanceof Error ? err.message : String(err)));
      }
    };

    loadDocument();
  }, [pdfData]);

  // 渲染页面
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        console.log(`开始渲染第${currentPage}页`);
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        console.log(`第${currentPage}页渲染完成`);
      } catch (err) {
        console.error('页面渲染错误:', err);
        setError('无法渲染页面: ' + (err instanceof Error ? err.message : String(err)));
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prevScale => prevScale + 0.2);
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(0.5, prevScale - 0.2));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-gray-100 p-4 rounded-lg">
      <div className="flex gap-4 mb-4">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          上一页
        </button>
        <span className="px-4 py-2 bg-white rounded">
          第 {currentPage} / {numPages} 页
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage >= numPages}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          下一页
        </button>
        <button
          onClick={handleZoomIn}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          放大
        </button>
        <button
          onClick={handleZoomOut}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          缩小
        </button>
      </div>
      <div className="border border-gray-300 rounded-lg overflow-auto max-w-full">
        <canvas ref={canvasRef} className="block mx-auto" />
      </div>
    </div>
  );
} 