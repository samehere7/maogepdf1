"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

interface InteractivePDFViewerProps {
  file: string | null;
  onTextSelect?: (text: string, action: 'explain' | 'summarize' | 'rewrite') => void;
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

export default function InteractivePDFViewer({ file, onTextSelect }: InteractivePDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);
  const [scale, setScale] = useState(1.0);
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

  // 加载PDF文件
  useEffect(() => {
    if (!file) return;
    
    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const fullUrl = file.startsWith('http') ? file : 
                      (typeof window !== 'undefined' ? `${window.location.origin}${file}` : file);
        
        console.log('开始加载PDF文件:', fullUrl);
        
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log('PDF文件加载成功，大小:', arrayBuffer.byteLength, '字节');
        
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log('PDF文档加载成功，页数:', doc.numPages);
        
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setError(null);
      } catch (err) {
        console.error('PDF文件加载错误:', err);
        setError('无法加载PDF文件: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [file]);

  // 渲染单个PDF页面
  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !containerRef.current || renderedPages.has(pageNum)) return;

    const container = containerRef.current;
    const pageContainer = container.querySelector(`.pdf-page[data-page-num="${pageNum}"]`) as HTMLElement;
    if (!pageContainer) return;

    try {
      console.log(`渲染页面 ${pageNum}`);
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      // 设置页面容器样式
      pageContainer.style.position = 'relative';
      pageContainer.style.width = `${viewport.width}px`;
      pageContainer.style.height = `${viewport.height}px`;
      pageContainer.style.margin = '0 auto 10px';
      pageContainer.style.border = '1px solid #e5e7eb';
      pageContainer.style.backgroundColor = 'white';
      pageContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      
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
      
      // 渲染PDF页面到canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      pageContainer.appendChild(canvas);
      
      // 渲染文本层
      await renderTextLayer(page, viewport, pageContainer, pageNum);
      
      // 渲染高亮层
      renderHighlights(pageContainer, pageNum, viewport);
      
      // 标记为已渲染
      setRenderedPages(prev => new Set([...prev, pageNum]));
      
    } catch (err) {
      console.error(`页面${pageNum}渲染错误:`, err);
      pageContainer.innerHTML = `<div class="text-red-500 p-4 text-center">加载页面 ${pageNum} 失败</div>`;
    }
  };
  
  // 渲染所有页面
  const renderAllPages = async () => {
    if (!pdfDoc || !containerRef.current) return;
    
    const container = containerRef.current;
    container.innerHTML = '';
    
    // 创建所有页面容器
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pageContainer = document.createElement('div');
      pageContainer.className = 'pdf-page-container';
      pageContainer.setAttribute('data-page-num', pageNum.toString());
      pageContainer.style.marginBottom = '10px';
      
      // 添加页面编号
      const pageLabel = document.createElement('div');
      pageLabel.className = 'page-label';
      pageLabel.style.textAlign = 'center';
      pageLabel.style.padding = '8px';
      pageLabel.style.fontSize = '12px';
      pageLabel.style.color = '#666';
      pageLabel.style.backgroundColor = '#f9f9f9';
      pageLabel.style.borderBottom = '1px solid #e5e7eb';
      pageLabel.textContent = `第 ${pageNum} 页`;
      
      const pageContent = document.createElement('div');
      pageContent.className = 'pdf-page';
      pageContent.setAttribute('data-page-num', pageNum.toString());
      
      pageContainer.appendChild(pageLabel);
      pageContainer.appendChild(pageContent);
      container.appendChild(pageContainer);
      
      // 立即渲染前几页，其余页面懒加载
      if (pageNum <= 3) {
        await renderPage(pageNum);
      }
    }
    
    // 设置懒加载
    setupLazyLoading();
  };
  
  // 设置懒加载
  const setupLazyLoading = () => {
    if (!viewerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageElement = entry.target as HTMLElement;
            const pageNum = parseInt(pageElement.getAttribute('data-page-num') || '0');
            if (pageNum > 0 && !renderedPages.has(pageNum)) {
              renderPage(pageNum);
            }
          }
        });
      },
      {
        root: viewerRef.current,
        rootMargin: '200px',
        threshold: 0.1
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
      
      // 强制设置选择样式，防止重影 - 使用唯一ID确保样式生效
      const uniqueId = `text-layer-${pageNum}-${Date.now()}`;
      textLayerDiv.id = uniqueId;
      
      const selectionStyle = document.createElement('style');
      selectionStyle.textContent = `
        #${uniqueId} ::selection {
          background: rgba(0, 123, 255, 0.12) !important;
          color: inherit !important;
          text-shadow: none !important;
        }
        #${uniqueId} ::-moz-selection {
          background: rgba(0, 123, 255, 0.12) !important;
          color: inherit !important;
          text-shadow: none !important;
        }
        #${uniqueId} span {
          background: transparent !important;
          background-color: transparent !important;
          outline: none !important;
          text-shadow: none !important;
          box-shadow: none !important;
        }
      `;
      document.head.appendChild(selectionStyle);
      
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
        
        // 处理旋转
        if (angle !== 0) {
          span.style.transform = `rotate(${angle}rad)`;
        }
        
        span.textContent = item.str;
        span.setAttribute('data-text-index', index.toString());
        span.setAttribute('data-page-num', pageNum.toString());
        
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

  // 渲染所有页面
  useEffect(() => {
    if (pdfDoc && numPages > 0) {
      setRenderedPages(new Set()); // 重置已渲染页面
      renderAllPages();
    }
  }, [pdfDoc, numPages, scale]);
  
  // 更新高亮
  useEffect(() => {
    if (highlights.length > 0 && pdfDoc) {
      // 重新渲染所有已渲染页面的高亮
      renderedPages.forEach(pageNum => {
        const pageContainer = containerRef.current?.querySelector(`.pdf-page[data-page-num="${pageNum}"]`) as HTMLElement;
        if (pageContainer) {
          const page = pdfDoc.getPage(pageNum).then(page => {
            const viewport = page.getViewport({ scale });
            renderHighlights(pageContainer, pageNum, viewport);
          });
        }
      });
    }
  }, [highlights, renderedPages, scale]);

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

  // 添加PDF.js官方的选择事件处理 - 简化版本
  const addPdfJsSelectionEvents = useCallback((textLayerDiv: HTMLElement, pageNum: number) => {
    let isMouseDown = false;
    let startTime = 0;
    let startPos = { x: 0, y: 0 };
    let hasSelection = false;
    
    // 鼠标按下事件
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      startTime = Date.now();
      startPos = { x: e.clientX, y: e.clientY };
      hasSelection = false;
      textLayerDiv.classList.add('selecting');
      
      console.log('鼠标按下，开始选择');
    };
    
    // 鼠标移动事件 - 检测是否开始拖拽
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      
      const distance = Math.sqrt(
        Math.pow(e.clientX - startPos.x, 2) + Math.pow(e.clientY - startPos.y, 2)
      );
      
      // 如果移动距离超过5px，认为开始拖拽选择
      if (distance > 5) {
        hasSelection = true;
        console.log('检测到拖拽选择');
      }
    };
    
    // 鼠标抬起事件
    const handleMouseUp = (e: MouseEvent) => {
      if (!isMouseDown) return;
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const distance = Math.sqrt(
        Math.pow(e.clientX - startPos.x, 2) + Math.pow(e.clientY - startPos.y, 2)
      );
      
      textLayerDiv.classList.remove('selecting');
      isMouseDown = false;
      
      console.log('鼠标抬起，持续时间:', duration, 'ms，移动距离:', distance, 'px');
      
      // 判断是否为点击（而非拖拽）
      const isClick = duration < 300 && distance < 5;
      
      if (isClick) {
        // 点击事件：选择整个单词或span
        const target = e.target as HTMLElement;
        if (target.tagName === 'SPAN' && target.closest('.textLayer')) {
          const span = target;
          const textContent = span.textContent?.trim();
          
          if (textContent && textContent.length > 0) {
            console.log('单击选择文本:', textContent);
            
            // 延迟执行，确保不干扰原生选择
            setTimeout(() => {
              // 清除现有选择
              window.getSelection()?.removeAllRanges();
              
              // 创建新的选择范围
              const range = document.createRange();
              range.selectNodeContents(span);
              
              const selection = window.getSelection();
              if (selection) {
                selection.addRange(range);
                console.log('单击选择完成');
              }
            }, 10);
          }
        }
      } else if (hasSelection) {
        // 拖拽选择结束，延迟检查选择状态
        console.log('拖拽选择结束，检查选择状态');
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection && !selection.isCollapsed) {
            const selectedText = selection.toString().trim();
            console.log('拖拽选择的内容:', selectedText);
            
            // 不要手动触发 selectionchange 事件，这可能导致冲突
            // 让自然的选择处理机制工作
            console.log('保持选择状态，等待自然处理');
          } else {
            console.log('拖拽结束后没有选择内容');
          }
        }, 20);
      }
    };
    
    textLayerDiv.addEventListener('mousedown', handleMouseDown);
    textLayerDiv.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 返回清理函数
    return () => {
      textLayerDiv.removeEventListener('mousedown', handleMouseDown);
      textLayerDiv.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  
  // PDF.js官方的选择监听机制 - 强化版本
  useEffect(() => {
    let selectionTimeout: NodeJS.Timeout | null = null;
    let lastSelectionText = '';
    let processingSelection = false;
    let isMouseOperationActive = false;
    
    const processSelection = () => {
      if (processingSelection) return;
      processingSelection = true;
      
      // 如果鼠标操作还在进行中，延迟处理
      if (isMouseOperationActive) {
        setTimeout(() => {
          processingSelection = false;
          processSelection();
        }, 100);
        return;
      }
      
      setTimeout(() => {
        const selection = window.getSelection();
        
        console.log('处理选择，当前选择状态:', {
          hasSelection: !!selection,
          isCollapsed: selection?.isCollapsed,
          text: selection?.toString()
        });
        
        if (!selection || selection.isCollapsed) {
          // 延迟检查，给选择操作更多时间
          setTimeout(() => {
            const delayedSelection = window.getSelection();
            if (!delayedSelection || delayedSelection.isCollapsed) {
              console.log('确认没有选择，隐藏颜色选择器');
              setShowColorPicker(false);
              setSelectedText('');
              lastSelectionText = '';
              
              // 清除所有选中样式
              const allSelected = containerRef.current?.querySelectorAll('span.selected');
              allSelected?.forEach(span => span.classList.remove('selected'));
            }
          }, 100);
          processingSelection = false;
          return;
        }
        
        const selectedText = selection.toString().trim();
        if (!selectedText || selectedText.length < 1) {
          console.log('选择的文本为空');
          setShowColorPicker(false);
          processingSelection = false;
          return;
        }
        
        // 检查是否是新的选择（避免重复处理）
        if (selectedText === lastSelectionText) {
          console.log('相同的选择，跳过处理');
          processingSelection = false;
          return;
        }
        lastSelectionText = selectedText;
        
        // 检查选择是否在PDF文本层内
        try {
          const range = selection.getRangeAt(0);
          const startElement = range.startContainer.nodeType === Node.TEXT_NODE 
            ? range.startContainer.parentElement 
            : range.startContainer as Element;
            
          const textLayer = startElement?.closest('.textLayer');
          if (!textLayer) {
            console.log('选择不在PDF文本层内');
            processingSelection = false;
            return; // 不在PDF文本层内的选择
          }
          
          console.log('✓ 检测到有效的PDF文本选择:', selectedText);
          setSelectedText(selectedText);
          
          // 获取选择范围的位置
          const rect = range.getBoundingClientRect();
          const viewerRect = viewerRef.current?.getBoundingClientRect();
          
          if (viewerRect && rect.width > 0 && rect.height > 0) {
            console.log('✓ 显示颜色选择器，位置:', { 
              rectWidth: rect.width, 
              rectHeight: rect.height,
              rectTop: rect.top,
              rectLeft: rect.left
            });
            
            // 使用优化的位置计算，显示在选中内容上方
            const position = calculateOptimalPosition(rect, viewerRect);
            console.log('✓ 计算的位置:', position);
            
            setColorPickerPosition(position);
            setShowColorPicker(true);
            
            // 强制重新渲染以确保状态更新
            setTimeout(() => {
              console.log('强制检查选择器状态:', { 
                showColorPicker: true, 
                hasPosition: !!position,
                actualState: { showColorPicker, colorPickerPosition }
              });
            }, 100);
          } else {
            console.log('选择区域无效，rect:', { width: rect.width, height: rect.height });
          }
        } catch (error) {
          console.error('处理选择时出错:', error);
        }
        
        processingSelection = false;
      }, 10);
    };
    
    const handleSelectionChange = () => {
      console.log('selectionchange事件触发');
      
      // 清除之前的延时器
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      
      // 延迟处理选择变化
      selectionTimeout = setTimeout(processSelection, 30);
    };
    
    // 添加多个事件监听，确保不遗漏选择
    const handleMouseUp = (e: MouseEvent) => {
      console.log('全局mouseup事件触发');
      setTimeout(processSelection, 50);
    };
    
    const handleTouchEnd = () => {
      console.log('touchend事件触发');
      setTimeout(processSelection, 50);
    };
    
    // 跟踪鼠标操作状态
    const handleGlobalMouseDown = () => {
      isMouseOperationActive = true;
      console.log('全局鼠标按下，设置操作状态为活跃');
    };
    
    const handleGlobalMouseUp = (e: MouseEvent) => {
      console.log('全局mouseup事件触发');
      // 延迟清除鼠标操作状态，给选择处理更多时间
      setTimeout(() => {
        isMouseOperationActive = false;
        console.log('清除鼠标操作状态');
        // 在鼠标操作结束后触发选择处理
        setTimeout(processSelection, 50);
      }, 200);
    };
    
    // 使用多种事件确保选择被正确检测
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mousedown', handleGlobalMouseDown);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    
    // 初始检查
    setTimeout(processSelection, 100);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mousedown', handleGlobalMouseDown);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
    };
  }, [calculateOptimalPosition]);
  
  // 处理颜色选择 - 使用标准window.getSelection()
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
      
      // 获取选中范围的矩形信息 - 使用PDF.js坐标系统
      const rects = range.getClientRects();
      const textLayer = pageElement.querySelector('.textLayer') as HTMLElement;
      
      if (!textLayer) {
        console.error('未找到textLayer');
        return;
      }
      
      const textLayerRect = textLayer.getBoundingClientRect();
      const pageWidth = textLayerRect.width;
      const pageHeight = textLayerRect.height;
      
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (rect.width > 0 && rect.height > 0) {
          // 转换为相对于textLayer的百分比坐标（与文本使用相同的坐标系）
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
        }
      }
      
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
      }, 500);
    }
  }, [selectedText, highlights, scale, pdfDoc]);
  
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
  
  // 点击其他地方关闭颜色选择器
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (showColorPicker && !target.closest('.color-picker')) {
        // 延迟清除，避免干扰正在进行的选择操作
        setTimeout(() => {
          setShowColorPicker(false);
          setSelectedText('');
          window.getSelection()?.removeAllRanges();
          
          // 清除所有选中样式
          const allSelected = containerRef.current?.querySelectorAll('span.selected');
          allSelected?.forEach(span => span.classList.remove('selected'));
        }, 50);
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

  // 滚动到指定页面
  const scrollToPage = (pageNum: number) => {
    const pageElement = containerRef.current?.querySelector(`.pdf-page[data-page-num="${pageNum}"]`);
    if (pageElement && viewerRef.current) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
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
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.6));
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
          
          <span className="px-2 py-1 bg-gray-100 rounded text-xs min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
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
}