"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// 设置 PDF.js worker 路径
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

interface PDFViewerProps {
  file: string | null;
  onPageClick?: (text: string) => void;
}

export default function PDFViewer({ file }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // 加载PDF文档
  useEffect(() => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    const loadPDF = async () => {
      try {
        // 加载文档
        const loadingTask = pdfjsLib.getDocument(file);
        const pdf = await loadingTask.promise;
        setNumPages(pdf.numPages);
        
        // 预渲染所有页面
        canvasRefs.current = new Array(pdf.numPages).fill(null);
        
        // 渲染每一页
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          
          // 创建canvas元素
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            // 关键：让canvas宽度自适应父容器，最大不超过原始宽度
            canvas.style.width = '100%';
            canvas.style.maxWidth = viewport.width + 'px';
            canvas.style.height = 'auto';
            canvas.className = 'shadow-lg';
            
            // 渲染PDF页面到canvas
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
            
            // 将canvas添加到容器
            if (containerRef.current) {
              const pageContainer = document.createElement('div');
              pageContainer.className = 'w-full flex justify-center';
              pageContainer.style.marginBottom = '16px';
              pageContainer.style.padding = '0';
              pageContainer.appendChild(canvas);
              containerRef.current.appendChild(pageContainer);
            }
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('PDF加载错误:', err);
        setError('无法加载PDF文件');
        setIsLoading(false);
      }
    };
    
    loadPDF();
    
    // 清理函数
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [file]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <p className="text-gray-500">未指定PDF文件</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container h-full w-full bg-gray-100 overflow-y-auto flex flex-col" style={{minHeight:'0', minWidth:'0'}}>
      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
            <p className="text-slate-600">加载PDF中...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-500">
            <p>{error}</p>
          </div>
        </div>
      )}

      <div 
        ref={containerRef} 
        className="pdf-pages-container flex-1 min-h-0 w-full overflow-y-auto p-2"
        style={{display:'flex', flexDirection:'column', alignItems:'flex-start', minHeight:'0', minWidth:'0'}}
      ></div>
    </div>
  );
} 