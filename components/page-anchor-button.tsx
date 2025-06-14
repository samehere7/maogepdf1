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
  // 匹配各种页码格式的正则表达式
  const pagePatterns = [
    /【(\d+)】/g,         // 【X】- ChatPDF风格的主要格式
    /（第(\d+)页）/g,     // （第X页）
    /\(第(\d+)页\)/g,     // (第X页)
    /第(\d+)页/g,         // 第X页
    /页码:?\s*(\d+)/g,    // 页码:X 或 页码 X
    /P\.?\s*(\d+)/gi,     // P.X 或 P X
    /Page\s*(\d+)/gi      // Page X
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