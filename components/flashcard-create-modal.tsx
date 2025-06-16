"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FlashcardCreateModalProps {
  isOpen: boolean
  onClose: () => void
  pdfId: string
  pdfName: string
  onSuccess: (flashcards: any[]) => void
}

type ContentAmount = 'few' | 'medium' | 'many'

export default function FlashcardCreateModal({ 
  isOpen, 
  onClose, 
  pdfId, 
  pdfName, 
  onSuccess 
}: FlashcardCreateModalProps) {
  const [contentAmount, setContentAmount] = useState<ContentAmount>('medium')
  const [pageRange, setPageRange] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const contentOptions = [
    {
      id: 'few' as const,
      title: '少量',
      description: '只包含关键概念',
      icon: '💎'
    },
    {
      id: 'medium' as const,
      title: '适中',
      description: '平衡的选择',
      icon: '⚖️',
      selected: true
    },
    {
      id: 'many' as const,
      title: '较多',
      description: '更详细的闪卡',
      icon: '📚'
    }
  ]

  const handleCreate = async () => {
    try {
      setIsCreating(true)
      
      const response = await fetch('/api/flashcards/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfId,
          contentAmount,
          pageRange: pageRange.trim() || null
        }),
      })

      if (!response.ok) {
        throw new Error('创建闪卡失败')
      }

      const result = await response.json()
      console.log('闪卡创建成功:', result)
      
      onSuccess(result.flashcards || [])
      onClose()
      
    } catch (error) {
      console.error('创建闪卡失败:', error)
      alert('创建闪卡失败，请稍后重试')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 text-center">
            创建闪卡
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-sm text-gray-600 text-center">
            从你的文档即刻生成闪卡一一马上开始学习吧！
          </p>
          
          {/* 内容数量选择 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">内容数量</h3>
            <div className="space-y-2">
              {contentOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => !isCreating && setContentAmount(option.id)}
                  className={`
                    flex items-center p-3 rounded-lg border cursor-pointer transition-all
                    ${contentAmount === option.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="text-lg mr-3">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.title}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                  {contentAmount === option.id && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 页面范围 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">页面（可选）</h3>
            <Input
              placeholder="例如：5-10, 1-3, 7"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              disabled={isCreating}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              留空则创建含所有页面
            </p>
          </div>

          {/* 创建按钮 */}
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
          >
            {isCreating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                创建中...
              </div>
            ) : (
              '创建闪卡'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}