"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import TextSelectionToolbar from './text-selection-toolbar';
import AIResultDialog from './ai-result-dialog';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [fitToWidth, setFitToWidth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState('1');
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [pageHeights, setPageHeights] = useState<{[key: number]: number}>({});
  const [initialLoad, setInitialLoad] = useState(true);
  const renderInProgress = useRef(false);

  // 文本选择相关状态
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    content: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    content: null,
    isLoading: false
  });

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
        
        // 直接加载PDF文档
        try {
          console.log('开始加载PDF文档');
          const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          console.log('PDF文档加载成功，页数:', doc.numPages);
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setPageInput('1');
          setVisiblePages(new Set([1]));
          setRenderedPages(new Set());
          setError(null);
          setInitialLoad(true);
        } catch (err) {
          console.error('PDF文档处理错误:', err);
          setError('无法处理PDF文档: ' + (err instanceof Error ? err.message : String(err)));
        }
      } catch (err) {
        console.error('PDF文件加载错误:', err);
        setError('无法加载PDF文件: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [file]);

  // 创建页面占位符
  useEffect(() => {
    if (!pdfDoc || !containerRef.current || !initialLoad) return;
    
    const setupPagePlaceholders = async () => {
      const container = containerRef.current;
      if (!container) return;
      
      // 清空容器
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      // 创建页面占位符
      const newPageHeights: {[key: number]: number} = {};
      
      // 获取第一页的尺寸作为参考
      try {
        const firstPage = await pdfDoc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.0 });
        const aspectRatio = viewport.height / viewport.width;
        
        // 根据容器宽度计算页面高度
        const containerWidth = container.clientWidth - 40; // 减去内边距
        const estimatedHeight = containerWidth * aspectRatio;
        
        // 计算适合的缩放比例
        if (fitToWidth) {
          const optimalScale = containerWidth / viewport.width;
          setScale(Math.min(optimalScale, 2.0)); // 最大缩放2倍
        }
        
        // 创建所有页面的占位符
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const pageContainer = document.createElement('div');
          pageContainer.className = 'pdf-page mb-6 flex justify-center';
          pageContainer.setAttribute('data-page-num', pageNum.toString());
          pageContainer.style.minHeight = `${estimatedHeight}px`;
          
          // 添加自定义样式
          const style = document.createElement('style');
          style.textContent = `
            ::selection {
              background: rgba(0, 123, 255, 0.3) !important;
              color: inherit !important;
            }
            ::-moz-selection {
              background: rgba(0, 123, 255, 0.3) !important;
              color: inherit !important;
            }
            .pdf-page canvas {
              user-select: text !important;
              -webkit-user-select: text !important;
            }
            .pdf-page canvas::selection {
              background: rgba(0, 123, 255, 0.3) !important;
              color: inherit !important;
            }
          `;
          document.head.appendChild(style);
          
          // 存储估计的页面高度
          newPageHeights[pageNum] = estimatedHeight;
          
          container.appendChild(pageContainer);
        }
        
        setPageHeights(newPageHeights);
        setInitialLoad(false);
        
        // 触发滚动事件以检测初始可见页面
        setTimeout(() => {
          if (container) {
            const event = new Event('scroll');
            container.dispatchEvent(event);
          }
        }, 100);
      } catch (err) {
        console.error('设置页面占位符失败:', err);
      }
    };
    
    setupPagePlaceholders();
  }, [pdfDoc, numPages, initialLoad]);

  // 监听滚动事件，检测可见页面
  useEffect(() => {
    if (!containerRef.current || !pdfDoc) return;
    
    const handleScroll = () => {
      if (!containerRef.current || renderInProgress.current) return;
      
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const pageElements = container.querySelectorAll('.pdf-page');
      
      const newVisiblePages = new Set<number>();
      let closestPage = currentPage;
      let minDistance = Infinity;
      
      pageElements.forEach((pageEl) => {
        const pageRect = pageEl.getBoundingClientRect();
        const pageMiddle = pageRect.top + pageRect.height / 2;
        const containerMiddle = containerRect.top + containerRect.height / 2;
        const distance = Math.abs(pageMiddle - containerMiddle);
        
        // 更新最接近视口中心的页面
        if (distance < minDistance) {
          minDistance = distance;
          closestPage = parseInt(pageEl.getAttribute('data-page-num') || '1', 10);
        }
        
        // 检测页面是否在视口内或附近
        const buffer = containerRect.height; // 预加载缓冲区
        const isVisible = 
          pageRect.bottom + buffer > containerRect.top &&
          pageRect.top - buffer < containerRect.bottom;
          
        if (isVisible) {
          const pageNum = parseInt(pageEl.getAttribute('data-page-num') || '1', 10);
          newVisiblePages.add(pageNum);
        }
      });
      
      // 更新当前页码
      if (closestPage !== currentPage) {
        setCurrentPage(closestPage);
        setPageInput(closestPage.toString());
      }
      
      // 更新可见页面集合
      setVisiblePages(newVisiblePages);
    };
    
    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    
    // 初始触发一次滚动事件
    handleScroll();
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [pdfDoc, currentPage, numPages]);

  // 渲染可见页面
  useEffect(() => {
    if (!pdfDoc || !containerRef.current || visiblePages.size === 0) return;
    
    const renderVisiblePages = async () => {
      // 防止并发渲染
      if (renderInProgress.current) return;
      renderInProgress.current = true;
      
      try {
        // 找出需要渲染但尚未渲染的页面
        const pagesToRender = Array.from(visiblePages).filter(
          pageNum => !renderedPages.has(pageNum)
        );
        
        if (pagesToRender.length === 0) {
          renderInProgress.current = false;
          return;
        }
        
        console.log(`开始渲染页面: ${pagesToRender.join(', ')}`);
        
        // 一次最多渲染3页，优先渲染当前页面
        const prioritizedPages = [...pagesToRender].sort((a, b) => {
          if (a === currentPage) return -1;
          if (b === currentPage) return 1;
          return Math.abs(a - currentPage) - Math.abs(b - currentPage);
        }).slice(0, 3);
        
        for (const pageNum of prioritizedPages) {
          const pageContainer = containerRef.current?.querySelector(`[data-page-num="${pageNum}"]`) as HTMLElement;
          if (!pageContainer) continue;
          
          // 检查是否已经有canvas
          if (pageContainer.querySelector('canvas')) {
            setRenderedPages(prev => new Set([...prev, pageNum]));
            continue;
          }
          
          // 创建加载指示器
          const loadingDiv = document.createElement('div');
          loadingDiv.className = 'flex items-center justify-center bg-gray-100';
          loadingDiv.style.width = '100%';
          loadingDiv.style.height = '100%';
          loadingDiv.style.position = 'absolute';
          loadingDiv.style.top = '0';
          loadingDiv.style.left = '0';
          
          const loadingText = document.createElement('div');
          loadingText.className = 'animate-pulse';
          loadingText.textContent = `加载第 ${pageNum} 页...`;
          loadingDiv.appendChild(loadingText);
          
          // 清空页面容器并添加加载指示器
          pageContainer.innerHTML = '';
          pageContainer.style.position = 'relative';
          pageContainer.appendChild(loadingDiv);
          
          try {
            // 渲染PDF页面
            const page = await pdfDoc.getPage(pageNum);
            
            // 计算适合的缩放比例
            let actualScale = scale;
            if (fitToWidth && pageContainer.parentElement) {
              const containerWidth = pageContainer.parentElement.clientWidth - 40;
              const baseViewport = page.getViewport({ scale: 1.0 });
              actualScale = containerWidth / baseViewport.width;
              actualScale = Math.min(actualScale, 2.0); // 最大缩放2倍
            }
            
            const viewport = page.getViewport({ scale: actualScale });
            
            // 创建canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { alpha: false });
            if (!context) {
              console.error('无法获取canvas上下文');
              continue;
            }
            
            // 设置canvas尺寸
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.className = 'mx-auto shadow-lg border border-gray-200';
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
            
            // 更新页面容器高度
            pageContainer.style.height = `${viewport.height}px`;
            setPageHeights(prev => ({...prev, [pageNum]: viewport.height}));
            
            // 渲染PDF页面到canvas
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
            
            // 替换加载指示器
            pageContainer.innerHTML = '';
            pageContainer.appendChild(canvas);
            
            // 标记页面已渲染
            setRenderedPages(prev => new Set([...prev, pageNum]));
            
            console.log(`第${pageNum}页渲染完成`);
          } catch (err) {
            console.error(`页面${pageNum}渲染错误:`, err);
            // 移除加载指示器，显示错误信息
            pageContainer.innerHTML = `<div class="text-red-500 p-4">加载页面 ${pageNum} 失败</div>`;
          }
        }
      } finally {
        renderInProgress.current = false;
      }
    };
    
    renderVisiblePages();
  }, [pdfDoc, visiblePages, scale, currentPage]);

  // 处理缩放变化
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;
    
    // 缩放改变时清除已渲染页面
    setRenderedPages(new Set());
    
    // 重新触发滚动事件以检测可见页面
    const container = containerRef.current;
    if (container) {
      const event = new Event('scroll');
      container.dispatchEvent(event);
    }
  }, [scale, pdfDoc]);

  // 处理页面跳转
  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    
    if (isNaN(pageNum) || pageNum < 1 || pageNum > numPages) {
      alert(`请输入有效页码 (1-${numPages})`);
      return;
    }
    
    // 找到对应页面的元素并滚动到该位置
    const pageElement = containerRef.current?.querySelector(`[data-page-num="${pageNum}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth' });
      setCurrentPage(pageNum);
      
      // 添加到可见页面集合
      setVisiblePages(prev => new Set([...prev, pageNum]));
    }
  };

  const handleZoomIn = () => {
    setFitToWidth(false);
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setFitToWidth(false);
    setScale(prevScale => Math.max(0.5, prevScale - 0.2));
  };
  
  const handleFitToWidth = () => {
    setFitToWidth(true);
    if (containerRef.current && pdfDoc) {
      // 重新计算缩放比例
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 40;
      pdfDoc.getPage(1).then(page => {
        const viewport = page.getViewport({ scale: 1.0 });
        const optimalScale = containerWidth / viewport.width;
        setScale(Math.min(optimalScale, 2.0));
      });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      const pageElement = containerRef.current?.querySelector(`[data-page-num="${prevPage}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth' });
        setCurrentPage(prevPage);
        setPageInput(prevPage.toString());
        
        // 添加到可见页面集合
        setVisiblePages(prev => new Set([...prev, prevPage]));
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const nextPage = currentPage + 1;
      const pageElement = containerRef.current?.querySelector(`[data-page-num="${nextPage}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth' });
        setCurrentPage(nextPage);
        setPageInput(nextPage.toString());
        
        // 添加到可见页面集合
        setVisiblePages(prev => new Set([...prev, nextPage]));
      }
    }
  };

  // 添加清除选择的函数
  const clearSelection = () => {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    setToolbarPosition(null);
    setSelectedText('');
  };

  // 修改点击事件处理
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 如果点击的不是工具栏或其子元素，清除选择
      if (!target.closest('.selection-toolbar')) {
        clearSelection();
      }
    };
    
    document.addEventListener('click', handleClick);
    
    // 添加快捷键支持
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按ESC键清除选择
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 监听文本选择
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setToolbarPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setToolbarPosition(null);
        setSelectedText('');
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // 计算工具栏位置
      const x = rect.left + (rect.width / 2);
      const y = rect.bottom;

      setToolbarPosition({ x, y });
      setSelectedText(text);
    };

    // 监听选择变化
    document.addEventListener('selectionchange', handleSelection);
    
    // 点击空白处隐藏工具栏
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.selection-toolbar')) {
        setToolbarPosition(null);
      }
    };
    
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // AI处理函数
  const handleAIOperation = async (operation: 'explain' | 'rewrite' | 'summarize') => {
    if (!selectedText) return;

    const operationTitles = {
      explain: '解释文本',
      rewrite: '改写文本',
      summarize: '文本总结'
    };

    setDialogState({
      isOpen: true,
      title: operationTitles[operation],
      content: null,
      isLoading: true
    });

    try {
      // TODO: 替换为实际的API调用
      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: selectedText,
          operation
        }),
      });

      if (!response.ok) throw new Error('处理请求失败');
      
      const data = await response.json();
      
      setDialogState(prev => ({
        ...prev,
        content: data.result,
        isLoading: false
      }));
    } catch (err) {
      console.error('AI处理错误:', err);
      setDialogState(prev => ({
        ...prev,
        content: '处理过程中出现错误，请重试。',
        isLoading: false
      }));
    }
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
    <div className="flex flex-col items-center bg-gray-100 p-4 rounded-lg h-full">
      {/* 顶部导航 */}
      <div className="flex gap-4 mb-4 w-full justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            variant="outline"
            size="sm"
            className="px-2 py-1"
          >
            <ChevronLeft size={16} />
          </Button>
          
          <span className="px-2 py-1 bg-white rounded border">
            {currentPage} / {numPages}
          </span>
          
          <Button
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
            variant="outline"
            size="sm"
            className="px-2 py-1"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            className="px-2 py-1"
          >
            <ZoomOut size={16} />
          </Button>
          
          <span className="px-2 py-1 bg-white rounded border">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="sm"
            className="px-2 py-1"
          >
            <ZoomIn size={16} />
          </Button>
        </div>
      </div>
      
      {/* PDF内容区域 */}
      <div 
        ref={containerRef}
        className="border border-gray-300 rounded-lg overflow-auto flex-1 w-full bg-white"
        style={{ 
          height: 'calc(100% - 120px)',
          userSelect: 'text',
          WebkitUserSelect: 'text'
        }}
      >
        {/* 页面将由useEffect动态添加 */}
      </div>
      
      {/* 底部控制栏 */}
      <div className="flex items-center justify-center gap-4 mt-4 w-full">
        <form onSubmit={handlePageJump} className="flex items-center gap-2">
          <span>跳转到:</span>
          <Input
            type="number"
            min="1"
            max={numPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className="w-16 h-8 text-center"
          />
          <span>页</span>
          <Button type="submit" size="sm" variant="outline">
            确定
          </Button>
        </form>
      </div>

      {/* 文本选择工具栏 */}
      <TextSelectionToolbar
        position={toolbarPosition}
        onExplain={() => handleAIOperation('explain')}
        onRewrite={() => handleAIOperation('rewrite')}
        onSummarize={() => handleAIOperation('summarize')}
        isLoading={dialogState.isLoading}
      />

      {/* AI处理结果对话框 */}
      <AIResultDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        title={dialogState.title}
        content={dialogState.content}
        isLoading={dialogState.isLoading}
      />
    </div>
  );
} 