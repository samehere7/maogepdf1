"use client"

import React, { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, FileText, Hash, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OutlineItem {
  title: string
  dest: any
  items?: OutlineItem[]
  pageNumber?: number
  level: number
}

interface PdfOutlineSidebarProps {
  outline: OutlineItem[]
  currentPage: number
  onJumpToPage: (pageNumber: number) => void
  className?: string
}

interface OutlineItemProps {
  item: OutlineItem
  currentPage: number
  onJumpToPage: (pageNumber: number) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

const OutlineItemComponent: React.FC<OutlineItemProps> = ({
  item,
  currentPage,
  onJumpToPage,
  isExpanded,
  onToggleExpand
}) => {
  const hasChildren = item.items && item.items.length > 0
  const isCurrentPage = item.pageNumber === currentPage
  const [expandedChildren, setExpandedChildren] = useState<Set<number>>(new Set())

  // 计算缩进 - 更紧凑的层级显示
  const indentLevel = Math.min(item.level, 3) // 最多3级缩进
  const paddingLeft = 8 + indentLevel * 12

  const handleClick = () => {
    if (item.pageNumber) {
      onJumpToPage(item.pageNumber)
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleExpand()
  }

  const toggleChildExpanded = (index: number) => {
    const newExpanded = new Set(expandedChildren)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedChildren(newExpanded)
  }

  return (
    <div className="outline-item">
      {/* 主项目 */}
      <div
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2 rounded cursor-pointer transition-all duration-150 text-xs group hover:bg-gray-100",
          isCurrentPage 
            ? "bg-purple-50 text-purple-800 font-medium border-l-2 border-purple-400" 
            : "text-gray-700 hover:text-gray-900",
          !item.pageNumber && "cursor-default opacity-70"
        )}
        style={{ paddingLeft }}
        onClick={handleClick}
        title={item.title}
      >
        {/* 展开/收起按钮 */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200 transition-colors"
            aria-label={isExpanded ? "收起" : "展开"}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        
        {/* 层级图标 */}
        {!hasChildren && (
          <div className="w-4 h-4 flex items-center justify-center">
            <Hash className="h-2 w-2 text-gray-400" />
          </div>
        )}

        {/* 标题 */}
        <span className="flex-1 truncate text-left leading-tight" title={item.title}>
          {item.title}
        </span>

        {/* 页码 */}
        {item.pageNumber && (
          <span className={cn(
            "flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-mono min-w-[1.5rem] text-center",
            isCurrentPage 
              ? "bg-purple-100 text-purple-700" 
              : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
          )}>
            {item.pageNumber}
          </span>
        )}
      </div>

      {/* 子项目 */}
      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {item.items!.map((child, index) => (
            <OutlineItemComponent
              key={`${child.title}-${index}`}
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
  )
}

export default function PdfOutlineSidebar({ 
  outline, 
  currentPage, 
  onJumpToPage,
  className 
}: PdfOutlineSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  // 自动展开包含当前页面的项目
  useEffect(() => {
    const findItemWithPage = (items: OutlineItem[], targetPage: number): number[] => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        
        // 检查当前项是否匹配
        if (item.pageNumber === targetPage) {
          return [i]
        }
        
        // 递归检查子项
        if (item.items) {
          const childPath = findItemWithPage(item.items, targetPage)
          if (childPath.length > 0) {
            return [i, ...childPath]
          }
        }
      }
      return []
    }

    const pathToCurrentPage = findItemWithPage(outline, currentPage)
    if (pathToCurrentPage.length > 0) {
      // 展开包含当前页面的顶级项目
      setExpandedItems(prev => new Set([...prev, pathToCurrentPage[0]]))
    }
  }, [currentPage, outline])

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  if (!outline || outline.length === 0) {
    return (
      <div className={cn("p-3 text-center bg-gray-50", className)}>
        <BookOpen className="h-6 w-6 text-gray-400 mx-auto mb-2" />
        <p className="text-xs text-gray-500 font-medium">暂无目录</p>
        <p className="text-xs text-gray-400 mt-1">此PDF没有目录结构</p>
      </div>
    )
  }

  return (
    <div className={cn("pdf-outline-sidebar bg-white border-r border-gray-200", className)}>
      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <BookOpen className="h-4 w-4 text-gray-600" />
        <span className="font-medium text-gray-800 text-sm">目录</span>
        <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
          {outline.length}
        </span>
      </div>

      {/* 目录列表 */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {outline.map((item, index) => (
          <OutlineItemComponent
            key={`${item.title}-${index}`}
            item={item}
            currentPage={currentPage}
            onJumpToPage={onJumpToPage}
            isExpanded={expandedItems.has(index)}
            onToggleExpand={() => toggleExpanded(index)}
          />
        ))}
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          点击标题跳转页面，当前第{currentPage}页
        </p>
      </div>
    </div>
  )
}