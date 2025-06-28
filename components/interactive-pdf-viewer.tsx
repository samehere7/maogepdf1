"use client"

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import './text-layer.css';

// 设置 PDF.js worker
if (typeof window !== 'undefined') {
  const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  dir: string;
  transform: number[];
}

interface Highlight {
  id: string;
  pageNum: number;
  color: string;
  text: string;
  rects: { x: number; y: number; width: number; height: number }[];
  textItems: number[]; // 文本项索引
}

interface OutlineItem {
  title: string;
  dest: any; // PDF.js destination object
  items?: OutlineItem[]; // 嵌套子项
  pageNumber?: number; // 计算出的页码
  level: number; // 层级深度
}

interface InteractivePDFViewerProps {
  file: string | null;
  onTextSelect?: (text: string, action: 'explain' | 'summarize' | 'rewrite') => void;
  onOutlineLoaded?: (outline: OutlineItem[]) => void;
}

export interface PDFViewerRef {
  jumpToPage: (pageNumber: number) => void;
  getCurrentPage: () => number;
  getOutline: () => OutlineItem[];
}

// 预定义的高亮颜色
const HIGHLIGHT_COLORS = [
  { name: '红色', value: '#ef4444', bg: 'rgba(239, 68, 68, 0.25)' },
  { name: '橙色', value: '#f97316', bg: 'rgba(249, 115, 22, 0.25)' },
  { name: '黄色', value: '#eab308', bg: 'rgba(234, 179, 8, 0.25)' },
  { name: '绿色', value: '#22c55e', bg: 'rgba(34, 197, 94, 0.25)' },
  { name: '蓝色', value: '#3b82f6', bg: 'rgba(59, 130, 246, 0.25)' },
  { name: '紫色', value: '#a855f7', bg: 'rgba(168, 85, 247, 0.25)' },
  { name: '灰色', value: '#6b7280', bg: 'rgba(107, 114, 128, 0.25)' },
];

const InteractivePDFViewer = forwardRef<PDFViewerRef, InteractivePDFViewerProps>(({ file, onTextSelect, onOutlineLoaded }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isUserScale, setIsUserScale] = useState(false); // 跟踪用户是否手动设置了缩放
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  
  // 文本选择相关状态 - 使用PDF.js官方选择系统
  const [selectedText, setSelectedText] = useState<string>('');
  
  
  // 菜单和高亮相关状态
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState<{x: number, y: number} | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [textLayers, setTextLayers] = useState<Map<number, TextItem[]>>(new Map());
  
  // PDF目录相关状态
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  // 提取PDF Outline（书签/目录）信息
  const extractOutline = async (doc: PDFDocumentProxy) => {
    try {
      console.log('[PDF Outline] 开始提取PDF目录信息...');
      
      const outlineData = await doc.getOutline();
      if (!outlineData || outlineData.length === 0) {
        console.log('[PDF Outline] 此PDF没有目录信息');
        setOutline([]);
        onOutlineLoaded?.([]);
        return;
      }

      console.log('[PDF Outline] 找到目录项:', outlineData.length);
      
      // 递归处理outline项，计算页码
      const processOutlineItems = async (items: any[], level = 0): Promise<OutlineItem[]> => {
        const result: OutlineItem[] = [];
        
        for (const item of items) {
          let pageNumber: number | undefined;
          
          // 尝试解析目标页码
          if (item.dest) {
            try {
              let dest = item.dest;
              
              // 如果dest是字符串，需要先获取destination
              if (typeof dest === 'string') {
                dest = await doc.getDestination(dest);
              }
              
              if (dest && Array.isArray(dest) && dest.length > 0) {
                const pageRef = dest[0];
                
                // 如果是页面引用对象，获取页码
                if (pageRef && typeof pageRef === 'object' && 'num' in pageRef) {
                  const pageIndex = await doc.getPageIndex(pageRef);
                  pageNumber = pageIndex + 1; // PDF页码从1开始
                } else if (typeof pageRef === 'number') {
                  pageNumber = pageRef + 1;
                }
              }
            } catch (error) {
              console.warn('[PDF Outline] 解析目录项页码失败:', item.title, error);
            }
          }
          
          const outlineItem: OutlineItem = {
            title: item.title || '未命名',
            dest: item.dest,
            pageNumber,
            level,
            items: item.items ? await processOutlineItems(item.items, level + 1) : undefined
          };
          
          result.push(outlineItem);
          
          console.log(`[PDF Outline] 处理目录项: "${outlineItem.title}" -> 页码 ${pageNumber || '未知'} (层级 ${level})`);
        }
        
        return result;
      };
      
      const processedOutline = await processOutlineItems(outlineData);
      setOutline(processedOutline);
      onOutlineLoaded?.(processedOutline);
      
      console.log('[PDF Outline] 目录提取完成，共', processedOutline.length, '个顶级项目');
      
    } catch (error) {
      console.error('[PDF Outline] 提取目录失败:', error);
      setOutline([]);
      onOutlineLoaded?.([]);
    }
  };

  // Scroll to specified page with enhanced error tolerance and retry mechanism
  const scrollToPage = useCallback((pageNum: number, retryCount = 0) => {
    console.log(`[PDF Viewer] scrollToPage called, target page: ${pageNum}, retry count: ${retryCount}`);
    
    // Check basic conditions
    if (!containerRef.current || !viewerRef.current) {
      console.log(`[PDF Viewer] Container not ready - containerRef: ${!!containerRef.current}, viewerRef: ${!!viewerRef.current}`);
      
      // Retry if less than 3 attempts
      if (retryCount < 3) {
        setTimeout(() => {
          scrollToPage(pageNum, retryCount + 1);
        }, 200 * (retryCount + 1)); // Incremental delay
        return;
      } else {
        console.warn(`[PDF Viewer] Failed to find container after ${retryCount} retries, abandoning scroll`);
        return;
      }
    }
    
    const pageElement = containerRef.current.querySelector(`.pdf-page[data-page-num="${pageNum}"]`);
    console.log(`[PDF Viewer] Found page element:`, pageElement);
    
    if (pageElement) {
      console.log(`[PDF Viewer] Starting scroll to page ${pageNum}`);
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.log(`[PDF Viewer] Page element not found, current pages in DOM:`, 
        Array.from(containerRef.current.querySelectorAll('.pdf-page')).map(el => el.getAttribute('data-page-num')));
      
      // Retry if page element not found and less than 5 attempts
      if (retryCount < 5) {
        setTimeout(() => {
          scrollToPage(pageNum, retryCount + 1);
        }, 300 * (retryCount + 1));
      } else {
        console.warn(`[PDF Viewer] Failed to find page ${pageNum} after ${retryCount} retries, abandoning scroll`);
      }
    }
  }, []);

  // Methods exposed to parent component
  useImperativeHandle(ref, () => ({
    jumpToPage: (pageNumber: number) => {
      console.log(`PDF Viewer jumping to page ${pageNumber}, total pages: ${numPages}`);
      
      // If pages not loaded yet, delay execution
      if (numPages === 0) {
        console.log(`PDF still loading, delaying jump execution`);
        setTimeout(() => {
          if (pageNumber >= 1 && (numPages === 0 || pageNumber <= numPages)) {
            scrollToPage(pageNumber);
            setCurrentVisiblePage(pageNumber);
          }
        }, 1000);
        return;
      }
      
      if (pageNumber >= 1 && pageNumber <= numPages) {
        scrollToPage(pageNumber);
        setCurrentVisiblePage(pageNumber);
      } else {
        console.warn(`页码${pageNumber}超出范围 (1-${numPages})`);
      }
    },
    getCurrentPage: () => currentVisiblePage,
    getOutline: () => outline
  }), [numPages, currentVisiblePage, scrollToPage, outline]);

  // Auto-fit zoom to container width
  const fitToWidth = useCallback(async () => {
    if (!pdfDoc || !viewerRef.current) return;
    
    try {
      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      const containerWidth = viewerRef.current.clientWidth - 40; // 减去padding
      const optimalScale = containerWidth / viewport.width;
      
      // 限制缩放范围
      const clampedScale = Math.max(0.5, Math.min(2.5, optimalScale));
      setScale(clampedScale);
      setIsUserScale(false); // 标记为自动缩放
      
      console.log(`[PDF Auto-fit] Container width: ${containerWidth}, PDF original width: ${viewport.width}, calculated scale: ${optimalScale}, actual scale: ${clampedScale}`);
    } catch (error) {
      console.error('Auto-fit zoom failed:', error);
    }
  }, [pdfDoc]);

  // Load PDF file
  useEffect(() => {
    if (!file) return;
    
    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const fullUrl = file.startsWith('http') ? file : 
                      (typeof window !== 'undefined' ? `${window.location.origin}${file}` : file);
        
        console.log('Starting to load PDF file:', fullUrl);
        
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log('PDF file loaded successfully, size:', arrayBuffer.byteLength, 'bytes');
        
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log('PDF document loaded successfully, pages:', doc.numPages);
        
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setError(null);
        
        // 提取PDF目录信息
        await extractOutline(doc);
        
        // Delay auto-fit zoom to ensure container is rendered
        setTimeout(() => {
          fitToWidth();
        }, 100);
      } catch (err) {
        console.error('PDF file loading error:', err);
        setError('Unable to load PDF file: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [file]);

  // Render individual PDF page
  const renderPage = async (pageNum: number, forceRender: boolean = false) => {
    if (!pdfDoc || !containerRef.current) return;
    if (!forceRender && renderedPages.has(pageNum)) return;

    const container = containerRef.current;
    const pageContainer = container.querySelector(`.pdf-page[data-page-num="${pageNum}"]`) as HTMLElement;
    if (!pageContainer) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      // If forced rendering, clear container content first
      if (forceRender) {
        pageContainer.innerHTML = '';
      }
      
      // Set page container styles - cleaner layout
      pageContainer.style.position = 'relative';
      pageContainer.style.width = `${viewport.width}px`;
      pageContainer.style.height = `${viewport.height}px`;
      pageContainer.style.margin = '0 auto';
      pageContainer.style.border = '1px solid #e0e0e0';
      pageContainer.style.backgroundColor = 'white';
      pageContainer.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      pageContainer.style.borderRadius = '2px';
      
      // 创建canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return;
      
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * devicePixelRatio;
      canvas.height = viewport.height * devicePixelRatio;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.style.display = 'block';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      
      context.scale(devicePixelRatio, devicePixelRatio);
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      pageContainer.appendChild(canvas);
      
      // Render text layer
      await renderTextLayer(page, viewport, pageContainer, pageNum);
      
      // Render highlight layer
      renderHighlights(pageContainer, pageNum, viewport);
      
      // 标记为已渲染
      setRenderedPages(prev => new Set([...prev, pageNum]));
      
      // 移除占位符
      const placeholder = pageContainer.querySelector('.pdf-page-placeholder');
      if (placeholder) {
        placeholder.remove();
      }
      
      console.log(`[PDF渲染] 页面${pageNum}渲染完成`);
      
    } catch (err) {
      console.error(`Page ${pageNum} rendering error:`, err);
      pageContainer.innerHTML = `<div class="text-red-500 p-4 text-center">Failed to load page ${pageNum}</div>`;
    }
  };
  
  // 优化版本：懒渲染所有页面（只创建容器，实际渲染在可见时进行）
  const renderAllPages = async () => {
    if (!pdfDoc || !containerRef.current) return Promise.resolve();
    
    const container = containerRef.current;
    container.innerHTML = '';
    
    console.log(`[PDF渲染] 开始创建${numPages}个页面容器（懒渲染模式）`);
    
    // 创建所有页面容器，但不立即渲染内容（懒渲染策略）
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pageContainer = document.createElement('div');
      pageContainer.className = 'pdf-page-container';
      pageContainer.setAttribute('data-page-num', pageNum.toString());
      pageContainer.style.marginBottom = '15px';
      pageContainer.style.minHeight = '600px'; // 预设高度避免布局跳动
      
      const pageContent = document.createElement('div');
      pageContent.className = 'pdf-page';
      pageContent.setAttribute('data-page-num', pageNum.toString());
      
      // 添加懒加载标识
      const placeholder = document.createElement('div');
      placeholder.className = 'pdf-page-placeholder';
      placeholder.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        height: 600px;
        background: #f8f9fa;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        color: #6b7280;
        font-size: 14px;
      `;
      placeholder.textContent = `页面 ${pageNum} - 滚动到此处加载`;
      
      pageContent.appendChild(placeholder);
      pageContainer.appendChild(pageContent);
      container.appendChild(pageContainer);
      
      // 优化初始加载：只渲染前3页
      if (pageNum <= 3) {
        await renderPage(pageNum);
      }
    }
    
    // 设置懒加载
    setupLazyLoading();
    
    return Promise.resolve();
  };
  
  // 优化的懒加载设置 - 提高缩放时的响应性
  const setupLazyLoading = () => {
    if (!viewerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        // 使用requestAnimationFrame避免渲染阻塞
        requestAnimationFrame(() => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const pageElement = entry.target as HTMLElement;
              const pageNum = parseInt(pageElement.getAttribute('data-page-num') || '0');
              if (pageNum > 0 && !renderedPages.has(pageNum)) {
                // 延迟渲染，避免同时渲染多页造成卡顿
                setTimeout(() => renderPage(pageNum), pageNum * 30);
              }
            }
          });
        });
      },
      {
        root: viewerRef.current,
        rootMargin: '300px', // 适中的预加载距离
        threshold: 0.1 // 适中的触发阈值
      }
    );
    
    // 观察所有页面容器
    const pageContainers = containerRef.current?.querySelectorAll('.pdf-page');
    pageContainers?.forEach(container => {
      observer.observe(container);
    });
    
    return () => observer.disconnect();
  };

  
  
  // 渲染文本层 - 使用PDF.js官方TextLayer标准实现
  const renderTextLayer = async (page: any, viewport: any, pageContainer: HTMLElement, pageNum: number) => {
    try {
      const textContent = await page.getTextContent();
      
      // 创建文本层容器 - 完全按照PDF.js官方标准，添加防重影样式
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.position = 'absolute';
      textLayerDiv.style.inset = '0';
      textLayerDiv.style.overflow = 'clip';
      textLayerDiv.style.opacity = '1';
      textLayerDiv.style.lineHeight = '1';
      textLayerDiv.style.zIndex = '0';
      textLayerDiv.style.transformOrigin = '0 0';
      
      // 简化ID设置，减少动态样式注入
      const uniqueId = `text-layer-${pageNum}`;
      textLayerDiv.id = uniqueId;
      
      const textItems: TextItem[] = [];
      
      // 使用PDF.js官方的文本项渲染逻辑和精确坐标计算
      textContent.items.forEach((item: any, index: number) => {
        const span = document.createElement('span');
        
        // PDF.js官方坐标变换 - 关键的精确计算
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        
        // 计算角度和位置
        let angle = Math.atan2(tx[1], tx[0]);
        const style = textContent.styles[item.fontName];
        const fontFamily = style?.fontFamily || 'sans-serif';
        
        if (style?.vertical) {
          angle += Math.PI / 2;
        }
        
        const fontHeight = Math.hypot(tx[2], tx[3]);
        const fontAscent = fontHeight * 0.8; // 近似字体上升高度
        
        // 精确位置计算 - 使用PDF.js官方算法
        let left, top;
        if (angle === 0) {
          left = tx[4];
          top = tx[5] - fontAscent;
        } else {
          left = tx[4] + fontAscent * Math.sin(angle);
          top = tx[5] - fontAscent * Math.cos(angle);
        }
        
        // 使用百分比定位确保跨缩放精确对齐
        const pageWidth = viewport.width;
        const pageHeight = viewport.height;
        
        span.style.position = 'absolute';
        span.style.left = `${((100 * left) / pageWidth).toFixed(4)}%`;
        span.style.top = `${((100 * top) / pageHeight).toFixed(4)}%`;
        span.style.fontSize = `${fontHeight.toFixed(2)}px`;
        span.style.fontFamily = fontFamily;
        span.style.whiteSpace = 'pre';
        span.style.color = 'transparent';
        span.style.cursor = 'text';
        span.style.userSelect = 'text';
        span.style.webkitUserSelect = 'text';
        span.style.pointerEvents = 'auto';
        span.style.transformOrigin = '0% 0%';
        span.style.touchAction = 'manipulation';
        span.style.backgroundColor = 'transparent';
        span.style.outline = 'none';
        span.style.border = 'none';
        span.style.boxShadow = 'none';
        span.style.textShadow = 'none';
        span.style.filter = 'none';
        span.style.backdropFilter = 'none';
        
        // 统一多语言字符的选择属性 - 彻底修复重影和偏移问题
        span.style.webkitTextFillColor = 'transparent';
        span.style.webkitTextStroke = 'none';
        span.style.textRendering = 'optimizeSpeed'; // 改为optimizeSpeed避免渲染差异
        span.style.fontKerning = 'none'; // 禁用字距调整避免重影
        span.style.fontOpticalSizing = 'none';
        span.style.fontSynthesis = 'none';
        span.style.unicodeBidi = 'normal';
        span.style.direction = 'ltr';
        span.style.writingMode = 'horizontal-tb';
        span.style.fontVariant = 'normal';
        span.style.fontFeatureSettings = 'normal';
        span.style.fontVariationSettings = 'normal';
        
        // 针对中英文混合的额外选择优化
        span.style.fontVariantLigatures = 'none'; // 禁用连字
        span.style.fontVariantNumeric = 'normal';
        span.style.fontVariantCaps = 'normal';
        span.style.fontVariantAlternates = 'normal';
        span.style.fontVariantEastAsian = 'normal';
        span.style.fontLanguageOverride = 'normal';
        span.style.letterSpacing = 'normal';
        span.style.wordSpacing = 'normal';
        span.style.textIndent = '0';
        
        // 强制边界装饰一致性，防止选择重影
        span.style.boxDecorationBreak = 'clone';
        span.style.webkitBoxDecorationBreak = 'clone';
        
        // 强化选择行为一致性和防重影
        span.style.webkitFontSmoothing = 'antialiased'; // 统一抗锯齿
        span.style.mozOsxFontSmoothing = 'grayscale';
        span.style.textSizeAdjust = 'none';
        span.style.webkitTextSizeAdjust = 'none';
        
        // 优化选择区域 - 减少偏移感
        span.style.padding = '1px 0px'; // 减少padding避免重叠
        span.style.margin = '-1px 0px';
        span.style.minWidth = '1px';
        span.style.minHeight = '1em';
        
        // 强制统一背景和混合模式，防止重影
        span.style.backgroundImage = 'none';
        span.style.backgroundClip = 'content-box'; // 改为content-box
        span.style.webkitBackgroundClip = 'content-box';
        span.style.mixBlendMode = 'normal';
        span.style.isolation = 'isolate';
        
        // 防止拖拽偏移的关键属性
        span.style.contain = 'layout style';
        span.style.willChange = 'auto';
        span.style.backfaceVisibility = 'hidden';
        
        // 处理旋转
        if (angle !== 0) {
          span.style.transform = `rotate(${angle}rad)`;
        }
        
        span.textContent = item.str;
        span.setAttribute('data-text-index', index.toString());
        span.setAttribute('data-page-num', pageNum.toString());
        
        // 为英文、数字和符号字符添加标识，用于CSS选择器优化
        const hasLatin = /[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;':".,<>\?\/\\`~]/.test(item.str);
        if (hasLatin) {
          span.setAttribute('data-font-type', 'latin');
        }
        
        textLayerDiv.appendChild(span);
        
        // 保存文本项信息 - 使用实际像素坐标
        const textItem: TextItem = {
          str: item.str,
          x: left,
          y: top,
          width: item.width * Math.abs(tx[0]),
          height: fontHeight,
          fontName: item.fontName,
          dir: item.dir,
          transform: tx
        };
        textItems.push(textItem);
      });
      
      // 添加endOfContent元素（PDF.js选择优化的关键）
      const endOfContent = document.createElement('div');
      endOfContent.className = 'endOfContent';
      endOfContent.style.display = 'block';
      endOfContent.style.position = 'absolute';
      endOfContent.style.inset = '100% 0 0';
      endOfContent.style.zIndex = '-1';
      endOfContent.style.cursor = 'default';
      endOfContent.style.userSelect = 'none';
      textLayerDiv.appendChild(endOfContent);
      
      // 保存文本层信息
      setTextLayers(prev => new Map(prev).set(pageNum, textItems));
      
      pageContainer.appendChild(textLayerDiv);
      
      // 添加PDF.js官方的选择事件处理
      addPdfJsSelectionEvents(textLayerDiv, pageNum);
      
      // 启用原生文本选择 - 确保选择功能正常
      textLayerDiv.style.userSelect = 'text';
      textLayerDiv.style.webkitUserSelect = 'text';
      textLayerDiv.style.pointerEvents = 'auto';
      textLayerDiv.style.touchAction = 'manipulation'; // 支持触摸选择
      
      // 添加页面点击事件来清除高亮
      pageContainer.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const selection = window.getSelection();
        
        // 如果有活动选择，不处理点击（基于PDF.js标准）
        if (selection && !selection.isCollapsed) {
          return;
        }
        
        // 如果点击在颜色选择器上，不清除高亮
        if (target.closest('.color-picker')) {
          return;
        }
        
        // 如果点击在文本上，不清除高亮
        if (target.tagName === 'SPAN' && target.closest('.textLayer')) {
          return;
        }
        
        // 检查是否有高亮需要清除
        if (highlights.some(h => h.pageNum === pageNum)) {
          clearCurrentPageHighlights(pageNum);
        }
      });
      
    } catch (err) {
      console.error('文本层渲染错误:', err);
    }
  };

  // 优化的PDF渲染 - 支持懒加载和缩放
  useEffect(() => {
    if (pdfDoc && numPages > 0) {
      console.log(`[PDF渲染] 开始优化渲染，页数: ${numPages}, 缩放: ${scale}`);
      
      // 获取当前可见页面位置，保持用户视野
      const currentVisiblePage = getCurrentVisiblePage();
      
      // 清空当前渲染状态，重新懒加载
      setRenderedPages(new Set());
      
      renderAllPages().then(() => {
        console.log(`[PDF渲染] 容器创建完成，开始滚动到页面 ${currentVisiblePage}`);
        
        // 滚动回到原来的可见页面
        setTimeout(() => {
          scrollToPage(currentVisiblePage);
        }, 200); // 减少延迟，提高响应速度
      });
    }
  }, [pdfDoc, numPages, scale]);
  
  // 更新高亮
  useEffect(() => {
    if (highlights.length > 0 && pdfDoc && containerRef.current) {
      // 重新渲染所有页面的高亮（通过DOM查找而不是依赖状态）
      const pageContainers = containerRef.current.querySelectorAll('.pdf-page');
      pageContainers.forEach((pageContainer) => {
        const pageNum = parseInt(pageContainer.getAttribute('data-page-num') || '0');
        if (pageNum > 0) {
          pdfDoc.getPage(pageNum).then(page => {
            const viewport = page.getViewport({ scale });
            renderHighlights(pageContainer as HTMLElement, pageNum, viewport);
          });
        }
      });
    }
  }, [highlights, scale]);

  // 智能位置计算函数 - 优化为显示在选中区域上方
  const calculateOptimalPosition = useCallback((selectionRect: DOMRect, viewerRect: DOMRect) => {
    const PICKER_WIDTH = 320; // 颜色选择器的宽度
    const PICKER_HEIGHT = 200; // 颜色选择器的高度
    const MARGIN = 15; // 增加边距，让弹窗不会太贴边
    const OFFSET_FROM_SELECTION = 10; // 距离选中内容的偏移量
    
    console.log('计算位置参数:', { selectionRect, viewerRect, viewerRefExists: !!viewerRef.current });
    
    // 使用绝对定位相对于视口，不需要考虑滚动
    // 水平位置：居中对齐选中区域
    let x = selectionRect.left + (selectionRect.width - PICKER_WIDTH) / 2;
    
    // 检查左右边界，确保不超出视口
    if (x < MARGIN) {
      x = MARGIN;
    } else if (x + PICKER_WIDTH > window.innerWidth - MARGIN) {
      x = window.innerWidth - PICKER_WIDTH - MARGIN;
    }
    
    // 垂直位置：优先显示在选中区域上方
    let y = selectionRect.top - PICKER_HEIGHT - OFFSET_FROM_SELECTION;
    
    // 如果上方空间不够，放在下方
    if (y < MARGIN) {
      y = selectionRect.bottom + OFFSET_FROM_SELECTION;
    }
    
    // 确保不超出下边界
    if (y + PICKER_HEIGHT > window.innerHeight - MARGIN) {
      // 如果下方也不够，放在选中区域的中间偏上
      y = selectionRect.top - PICKER_HEIGHT / 2;
      if (y < MARGIN) y = MARGIN;
    }
    
    const position = { x, y };
    console.log('计算得到的位置:', position, '视口尺寸:', { width: window.innerWidth, height: window.innerHeight });
    return position;
  }, []);

  // 优化的选择事件处理 - 解决拖拽偏移和边界问题
  const addPdfJsSelectionEvents = useCallback((textLayerDiv: HTMLElement, pageNum: number) => {
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    
    // 处理拖拽开始
    const handleMouseDown = (e: MouseEvent) => {
      // 只处理左键
      if (e.button !== 0) return;
      
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      
      // 清除之前的选择，避免干扰
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        // 如果点击不在当前选择区域内，清除选择
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        if (range) {
          const rects = range.getClientRects();
          let clickInSelection = false;
          
          for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            if (e.clientX >= rect.left && e.clientX <= rect.right && 
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
              clickInSelection = true;
              break;
            }
          }
          
          if (!clickInSelection) {
            selection.removeAllRanges();
          }
        }
      }
    };
    
    // 处理拖拽过程
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // 计算拖拽距离，防止微小移动触发选择
      const deltaX = Math.abs(e.clientX - dragStartX);
      const deltaY = Math.abs(e.clientY - dragStartY);
      
      if (deltaX < 3 && deltaY < 3) {
        return; // 忽略微小移动
      }
      
      // 确保拖拽在文本层边界内
      const textLayerRect = textLayerDiv.getBoundingClientRect();
      const isInBounds = e.clientX >= textLayerRect.left - 10 && 
                        e.clientX <= textLayerRect.right + 10 &&
                        e.clientY >= textLayerRect.top - 10 && 
                        e.clientY <= textLayerRect.bottom + 10;
      
      if (!isInBounds) {
        // 拖拽超出边界时，限制选择范围
        e.preventDefault();
        return;
      }
    };
    
    // 处理拖拽结束
    const handleMouseUp = (e: MouseEvent) => {
      isDragging = false;
      
      // 短暂延迟后检查选择结果，确保选择稳定
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          const selectedText = selection.toString().trim();
          if (selectedText.length > 0) {
            console.log('选择完成:', selectedText);
          }
        }
      }, 50);
    };
    
    // 双击选择整个词
    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'SPAN' && target.closest('.textLayer')) {
        e.preventDefault();
        
        const selection = window.getSelection();
        if (selection) {
          try {
            const range = document.createRange();
            range.selectNodeContents(target);
            selection.removeAllRanges();
            selection.addRange(range);
          } catch (error) {
            console.warn('双击选择失败:', error);
          }
        }
      }
    };
    
    // 添加事件监听器
    textLayerDiv.addEventListener('mousedown', handleMouseDown);
    textLayerDiv.addEventListener('mousemove', handleMouseMove);
    textLayerDiv.addEventListener('mouseup', handleMouseUp);
    textLayerDiv.addEventListener('dblclick', handleDoubleClick);
    
    // 返回清理函数
    return () => {
      textLayerDiv.removeEventListener('mousedown', handleMouseDown);
      textLayerDiv.removeEventListener('mousemove', handleMouseMove);
      textLayerDiv.removeEventListener('mouseup', handleMouseUp);
      textLayerDiv.removeEventListener('dblclick', handleDoubleClick);
    };
  }, []);

  
  // 优化的选择处理机制 - 减少选择丢失，提高稳定性
  useEffect(() => {
    let selectionTimeout: NodeJS.Timeout | null = null;
    let lastSelectionText = '';
    let isProcessing = false;
    
    // 延长防抖时间，减少频繁处理
    const debouncedProcessSelection = () => {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      selectionTimeout = setTimeout(processSelection, 300); // 延长防抖时间
    };
    
    const processSelection = () => {
      if (isProcessing) return; // 防止重复处理
      
      const selection = window.getSelection();
      
      // 检查选择是否有效
      if (!selection || selection.isCollapsed) {
        if (lastSelectionText || showColorPicker) { // 只在之前有选择或弹窗显示时才清除
          setShowColorPicker(false);
          setSelectedText('');
          lastSelectionText = '';
        }
        return;
      }
      
      const selectedText = selection.toString().trim();
      // 降低最小长度要求，支持单个英文字符和符号选择
      if (!selectedText || selectedText.length < 1) {
        return;
      }
      
      // 特别处理：确保英文和符号字符能被正确选择
      const range = selection.getRangeAt(0);
      if (range && range.collapsed) {
        return; // 如果range是collapsed但有selectedText，说明是浏览器bug
      }
      
      // 避免重复处理相同的选择
      if (selectedText === lastSelectionText) {
        return;
      }
      
      // 检查选择是否在PDF文本层内
      try {
        isProcessing = true;
        const range = selection.getRangeAt(0);
        const startElement = range.startContainer.nodeType === Node.TEXT_NODE 
          ? range.startContainer.parentElement 
          : range.startContainer as Element;
            
        const textLayer = startElement?.closest('.textLayer');
        if (!textLayer) {
          return; // 不在PDF文本层内的选择
        }
        
        // 特殊处理：检查选择内容的字符类型，确保英文和符号正确处理
        const hasEnglish = /[a-zA-Z]/.test(selectedText);
        const hasSymbols = /[^\u4e00-\u9fa5a-zA-Z0-9\s]/.test(selectedText);
        const hasMixed = /[\u4e00-\u9fa5].*[a-zA-Z]|[a-zA-Z].*[\u4e00-\u9fa5]/.test(selectedText);
        
        if (hasEnglish || hasSymbols || hasMixed) {
          // 为英文、符号和中英文混合字符提供额外的选择稳定性检查
          const rects = range.getClientRects();
          if (!rects || rects.length === 0) {
            console.warn('混合字符选择范围无效，跳过处理');
            return;
          }
          
          // 针对中英文混合内容，验证选择范围的连续性
          if (hasMixed) {
            let isValidMixedSelection = true;
            
            // 检查选择的起始和结束元素是否都在文本层内
            const endElement = range.endContainer.nodeType === Node.TEXT_NODE 
              ? range.endContainer.parentElement 
              : range.endContainer as Element;
            
            if (!startElement?.closest('.textLayer') || !endElement?.closest('.textLayer')) {
              isValidMixedSelection = false;
            }
            
            // 检查选择范围是否跨越了多个不相邻的文本元素
            if (isValidMixedSelection && rects.length > 5) {
              // 如果选择范围矩形过多，可能是跨页面或不连续选择，需要额外验证
              let lastBottom = -1;
              for (let i = 0; i < rects.length; i++) {
                const rect = rects[i];
                if (lastBottom > 0 && rect.top > lastBottom + rect.height * 2) {
                  // 如果垂直间距过大，可能是不连续选择
                  console.log('检测到可能的不连续混合字符选择，需要优化处理');
                  break;
                }
                lastBottom = Math.max(lastBottom, rect.bottom);
              }
            }
            
            if (!isValidMixedSelection) {
              console.warn('中英文混合选择验证失败，跳过处理');
              return;
            }
          }
        }
        
        lastSelectionText = selectedText;
        setSelectedText(selectedText);
        
        // 获取选择范围的位置并显示颜色选择器
        const rect = range.getBoundingClientRect();
        const viewerRect = viewerRef.current?.getBoundingClientRect();
        
        if (viewerRect && rect.width > 0 && rect.height > 0) {
          const position = calculateOptimalPosition(rect, viewerRect);
          setColorPickerPosition(position);
          setShowColorPicker(true);
        }
      } catch (error) {
        console.warn('处理选择时出错:', error);
      } finally {
        isProcessing = false;
      }
    };
    
    // 统一的选择变化处理
    const handleSelectionChange = () => {
      // 只有在没有弹窗显示时才处理新选择
      if (!showColorPicker || !isProcessing) {
        debouncedProcessSelection();
      }
    };
    
    // 监听选择变化事件
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
    };
  }, [calculateOptimalPosition, showColorPicker]);
  
  // 矩形优化算法 - 借鉴react-pdf-highlighter的optimize-client-rects
  const optimizeClientRects = useCallback((clientRects: DOMRectList) => {
    const rects = Array.from(clientRects).filter(rect => rect.width > 0 && rect.height > 0);
    if (rects.length === 0) return [];
    
    // 按位置排序
    const sortedRects = rects.sort((a, b) => {
      if (Math.abs(a.top - b.top) < 5) { // 同一行
        return a.left - b.left;
      }
      return a.top - b.top;
    });
    
    const optimizedRects = [];
    let currentRect = sortedRects[0];
    
    for (let i = 1; i < sortedRects.length; i++) {
      const nextRect = sortedRects[i];
      
      // 检查是否可以合并（同一行且相邻）
      const sameLine = Math.abs(currentRect.top - nextRect.top) < 5 && 
                       Math.abs(currentRect.height - nextRect.height) < 5;
      const adjacent = Math.abs(currentRect.right - nextRect.left) < 10;
      
      if (sameLine && adjacent) {
        // 合并矩形
        currentRect = {
          left: Math.min(currentRect.left, nextRect.left),
          top: Math.min(currentRect.top, nextRect.top),
          right: Math.max(currentRect.right, nextRect.right),
          bottom: Math.max(currentRect.bottom, nextRect.bottom),
          width: Math.max(currentRect.right, nextRect.right) - Math.min(currentRect.left, nextRect.left),
          height: Math.max(currentRect.bottom, nextRect.bottom) - Math.min(currentRect.top, nextRect.top),
          x: Math.min(currentRect.left, nextRect.left),
          y: Math.min(currentRect.top, nextRect.top),
        } as DOMRect;
      } else {
        optimizedRects.push(currentRect);
        currentRect = nextRect;
      }
    }
    
    optimizedRects.push(currentRect);
    return optimizedRects;
  }, []);

  // 处理颜色选择 - 使用优化的矩形算法
  const handleColorSelect = useCallback(async (color: typeof HIGHLIGHT_COLORS[0]) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selectedText) return;
    
    try {
      // 生成高亮 ID
      const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 获取选择范围的页面信息
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const pageElement = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement?.closest('.pdf-page')
        : (container as Element).closest('.pdf-page');
      
      if (!pageElement) return;
      
      const pageNum = parseInt(pageElement.getAttribute('data-page-num') || '1');
      
      // 创建高亮对象
      const highlight: Highlight = {
        id: highlightId,
        pageNum,
        color: color.value,
        text: selectedText,
        rects: [],
        textItems: []
      };
      
      // 获取选中范围的矩形信息并优化
      const clientRects = range.getClientRects();
      const optimizedRects = optimizeClientRects(clientRects);
      const textLayer = pageElement.querySelector('.textLayer') as HTMLElement;
      
      if (!textLayer) {
        console.error('未找到textLayer');
        return;
      }
      
      const textLayerRect = textLayer.getBoundingClientRect();
      const pageWidth = textLayerRect.width;
      const pageHeight = textLayerRect.height;
      
      // 处理优化后的矩形
      optimizedRects.forEach(rect => {
        // 转换为相对于textLayer的百分比坐标
        const relativeX = rect.left - textLayerRect.left;
        const relativeY = rect.top - textLayerRect.top;
        
        // 使用百分比坐标确保跨缩放精确对齐
        const percentX = (relativeX / pageWidth) * 100;
        const percentY = (relativeY / pageHeight) * 100;
        const percentWidth = (rect.width / pageWidth) * 100;
        const percentHeight = (rect.height / pageHeight) * 100;
        
        highlight.rects.push({
          x: percentX,
          y: percentY,
          width: percentWidth,
          height: percentHeight
        });
      });
      
      if (highlight.rects.length === 0) return;
      
      // 添加到高亮列表
      const newHighlights = [...highlights, highlight];
      setHighlights(newHighlights);
      
      // 保存高亮数据
      saveHighlights(newHighlights);
      
      // 立即渲染高亮
      if (pdfDoc) {
        pdfDoc.getPage(pageNum).then(page => {
          const viewport = page.getViewport({ scale });
          renderHighlights(pageElement, pageNum, viewport);
        });
      }
      
    } catch (error) {
      console.error('创建高亮失败:', error);
    } finally {
      // 延迟清除选中，让用户看到高亮效果
      setTimeout(() => {
        selection.removeAllRanges();
        setShowColorPicker(false);
        setSelectedText('');
      }, 300); // 缩短延迟时间，提升响应性
    }
  }, [selectedText, highlights, scale, pdfDoc, optimizeClientRects]);
  
  // 渲染高亮层
  const renderHighlights = useCallback((pageContainer: HTMLElement, pageNum: number, viewport: any) => {
    // 清除之前的高亮层
    const existingHighlights = pageContainer.querySelectorAll('.highlight-layer');
    existingHighlights.forEach(layer => layer.remove());
    
    const pageHighlights = highlights.filter(h => h.pageNum === pageNum);
    if (pageHighlights.length === 0) return;
    
    // 创建高亮层
    const highlightLayer = document.createElement('div');
    highlightLayer.className = 'highlight-layer';
    highlightLayer.style.position = 'absolute';
    highlightLayer.style.left = '0';
    highlightLayer.style.top = '0';
    highlightLayer.style.right = '0';
    highlightLayer.style.bottom = '0';
    highlightLayer.style.pointerEvents = 'none';
    highlightLayer.style.zIndex = '5';
    
    // 渲染当前页面的高亮 - 使用百分比坐标确保精确对齐
    pageHighlights.forEach(highlight => {
      highlight.rects.forEach((rect, index) => {
        const highlightDiv = document.createElement('div');
        highlightDiv.className = 'highlight-rect';
        highlightDiv.style.position = 'absolute';
        highlightDiv.style.left = `${rect.x.toFixed(4)}%`;
        highlightDiv.style.top = `${rect.y.toFixed(4)}%`;
        highlightDiv.style.width = `${rect.width.toFixed(4)}%`;
        highlightDiv.style.height = `${rect.height.toFixed(4)}%`;
        
        const colorConfig = HIGHLIGHT_COLORS.find(c => c.value === highlight.color);
        highlightDiv.style.backgroundColor = colorConfig?.bg || 'rgba(255, 255, 0, 0.3)';
        highlightDiv.style.borderRadius = '1px';
        highlightDiv.style.pointerEvents = 'auto';
        highlightDiv.style.cursor = 'pointer';
        highlightDiv.style.transition = 'opacity 0.2s ease';
        highlightDiv.style.mixBlendMode = 'multiply'; // 改善高亮与文本的融合
        highlightDiv.style.transformOrigin = '0% 0%'; // 确保变换一致性
        
        highlightDiv.setAttribute('data-highlight-id', highlight.id);
        highlightDiv.setAttribute('data-highlight-text', highlight.text);
        highlightDiv.setAttribute('data-page-num', pageNum.toString());
        highlightDiv.title = `高亮: "${highlight.text.slice(0, 50)}${highlight.text.length > 50 ? '...' : ''}" - 右击删除`;
        
        // 添加悬停效果
        highlightDiv.addEventListener('mouseenter', () => {
          highlightDiv.style.opacity = '0.8';
        });
        
        highlightDiv.addEventListener('mouseleave', () => {
          highlightDiv.style.opacity = '1';
        });
        
        // 添加右击删除功能
        highlightDiv.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          // 直接删除，不需要确认
          deleteHighlight(highlight.id);
        });
        
        // 点击显示高亮信息
        highlightDiv.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('高亮内容:', highlight.text);
        });
        
        highlightLayer.appendChild(highlightDiv);
      });
    });
    
    pageContainer.appendChild(highlightLayer);
  }, [highlights]);
  
  // 删除单个高亮
  const deleteHighlight = useCallback((highlightId: string) => {
    const highlightToDelete = highlights.find(h => h.id === highlightId);
    if (!highlightToDelete) return;
    
    const newHighlights = highlights.filter(h => h.id !== highlightId);
    setHighlights(newHighlights);
    saveHighlights(newHighlights);
    
    // 直接移除DOM中的高亮元素
    const highlightElements = containerRef.current?.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
    highlightElements?.forEach(element => element.remove());
  }, [highlights, scale, pdfDoc]);
  
  // 保存高亮数据到 localStorage
  const saveHighlights = useCallback((highlightsToSave: Highlight[]) => {
    const fileKey = `pdf-highlights-${file?.split('/').pop()?.replace('.pdf', '') || 'unknown'}`;
    localStorage.setItem(fileKey, JSON.stringify(highlightsToSave));
  }, [file]);
  
  // 清除当前页面所有高亮
  const clearCurrentPageHighlights = useCallback((pageNum: number) => {
    console.log(`清除页面 ${pageNum} 的高亮`);
    console.log('当前高亮列表:', highlights);
    
    const pageHighlights = highlights.filter(h => h.pageNum === pageNum);
    console.log(`页面 ${pageNum} 的高亮数量:`, pageHighlights.length);
    
    if (pageHighlights.length === 0) {
      console.log('没有高亮需要清除');
      return;
    }
    
    const newHighlights = highlights.filter(h => h.pageNum !== pageNum);
    console.log('清除后的高亮列表:', newHighlights);
    
    setHighlights(newHighlights);
    saveHighlights(newHighlights);
    
    // 直接清除DOM中的高亮元素
    const allHighlightElements = containerRef.current?.querySelectorAll(`[data-page-num="${pageNum}"] .highlight-rect`);
    console.log(`找到 ${allHighlightElements?.length || 0} 个高亮元素`);
    
    allHighlightElements?.forEach((element, index) => {
      console.log(`移除高亮元素 ${index}`);
      element.remove();
    });
    
    // 也清除高亮层
    const highlightLayers = containerRef.current?.querySelectorAll(`[data-page-num="${pageNum}"] .highlight-layer`);
    highlightLayers?.forEach(layer => {
      console.log('移除高亮层');
      layer.remove();
    });
    
    console.log(`页面 ${pageNum} 高亮清除完成`);
  }, [highlights, saveHighlights]);
  
  // 加载高亮数据
  const loadHighlights = useCallback(() => {
    const fileKey = `pdf-highlights-${file?.split('/').pop()?.replace('.pdf', '') || 'unknown'}`;
    const saved = localStorage.getItem(fileKey);
    if (saved) {
      try {
        const parsedHighlights = JSON.parse(saved) as Highlight[];
        setHighlights(parsedHighlights);
      } catch (err) {
        console.error('加载高亮数据失败:', err);
      }
    }
  }, [file]);
  
  // 优化点击外部区域的处理 - 修复长文本拖拽后弹窗不消失问题
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (showColorPicker && !target.closest('.color-picker')) {
        // 检查是否点击在文本层内，但如果没有当前选择，总是清除弹窗
        const isTextLayerClick = target.closest('.textLayer');
        const currentSelection = window.getSelection();
        const hasActiveSelection = currentSelection && !currentSelection.isCollapsed;
        
        // 如果没有活动选择或点击在文本层外，清除弹窗
        if (!hasActiveSelection || !isTextLayerClick) {
          setTimeout(() => {
            setShowColorPicker(false);
            setSelectedText('');
            if (currentSelection) {
              currentSelection.removeAllRanges();
            }
          }, 50); // 缩短延迟时间，提高响应性
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showColorPicker]);
  
  
  // 加载高亮数据
  useEffect(() => {
    if (file) {
      loadHighlights();
    }
  }, [file, loadHighlights]);

  
  // 获取当前可见页面
  const getCurrentVisiblePage = useCallback(() => {
    if (!viewerRef.current || !containerRef.current) return 1;
    
    const viewerRect = viewerRef.current.getBoundingClientRect();
    const viewerCenter = viewerRect.top + viewerRect.height / 2;
    
    let closestPage = 1;
    let closestDistance = Infinity;
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pageElement = containerRef.current.querySelector(`.pdf-page[data-page-num="${pageNum}"]`);
      if (pageElement) {
        const pageRect = pageElement.getBoundingClientRect();
        const pageCenter = pageRect.top + pageRect.height / 2;
        const distance = Math.abs(pageCenter - viewerCenter);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = pageNum;
        }
      }
    }
    
    return closestPage;
  }, [numPages]);
  
  // 监听滚动更新当前页面
  useEffect(() => {
    if (!viewerRef.current) return;
    
    const handleScroll = () => {
      const visiblePage = getCurrentVisiblePage();
      setCurrentVisiblePage(visiblePage);
    };
    
    const viewer = viewerRef.current;
    viewer.addEventListener('scroll', handleScroll);
    
    // 初始化当前页面
    setTimeout(handleScroll, 100);
    
    return () => {
      viewer.removeEventListener('scroll', handleScroll);
    };
  }, [getCurrentVisiblePage]);

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0)); // 增大缩放步长，减少点击次数
    setIsUserScale(true); // 标记为用户手动缩放
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5)); // 增大缩放步长，减少点击次数
    setIsUserScale(true); // 标记为用户手动缩放
  };

  // 创建稳定的fitToWidth引用
  const fitToWidthRef = useRef(fitToWidth);
  useEffect(() => {
    fitToWidthRef.current = fitToWidth;
  }, [fitToWidth]);

  // 监听容器尺寸变化，只在非用户手动缩放时自动重新适配
  useEffect(() => {
    if (!pdfDoc || !viewerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      // 只在非用户手动缩放时才自动适应
      if (!isUserScale) {
        // 延迟执行，避免频繁调用
        setTimeout(() => {
          fitToWidthRef.current();
        }, 100);
      }
    });

    resizeObserver.observe(viewerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [pdfDoc, isUserScale]);

  // 强制渲染当前可见的页面
  const forceRenderVisiblePages = () => {
    if (!viewerRef.current || !containerRef.current) return;
    
    const viewerRect = viewerRef.current.getBoundingClientRect();
    const pageContainers = containerRef.current.querySelectorAll('.pdf-page');
    
    pageContainers.forEach(pageElement => {
      const pageRect = pageElement.getBoundingClientRect();
      const isVisible = pageRect.bottom > viewerRect.top && pageRect.top < viewerRect.bottom;
      
      if (isVisible) {
        const pageNum = parseInt(pageElement.getAttribute('data-page-num') || '0');
        if (pageNum > 0) {
          renderPage(pageNum, true); // 强制重新渲染
        }
      }
    });
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
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* 控制栏 */}
      <div className="flex justify-between items-center p-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              onClick={() => scrollToPage(Math.max(1, currentVisiblePage - 1))}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft size={14} />
            </Button>
            
            <Button
              onClick={() => scrollToPage(Math.min(numPages, currentVisiblePage + 1))}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={numPages}
              value={currentVisiblePage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= numPages) {
                  scrollToPage(page);
                  setCurrentVisiblePage(page);
                }
              }}
              className="w-12 h-8 text-center text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">/ {numPages}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={zoomOut}
            variant="outline"
            size="sm"
            disabled={scale <= 0.5}
            className="h-8 w-8 p-0"
          >
            <ZoomOut size={14} />
          </Button>
          
          <input
            type="number"
            min="50"
            max="300"
            value={Math.round(scale * 100)}
            onChange={(e) => {
              const percentage = parseInt(e.target.value);
              if (percentage >= 50 && percentage <= 300) {
                setScale(percentage / 100);
                setIsUserScale(true); // 标记为用户手动缩放
              }
            }}
            className="w-16 h-8 text-center text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-100"
          />
          <span className="text-xs text-gray-600">%</span>
          
          <Button
            onClick={fitToWidth}
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
            title="适应宽度"
          >
            适应
          </Button>
          
          <Button
            onClick={zoomIn}
            variant="outline"
            size="sm"
            disabled={scale >= 2.5}
            className="h-8 w-8 p-0"
          >
            <ZoomIn size={14} />
          </Button>
        </div>
      </div>
      
      {/* PDF内容区域 */}
      <div 
        ref={viewerRef}
        className="flex-1 overflow-y-auto bg-gray-100"
        style={{ 
          overflowX: 'auto',
          scrollBehavior: 'smooth'
        }}
      >
        <div 
          ref={containerRef}
          className="py-4"
          style={{
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* 页面将由renderAllPages动态添加 */}
        </div>
      </div>
      
      {/* 颜色选择器 */}
      {(() => {
        console.log('渲染检查 - showColorPicker:', showColorPicker, 'colorPickerPosition:', colorPickerPosition);
        return showColorPicker && colorPickerPosition;
      })() && (
        <div 
          className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-300 color-picker"
          style={{ 
            left: `${colorPickerPosition.x}px`, 
            top: `${colorPickerPosition.y}px`,
            width: '320px',
            maxHeight: '200px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 选中文本预览 */}
          <div className="p-3 border-b border-gray-100">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <span>📝</span> 选中文本
            </div>
            <div className="text-sm text-gray-700 max-h-12 overflow-y-auto bg-gray-50 rounded px-2 py-1">
              "{selectedText.slice(0, 60)}{selectedText.length > 60 ? '...' : ''}"
            </div>
          </div>
          
          {/* 颜色选择区域 */}
          <div className="p-3">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <span>🎨</span> 选择高亮颜色
            </div>
            <div className="grid grid-cols-7 gap-2 mb-3">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  className="group relative w-8 h-8 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:scale-105 transition-all duration-150 flex items-center justify-center shadow-sm hover:shadow-md"
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color)}
                  title={`${color.name}高亮`}
                >
                  <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">✓</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 快捷操作按钮 */}
          <div className="border-t border-gray-100 p-3">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <span>✨</span> AI功能
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                className="px-2 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors border border-blue-200 hover:border-blue-300 font-medium"
                onClick={() => {
                  if (onTextSelect) onTextSelect(selectedText, 'explain');
                  // 延迟清除选择，避免影响AI处理
                  setTimeout(() => {
                    setShowColorPicker(false);
                    setSelectedText('');
                    window.getSelection()?.removeAllRanges();
                  }, 100);
                }}
              >
                🔍 解释
              </button>
              <button
                className="px-2 py-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded transition-colors border border-green-200 hover:border-green-300 font-medium"
                onClick={() => {
                  if (onTextSelect) onTextSelect(selectedText, 'summarize');
                  setTimeout(() => {
                    setShowColorPicker(false);
                    setSelectedText('');
                    window.getSelection()?.removeAllRanges();
                  }, 100);
                }}
              >
                📝 总结
              </button>
              <button
                className="px-2 py-1.5 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded transition-colors border border-purple-200 hover:border-purple-300 font-medium"
                onClick={() => {
                  if (onTextSelect) onTextSelect(selectedText, 'rewrite');
                  setTimeout(() => {
                    setShowColorPicker(false);
                    setSelectedText('');
                    window.getSelection()?.removeAllRanges();
                  }, 100);
                }}
              >
                ✏️ 改写
              </button>
            </div>
          </div>
          
          {/* 关闭按钮 */}
          <button
            className="absolute top-1 right-1 w-5 h-5 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors text-xs"
            onClick={() => {
              setTimeout(() => {
                setShowColorPicker(false);
                setSelectedText('');
                window.getSelection()?.removeAllRanges();
              }, 50);
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* 高亮管理信息 */}
      {highlights.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm z-40">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <span className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></span>
            已高亮: <span className="font-semibold text-blue-600">{highlights.length}</span> 处
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span>💱</span> 右击高亮区域可删除
          </div>
          {highlights.length >= 10 && (
            <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <span>⚠️</span> 高亮较多，可能影响性能
            </div>
          )}
        </div>
      )}
    </div>
  );
});

InteractivePDFViewer.displayName = 'InteractivePDFViewer';

export default InteractivePDFViewer;