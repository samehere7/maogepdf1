"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Plus, Edit, Trash2, BookOpen, Clock, Copy, Download, 
  RotateCw, CheckCircle, Info, Clipboard
} from "lucide-react"
import FlashcardEditModal from "./flashcard-edit-modal"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"

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
  const { t } = useLanguage()
  const { toast } = useToast()
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
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

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
      toast({
        title: t('加载失败'),
        description: t('无法加载闪卡，请重试'),
        variant: "destructive"
      })
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
        toast({
          title: editModal.flashcard ? t('闪卡已更新') : t('闪卡已创建'),
          variant: "default"
        })
      } else {
        throw new Error('保存失败')
      }
    } catch (error) {
      console.error('保存闪卡失败:', error)
      toast({
        title: t('保存失败'),
        description: t('无法保存闪卡，请重试'),
        variant: "destructive"
      })
    }
  }

  // 删除闪卡
  const handleDeleteFlashcard = async (id: string) => {
    if (!confirm(t('确定要删除这张闪卡吗？'))) return

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadFlashcards()
        toast({
          title: t('闪卡已删除'),
          variant: "default"
        })
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除闪卡失败:', error)
      toast({
        title: t('删除失败'),
        description: t('无法删除闪卡，请重试'),
        variant: "destructive"
      })
    }
  }

  // 复制闪卡内容
  const copyFlashcardContent = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: t('已复制到剪贴板'),
      variant: "default"
    })
  }

  // 导出所有闪卡
  const exportFlashcards = () => {
    const exportData = flashcards.map(card => ({
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty,
    }))
    
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `flashcards-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: t('闪卡已导出'),
      variant: "default"
    })
  }

  // 翻转卡片
  const toggleCardFlip = (id: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
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
      case 'EASY': return t('简单')
      case 'MEDIUM': return t('中等')
      case 'HARD': return t('困难')
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
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={`p-6 ${className}`}>
        {/* 统计信息 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('闪卡学习')}
            </h2>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={exportFlashcards}
                    variant="outline"
                    size="sm"
                    disabled={flashcards.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('导出')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('导出所有闪卡')}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setEditModal({ open: true })}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('新建闪卡')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('创建新的闪卡')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">{t('总数')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
                <div className="text-sm text-gray-600">{t('已复习')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.due}</div>
                <div className="text-sm text-gray-600">{t('待复习')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.new}</div>
                <div className="text-sm text-gray-600">{t('新卡片')}</div>
              </CardContent>
            </Card>
          </div>
          
          {stats.due > 0 && (
            <div className="mb-6 flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => window.location.href = `/analysis/${pdfId}?mode=study`}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t('开始练习')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('开始闪卡练习模式')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* 闪卡列表 */}
        {flashcards.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('还没有闪卡')}</h3>
              <p className="text-gray-600 mb-4">{t('创建你的第一张闪卡开始学习吧！')}</p>
              <Button
                onClick={() => setEditModal({ open: true })}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('创建闪卡')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcards.map((flashcard) => (
              <div key={flashcard.id} className="perspective-1000">
                <div 
                  className={`relative transition-all duration-500 preserve-3d cursor-pointer ${
                    flippedCards.has(flashcard.id) ? 'rotate-y-180' : ''
                  }`}
                  onClick={() => toggleCardFlip(flashcard.id)}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* 卡片正面 */}
                  <Card className={`backface-hidden ${
                    isDue(flashcard) ? 'border-orange-200 bg-orange-50' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getDifficultyColor(flashcard.difficulty)}>
                            {getDifficultyText(flashcard.difficulty)}
                          </Badge>
                          {isDue(flashcard) && (
                            <Badge className="bg-orange-100 text-orange-800">
                              <Clock className="h-3 w-3 mr-1" />
                              {t('待复习')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyFlashcardContent(flashcard.question);
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('复制问题')}</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditModal({ open: true, flashcard });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('编辑闪卡')}</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFlashcard(flashcard.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('删除闪卡')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="min-h-[100px] flex items-center justify-center">
                        <p className="text-gray-700 text-center">{flashcard.question}</p>
                      </div>
                      <div className="text-center text-sm text-gray-500 mt-4">
                        {t('点击卡片查看答案')}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* 卡片背面 */}
                  <Card className="backface-hidden rotate-y-180 absolute top-0 left-0 w-full h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-blue-100 text-blue-800">
                          {t('答案')}
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyFlashcardContent(flashcard.answer);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('复制答案')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="min-h-[100px] flex items-center justify-center">
                        <p className="text-gray-700 text-center">{flashcard.answer}</p>
                      </div>
                      <div className="text-center text-sm text-gray-500 mt-4">
                        {t('点击卡片返回问题')}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
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
          title={editModal.flashcard ? t("编辑闪卡") : t("新建闪卡")}
        />
      </div>
    </TooltipProvider>
  )
}