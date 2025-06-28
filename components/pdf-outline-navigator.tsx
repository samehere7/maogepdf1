"use client"

import React, { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, FileText, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OutlineItem {
  title: string;
  dest: any;
  items?: OutlineItem[];
  pageNumber?: number;
  level: number;
}

interface PDFOutlineNavigatorProps {
  outline: OutlineItem[];
  currentPage: number;
  onJumpToPage: (pageNumber: number) => void;
  className?: string;
}

interface OutlineItemProps {
  item: OutlineItem;
  currentPage: number;
  onJumpToPage: (pageNumber: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const OutlineItemComponent: React.FC<OutlineItemProps> = ({
  item,
  currentPage,
  onJumpToPage,
  isExpanded,
  onToggleExpand
}) => {
  const hasChildren = item.items && item.items.length > 0;
  const isCurrentPage = item.pageNumber === currentPage;
  const [expandedChildren, setExpandedChildren] = useState<Set<number>>(new Set());

  // 计算缩进
  const indentLevel = Math.min(item.level, 4); // 最多4级缩进
  const paddingLeft = 8 + indentLevel * 16;

  const handleClick = () => {
    if (item.pageNumber) {
      onJumpToPage(item.pageNumber);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand();
  };

  const toggleChildExpanded = (index: number) => {
    const newExpanded = new Set(expandedChildren);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChildren(newExpanded);
  };

  return (
    <div>
      {/* 主项目 */}
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer transition-all duration-200 text-sm group",
          isCurrentPage 
            ? "bg-purple-100 text-purple-800 font-medium shadow-sm" 
            : "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
          !item.pageNumber && "cursor-default opacity-60"
        )}
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        {/* 展开/收起按钮 */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        
        {/* 如果没有子项，显示占位图标 */}
        {!hasChildren && (
          <div className="w-4 h-4 flex items-center justify-center">
            <Hash className="h-2.5 w-2.5 text-gray-400" />
          </div>
        )}

        {/* 标题 */}
        <span className="flex-1 truncate pr-2" title={item.title}>
          {item.title}
        </span>

        {/* 页码 */}
        {item.pageNumber && (
          <span className={cn(
            "flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-mono",
            isCurrentPage 
              ? "bg-purple-200 text-purple-700" 
              : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
          )}>
            {item.pageNumber}
          </span>
        )}
      </div>

      {/* 子项目 */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {item.items!.map((child, index) => (
            <OutlineItemComponent
              key={index}
              item={child}
              currentPage={currentPage}
              onJumpToPage={onJumpToPage}
              isExpanded={expandedChildren.has(index)}
              onToggleExpand={() => toggleChildExpanded(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function PDFOutlineNavigator({ 
  outline, 
  currentPage, 
  onJumpToPage,
  className 
}: PDFOutlineNavigatorProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // 自动展开包含当前页面的项目
  useEffect(() => {
    const findItemWithPage = (items: OutlineItem[], targetPage: number): number[] => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // 检查当前项是否匹配
        if (item.pageNumber === targetPage) {
          return [i];
        }
        
        // 递归检查子项
        if (item.items) {
          const childPath = findItemWithPage(item.items, targetPage);
          if (childPath.length > 0) {
            return [i, ...childPath];
          }
        }
      }
      return [];
    };

    const pathToCurrentPage = findItemWithPage(outline, currentPage);
    if (pathToCurrentPage.length > 0) {
      // 展开包含当前页面的顶级项目
      setExpandedItems(prev => new Set([...prev, pathToCurrentPage[0]]));
    }
  }, [currentPage, outline]);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  if (!outline || outline.length === 0) {
    return (
      <div className={cn("p-4 text-center", className)}>
        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">此PDF没有目录信息</p>
        <p className="text-xs text-gray-400 mt-1">无法提取书签或目录结构</p>
      </div>
    );
  }

  return (
    <div className={cn("pdf-outline-navigator", className)}>
      {/* 标题 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <FileText className="h-4 w-4 text-gray-600" />
        <span className="font-medium text-gray-800 text-sm">PDF目录</span>
        <span className="text-xs text-gray-500">({outline.length}项)</span>
      </div>

      {/* 目录项列表 */}
      <div className="p-2 max-h-96 overflow-y-auto">
        {outline.map((item, index) => (
          <OutlineItemComponent
            key={index}
            item={item}
            currentPage={currentPage}
            onJumpToPage={onJumpToPage}
            isExpanded={expandedItems.has(index)}
            onToggleExpand={() => toggleExpanded(index)}
          />
        ))}
      </div>

      {/* 说明 */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          点击目录项可快速跳转到对应页面
        </p>
      </div>
    </div>
  );
}