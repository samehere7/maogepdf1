"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Plus, Edit, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from 'next-intl'

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
  initialFlashcards?: Flashcard[]
  onBack: () => void
  onStartPractice: (flashcards: Flashcard[]) => void
  onAddFlashcard: () => void
}

export default function FlashcardManager({ 
  pdfId, 
  pdfName,
  initialFlashcards = [],
  onBack, 
  onStartPractice,
  onAddFlashcard 
}: FlashcardManagerProps) {
  const t = useTranslations('flashcard')
  const tc = useTranslations('common')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [stats, setStats] = useState<FlashcardStats>({
    total: 0,
    new: 0,
    easy: 0,
    medium: 0,
    hard: 0
  })
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [editingQuestion, setEditingQuestion] = useState('')
  const [editingAnswer, setEditingAnswer] = useState('')

  // 从本地存储加载闪卡数据
  const loadFlashcardsLocal = () => {
    try {
      const storageKey = `flashcards_${pdfId}`
      const localData = localStorage.getItem(storageKey)
      
      if (localData) {
        const localFlashcards = JSON.parse(localData)
        console.log('[闪卡管理] 从本地存储加载闪卡:', localFlashcards.length)
        setFlashcards(localFlashcards)
        calculateStats(localFlashcards)
        return localFlashcards
      }
      
      return []
    } catch (error) {
      console.error('[闪卡管理] 本地存储加载失败:', error)
      return []
    }
  }

  // 加载闪卡数据（仅从本地存储加载）
  const loadFlashcards = () => {
    try {
      setLoading(true)
      
      // 从本地存储加载闪卡数据
      const localFlashcards = loadFlashcardsLocal()
      console.log('[闪卡管理] 从本地存储加载闪卡:', localFlashcards.length)
      
    } catch (error) {
      console.error('[闪卡管理] 加载闪卡失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialFlashcards.length > 0) {
      // 如果有传入的闪卡数据，直接使用
      setFlashcards(initialFlashcards)
      calculateStats(initialFlashcards)
      setLoading(false)
    } else {
      // 否则从API加载
      loadFlashcards()
    }
  }, [pdfId, initialFlashcards])

  const calculateStats = (cards: Flashcard[]) => {
    const newStats = {
      total: cards.length,
      new: cards.filter(c => c.difficulty === 0).length,
      easy: cards.filter(c => c.difficulty === 1).length,
      medium: cards.filter(c => c.difficulty === 2).length,
      hard: cards.filter(c => c.difficulty === 3).length
    }
    setStats(newStats)
  }

  const handleStartPractice = () => {
    if (flashcards.length > 0) {
      onStartPractice(flashcards)
    }
  }

  const getDifficultyText = (difficulty: number) => {
    switch (difficulty) {
      case 0: return t('new')
      case 1: return t('easy')
      case 2: return t('medium')
      case 3: return t('hard')
      default: return t('unknown')
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

  const handleEditStart = (card: Flashcard) => {
    setEditingCard(card)
    setEditingQuestion(card.question)
    setEditingAnswer(card.answer)
    setShowEditModal(true)
  }

  const handleEditCancel = () => {
    setShowEditModal(false)
    setEditingCard(null)
    setEditingQuestion('')
    setEditingAnswer('')
  }

  const handleEditSave = async () => {
    if (!editingCard || !editingQuestion.trim() || !editingAnswer.trim()) return
    
    // 更新本地状态
    const updatedFlashcards = flashcards.map(card => 
      card.id === editingCard.id 
        ? { ...card, question: editingQuestion.trim(), answer: editingAnswer.trim() }
        : card
    )
    setFlashcards(updatedFlashcards)
    calculateStats(updatedFlashcards)
    
    // 保存到本地存储
    try {
      const storageKey = `flashcards_${pdfId}`
      localStorage.setItem(storageKey, JSON.stringify(updatedFlashcards))
      console.log('[闪卡管理] 编辑保存到本地存储成功')
    } catch (error) {
      console.error('[闪卡管理] 编辑保存到本地存储失败:', error)
    }
    
    handleEditCancel()
  }

  const handleDelete = async (cardId: string) => {
    if (confirm(t('deleteConfirm'))) {
      const updatedFlashcards = flashcards.filter(card => card.id !== cardId)
      setFlashcards(updatedFlashcards)
      calculateStats(updatedFlashcards)
      
      // 保存到本地存储
      try {
        const storageKey = `flashcards_${pdfId}`
        localStorage.setItem(storageKey, JSON.stringify(updatedFlashcards))
        console.log('[闪卡管理] 删除后保存到本地存储成功')
      } catch (error) {
        console.error('[闪卡管理] 删除后保存到本地存储失败:', error)
      }
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
          {stats.total} {t('totalCards')}
        </div>
      </div>

      {/* 学习进度 */}
      <div className="p-4 space-y-4">
        <h2 className="font-medium text-gray-900">{t('studyProgress')}</h2>
        
        <div className="space-y-3">
          {/* 新卡片 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('newCards')} (100%)</span>
            <span className="text-sm font-medium">{stats.new} {t('cards')}</span>
          </div>
          {stats.new > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-400 h-2 rounded-full w-full"></div>
            </div>
          )}

          {/* 容易 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('easyCards')} ({stats.total > 0 ? Math.round((stats.easy / stats.total) * 100) : 0}%)</span>
            <span className="text-sm font-medium text-green-600">
              {stats.easy} {t('cards')}
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
            <span className="text-sm text-gray-600">{t('mediumCards')} ({stats.total > 0 ? Math.round((stats.medium / stats.total) * 100) : 0}%)</span>
            <span className="text-sm font-medium">{stats.medium} {t('cards')}</span>
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
            <span className="text-sm text-gray-600">{t('hardCards')} ({stats.total > 0 ? Math.round((stats.hard / stats.total) * 100) : 0}%)</span>
            <span className="text-sm font-medium text-red-600">
              {stats.hard} {t('cards')}
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
            {t('startPractice')}
          </Button>
          <Button
            onClick={onAddFlashcard}
            variant="outline"
            className="flex-1 py-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addFlashcard')}
          </Button>
        </div>
      </div>

      {/* 闪卡列表 */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">{t('flashcardList')}</h3>
          
          {flashcards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('noFlashcards')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {flashcards.map((card) => (
                <div
                  key={card.id}
                  className="border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1 text-sm">
                        {t('frontSide')}
                      </div>
                      <div className="text-xs text-gray-600 mb-2 break-words line-clamp-2">
                        {card.question}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-1 flex-shrink-0">
                      <button 
                        onClick={() => handleEditStart(card)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Edit className="h-3 w-3 text-gray-500" />
                      </button>
                      <button 
                        onClick={() => handleDelete(card.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Trash2 className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="font-medium text-gray-900 mb-1 text-sm">
                      {t('backSide')}
                    </div>
                    <div className="text-xs text-gray-600 mb-2 break-words line-clamp-2">
                      {card.answer}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(card.difficulty)}`}>
                        {getDifficultyText(card.difficulty)}
                      </span>
                      {card.page_number && (
                        <span className="text-xs text-gray-500">
                          {t('page')} {card.page_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 编辑闪卡弹窗 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {t('editFlashcard')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('frontSide')}
              </label>
              <Textarea
                value={editingQuestion}
                onChange={(e) => setEditingQuestion(e.target.value)}
                className="w-full resize-none"
                rows={3}
                placeholder={t('questionPlaceholder')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('backSide')}
              </label>
              <Textarea
                value={editingAnswer}
                onChange={(e) => setEditingAnswer(e.target.value)}
                className="w-full resize-none"
                rows={4}
                placeholder={t('answerPlaceholder')}
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              onClick={handleEditCancel}
              variant="outline"
            >
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleEditSave}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!editingQuestion.trim() || !editingAnswer.trim()}
            >
              {tc('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}