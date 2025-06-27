"use client"

import React from 'react';
import { Button } from "@/components/ui/button";

interface PageAnchorButtonProps {
  pageNumber: number;
  onClick: (pageNumber: number) => void;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'xs';
}

export function PageAnchorButton({ 
  pageNumber, 
  onClick, 
  variant = 'outline',
  size = 'xs' 
}: PageAnchorButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => onClick(pageNumber)}
      className={`
        inline-flex items-center justify-center
        min-w-[24px] h-6 
        rounded-full
        text-xs font-medium
        px-2 py-0
        mx-1
        transition-all duration-200
        hover:scale-105 hover:shadow-sm
        bg-blue-50 hover:bg-blue-100 
        text-blue-700 hover:text-blue-800
        border border-blue-200 hover:border-blue-300
        cursor-pointer
        select-none
      `}
      title={`跳转到第${pageNumber}页`}
    >
      {pageNumber}
    </Button>
  );
}

// ChatPDF风格的页码气泡按钮组件 - 用于【X】格式
interface PageBubbleButtonProps {
  pageNumber: number;
  onClick: (pageNumber: number) => void;
}

export function PageBubbleButton({ pageNumber, onClick }: PageBubbleButtonProps) {
  return (
    <span
      className={`
        inline-flex items-center justify-center
        w-6 h-6
        mx-1
        bg-blue-500 hover:bg-blue-600
        text-white text-xs font-semibold
        rounded-full
        cursor-pointer
        transition-all duration-200
        hover:scale-110 hover:shadow-lg
        active:scale-95
        border border-blue-400
        shadow-sm
        select-none
      `}
      onClick={() => onClick(pageNumber)}
      title={`跳转到第${pageNumber}页`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(pageNumber);
        }
      }}
    >
      {pageNumber}
    </span>
  );
}

// 页码高亮按钮组件 - 用于（第X页）格式
interface PageHighlightButtonProps {
  text: string;
  pageNumber: number;
  onClick: (pageNumber: number) => void;
}

function PageHighlightButton({ text, pageNumber, onClick }: PageHighlightButtonProps) {
  return (
    <span
      className={`
        page-highlight-button
        inline-flex items-center
        px-2 py-1
        mx-1
        bg-gradient-to-r from-blue-500 to-blue-600
        hover:from-blue-600 hover:to-blue-700
        text-white text-sm font-semibold
        rounded-lg
        cursor-pointer
        transition-all duration-200
        hover:scale-105 hover:shadow-lg
        active:scale-95
        border border-blue-400
        shadow-md
        select-none
        relative
        overflow-hidden
      `}
      onClick={() => onClick(pageNumber)}
      title={`点击跳转到第${pageNumber}页`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(pageNumber);
        }
      }}
    >
      {/* 高亮背景动画 */}
      <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 hover:opacity-30 transition-opacity duration-200"></span>
      
      {/* 文字内容 */}
      <span className="relative z-10 flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-80">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
        {text}
      </span>
      
      {/* 点击波纹效果 */}
      <span className="absolute inset-0 rounded-lg bg-white opacity-0 scale-0 transition-all duration-300 pointer-events-none click-ripple"></span>
    </span>
  );
}

// 用于渲染包含页码的文本内容
interface PageAnchorTextProps {
  content: string;
  onPageClick: (pageNumber: number) => void;
}

export function PageAnchorText({ content, onPageClick }: PageAnchorTextProps) {
  // 匹配各种页码格式的正则表达式 - 完整多语言支持
  const pagePatterns = [
    // 统一格式（推荐AI使用）
    /【(\d+)】/g,                     // 【X】- 统一格式，所有语言
    
    // 中文格式
    /（第(\d+)页）/g,                 // （第X页）
    /\(第(\d+)页\)/g,                 // (第X页)
    /第(\d+)页/g,                     // 第X页
    /页码:?\s*(\d+)/g,                // 页码:X 或 页码 X
    /第(\d+)頁/g,                     // 第X頁 (繁体)
    
    // 英语格式
    /Page\s*(\d+)/gi,                 // Page X
    /P\.?\s*(\d+)/gi,                 // P.X 或 P X
    /\(Page\s*(\d+)\)/gi,             // (Page X)
    
    // 日语格式
    /(\d+)ページ/g,                    // Xページ
    /ページ\s*(\d+)/g,                 // ページ X
    /\((\d+)ページ\)/g,                // (Xページ)
    /（(\d+)ページ）/g,                // （Xページ）
    
    // 韩语格式
    /(\d+)페이지/g,                    // X페이지
    /페이지\s*(\d+)/g,                 // 페이지 X
    /\((\d+)페이지\)/g,                // (X페이지)
    /（(\d+)페이지）/g,                // （X페이지）
    
    // 西班牙语格式
    /Página\s*(\d+)/gi,               // Página X
    /Pág\.?\s*(\d+)/gi,               // Pág.X 或 Pág X
    /\(Página\s*(\d+)\)/gi,           // (Página X)
    
    // 法语格式
    /Page\s*n°?\s*(\d+)/gi,           // Page 3 或 Page n°3
    /\(Page\s*(\d+)\)/gi,             // (Page X)
    
    // 德语格式
    /Seite\s*(\d+)/gi,                // Seite X
    /S\.?\s*(\d+)/gi,                 // S.X 或 S X
    /\(Seite\s*(\d+)\)/gi,            // (Seite X)
    
    // 意大利语格式
    /Pagina\s*(\d+)/gi,               // Pagina X
    /Pag\.?\s*(\d+)/gi,               // Pag.X
    /\(Pagina\s*(\d+)\)/gi,           // (Pagina X)
    
    // 葡萄牙语格式
    /página\s*(\d+)/gi,               // página X
    /pág\.?\s*(\d+)/gi,               // pág.X
    /\(página\s*(\d+)\)/gi,           // (página X)
    
    // 俄语格式
    /страниц[аеы]?\s*(\d+)/gi,        // страница X / страницы X / страницах X
    /стр\.?\s*(\d+)/gi,               // стр.X
    /\(страниц[аеы]?\s*(\d+)\)/gi,    // (страница X)
    
    // 阿拉伯语格式
    /صفحة\s*(\d+)/g,                   // صفحة X
    /\(صفحة\s*(\d+)\)/g,               // (صفحة X)
    
    // 通用数字格式（作为后备）
    /\[(\d+)\]/g,                     // [X]
    /\((\d+)\)/g                      // (X) - 注意：这个应该放最后，避免误匹配
  ];

  let processedContent = content;
  const replacements: Array<{match: string, pageNumber: number, replacement: string}> = [];

  // 处理每种页码格式
  pagePatterns.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const pageNumber = parseInt(match[1]);
      
      if (!isNaN(pageNumber) && pageNumber > 0) {
        // 生成唯一的占位符，根据格式类型确定样式
        let buttonType = 'NORMAL';
        if (fullMatch.includes('【') && fullMatch.includes('】')) {
          buttonType = 'BUBBLE';  // ChatPDF风格气泡按钮
        } else if (fullMatch.includes('（') || fullMatch.includes('(')) {
          buttonType = 'HIGHLIGHT';  // 高亮按钮
        }
        
        const placeholder = `__PAGE_ANCHOR_${pageNumber}_${patternIndex}_${buttonType}_${Date.now()}__`;
        
        replacements.push({
          match: fullMatch,
          pageNumber,
          replacement: placeholder
        });
      }
    }
  });

  // 如果没有找到页码引用，直接返回原文本
  if (replacements.length === 0) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  // 替换文本中的页码为占位符
  replacements.forEach(({ match, replacement }) => {
    processedContent = processedContent.replace(match, replacement);
  });

  // 将文本分割为数组，包含普通文本和页码按钮
  const parts = processedContent.split(/(__PAGE_ANCHOR_\d+_\d+_(?:BUBBLE|HIGHLIGHT|NORMAL)_\d+__)/);
  
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        // 检查是否是页码占位符
        const placeholderMatch = part.match(/__PAGE_ANCHOR_(\d+)_\d+_(BUBBLE|HIGHLIGHT|NORMAL)_\d+__/);
        
        if (placeholderMatch) {
          const pageNumber = parseInt(placeholderMatch[1]);
          const buttonType = placeholderMatch[2];
          
          if (buttonType === 'BUBBLE') {
            // ChatPDF风格的圆形气泡按钮
            return (
              <PageBubbleButton
                key={`page-bubble-${pageNumber}-${index}`}
                pageNumber={pageNumber}
                onClick={onPageClick}
              />
            );
          } else if (buttonType === 'HIGHLIGHT') {
            // 找到对应的原始文本
            const originalText = replacements.find(r => 
              r.replacement === part
            )?.match || `（第${pageNumber}页）`;
            
            return (
              <PageHighlightButton
                key={`page-highlight-${pageNumber}-${index}`}
                text={originalText}
                pageNumber={pageNumber}
                onClick={onPageClick}
              />
            );
          } else {
            return (
              <PageAnchorButton
                key={`page-${pageNumber}-${index}`}
                pageNumber={pageNumber}
                onClick={onPageClick}
              />
            );
          }
        }
        
        return part;
      })}
    </span>
  );
}