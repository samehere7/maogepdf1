"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, BookOpen, Clock } from "lucide-react"
import FlashcardEditModal from "./flashcard-edit-modal"

interface Flashcard {
  id: string
  question: string
  answer: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  createdAt: string
  updatedAt: string
  reviews: Array<{
    id: string
    rating: string
    reviewedAt: string
    nextReview: string
  }>
}

interface FlashcardListProps {
  pdfId: string
  className?: string
}

export default function FlashcardList({ pdfId, className }: FlashcardListProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState<{
    open: boolean
    flashcard?: Flashcard
  }>({ open: false })
  const [stats, setStats] = useState({
    total: 0,
    reviewed: 0,
    due: 0,
    new: 0,
  })

  // 加载闪卡列表
  const loadFlashcards = async () => {
    try {
      setLoading(true)
      const [flashcardsResponse, statsResponse] = await Promise.all([
        fetch(`/api/flashcards?pdfId=${pdfId}`),
        fetch(`/api/flashcards?pdfId=${pdfId}&stats=true`),
      ])

      if (flashcardsResponse.ok && statsResponse.ok) {
        const flashcardsData = await flashcardsResponse.json()
        const statsData = await statsResponse.json()
        setFlashcards(flashcardsData)
        setStats(statsData)
      }
    } catch (error) {
      console.error('加载闪卡失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlashcards()
  }, [pdfId])

  // 创建或更新闪卡
  const handleSaveFlashcard = async (question: string, answer: string) => {
    try {
      const url = editModal.flashcard 
        ? `/api/flashcards/${editModal.flashcard.id}`
        : '/api/flashcards'
      
      const method = editModal.flashcard ? 'PUT' : 'POST'
      const body = editModal.flashcard 
        ? { question, answer }
        : { question, answer, pdfId }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setEditModal({ open: false })
        loadFlashcards()
      } else {
        throw new Error('保存失败')
      }
    } catch (error) {
      console.error('保存闪卡失败:', error)
      alert('保存失败，请重试')
    }
  }

  // 删除闪卡
  const handleDeleteFlashcard = async (id: string) => {
    if (!confirm('确定要删除这张闪卡吗？')) return

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadFlashcards()
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除闪卡失败:', error)
      alert('删除失败，请重试')
    }
  }

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HARD': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取难度文本
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return '简单'
      case 'MEDIUM': return '中等'
      case 'HARD': return '困难'
      default: return difficulty
    }
  }

  // 检查是否需要复习
  const isDue = (flashcard: Flashcard) => {
    if (flashcard.reviews.length === 0) return true
    const lastReview = flashcard.reviews[0]
    return new Date(lastReview.nextReview) <= new Date()
  }

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* 统计信息 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            闪卡学习
          </h2>
          <Button
            onClick={() => setEditModal({ open: true })}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建闪卡
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">总数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
              <div className="text-sm text-gray-600">已复习</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.due}</div>
              <div className="text-sm text-gray-600">待复习</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.new}</div>
              <div className="text-sm text-gray-600">新卡片</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 闪卡列表 */}
      {flashcards.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有闪卡</h3>
            <p className="text-gray-600 mb-4">创建你的第一张闪卡开始学习吧！</p>
            <Button
              onClick={() => setEditModal({ open: true })}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              创建闪卡
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {flashcards.map((flashcard) => (
            <Card key={flashcard.id} className={`transition-all duration-200 hover:shadow-md ${
              isDue(flashcard) ? 'border-orange-200 bg-orange-50' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(flashcard.difficulty)}>
                      {getDifficultyText(flashcard.difficulty)}
                    </Badge>
                    {isDue(flashcard) && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Clock className="h-3 w-3 mr-1" />
                        待复习
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditModal({ open: true, flashcard })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFlashcard(flashcard.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">问题</h4>
                    <p className="text-gray-700">{flashcard.question}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">答案</h4>
                    <p className="text-gray-700">{flashcard.answer}</p>
                  </div>
                  {flashcard.reviews.length > 0 && (
                    <div className="text-sm text-gray-500">
                      上次复习: {new Date(flashcard.reviews[0].reviewedAt).toLocaleDateString()}
                      {" | "}
                      下次复习: {new Date(flashcard.reviews[0].nextReview).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 编辑模态框 */}
      <FlashcardEditModal
        open={editModal.open}
        onOpenChange={(open) => setEditModal({ open })}
        onSave={handleSaveFlashcard}
        initialData={editModal.flashcard ? {
          question: editModal.flashcard.question,
          answer: editModal.flashcard.answer,
        } : undefined}
        title={editModal.flashcard ? "编辑闪卡" : "新建闪卡"}
      />
    </div>
  )
}