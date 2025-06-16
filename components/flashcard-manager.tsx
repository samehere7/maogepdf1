"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Plus, Edit, Trash2 } from "lucide-react"

interface Flashcard {
  id: string
  question: string
  answer: string
  difficulty: number
  page_number?: number
  review_count: number
  last_reviewed_at?: string
}

interface FlashcardStats {
  total: number
  new: number
  easy: number
  medium: number
  hard: number
}

interface FlashcardManagerProps {
  pdfId: string
  pdfName: string
  onBack: () => void
  onStartPractice: (flashcards: Flashcard[]) => void
  onAddFlashcard: () => void
}

export default function FlashcardManager({ 
  pdfId, 
  pdfName, 
  onBack, 
  onStartPractice,
  onAddFlashcard 
}: FlashcardManagerProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [stats, setStats] = useState<FlashcardStats>({
    total: 0,
    new: 0,
    easy: 0,
    medium: 0,
    hard: 0
  })
  const [loading, setLoading] = useState(true)

  // 加载闪卡数据
  const loadFlashcards = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/flashcards/${pdfId}`)
      
      if (!response.ok) {
        throw new Error('获取闪卡失败')
      }
      
      const data = await response.json()
      setFlashcards(data.flashcards || [])
      
      // 计算统计信息
      const newStats = data.flashcards.reduce((acc: FlashcardStats, card: Flashcard) => {
        acc.total++
        switch (card.difficulty) {
          case 0:
            acc.new++
            break
          case 1:
            acc.easy++
            break
          case 2:
            acc.medium++
            break
          case 3:
            acc.hard++
            break
        }
        return acc
      }, { total: 0, new: 0, easy: 0, medium: 0, hard: 0 })
      
      setStats(newStats)
      
    } catch (error) {
      console.error('加载闪卡失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlashcards()
  }, [pdfId])

  const handleStartPractice = () => {
    if (flashcards.length > 0) {
      onStartPractice(flashcards)
    }
  }

  const getDifficultyText = (difficulty: number) => {
    switch (difficulty) {
      case 0: return '新'
      case 1: return '容易'
      case 2: return '中等'
      case 3: return '困难'
      default: return '未知'
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 0: return 'bg-gray-100 text-gray-700'
      case 1: return 'bg-green-100 text-green-700'
      case 2: return 'bg-yellow-100 text-yellow-700'
      case 3: return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">{pdfName}</h1>
        </div>
        <div className="text-sm text-gray-500">
          {stats.total} 卡片总数
        </div>
      </div>

      {/* 学习进度 */}
      <div className="p-4 space-y-4">
        <h2 className="font-medium text-gray-900">学习进度</h2>
        
        <div className="space-y-3">
          {/* 新卡片 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">新 (100%)</span>
            <span className="text-sm font-medium">{stats.new} 张卡片</span>
          </div>
          {stats.new > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-400 h-2 rounded-full w-full"></div>
            </div>
          )}

          {/* 容易 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">容易 ({stats.total > 0 ? Math.round((stats.easy / stats.total) * 100) : 0}%)</span>
            <span className="text-sm font-medium text-green-600">
              {stats.easy} 张卡片
              {stats.easy > 0 && <span className="text-green-500 ml-1">(+{stats.easy})</span>}
            </span>
          </div>
          {stats.easy > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(stats.easy / stats.total) * 100}%` }}
              ></div>
            </div>
          )}

          {/* 中等 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">中等 ({stats.total > 0 ? Math.round((stats.medium / stats.total) * 100) : 0}%)</span>
            <span className="text-sm font-medium">{stats.medium} 张卡片</span>
          </div>
          {stats.medium > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(stats.medium / stats.total) * 100}%` }}
              ></div>
            </div>
          )}

          {/* 困难 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">困难 ({stats.total > 0 ? Math.round((stats.hard / stats.total) * 100) : 0}%)</span>
            <span className="text-sm font-medium text-red-600">
              {stats.hard} 张卡片
              {stats.hard > 0 && <span className="text-red-500 ml-1">(-{stats.hard})</span>}
            </span>
          </div>
          {stats.hard > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${(stats.hard / stats.total) * 100}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleStartPractice}
            disabled={flashcards.length === 0}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3"
          >
            <Play className="h-4 w-4 mr-2" />
            开始练习
          </Button>
          <Button
            onClick={onAddFlashcard}
            variant="outline"
            className="px-4 py-3"
          >
            <Plus className="h-4 w-4" />
            添加闪卡
          </Button>
        </div>
      </div>

      {/* 闪卡列表 */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">闪卡列表</h3>
          
          {flashcards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无闪卡，点击"添加闪卡"开始创建
            </div>
          ) : (
            <div className="space-y-2">
              {flashcards.map((card) => (
                <div
                  key={card.id}
                  className="border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        正面
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {card.question}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(card.difficulty)}`}>
                          {getDifficultyText(card.difficulty)}
                        </span>
                        {card.page_number && (
                          <span className="text-xs text-gray-500">
                            页面 {card.page_number}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}