"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  RotateCcw, CheckCircle, AlertCircle, Clock, Brain, 
  ChevronLeft, ChevronRight, RefreshCw, ArrowLeft
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"

interface Flashcard {
  id: string
  question: string
  answer: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  reviews: Array<{
    id: string
    rating: string
    reviewedAt: string
    nextReview: string
  }>
}

interface FlashcardStudyProps {
  pdfId: string
  onComplete?: () => void
  className?: string
}

export default function FlashcardStudy({ pdfId, onComplete, className }: FlashcardStudyProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [studying, setStudying] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    remaining: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    again: 0
  })

  // 加载需要复习的闪卡
  const loadDueFlashcards = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/flashcards?pdfId=${pdfId}`)
      
      if (response.ok) {
        const allFlashcards = await response.json()
        
        // 筛选出需要复习的闪卡
        const dueFlashcards = allFlashcards.filter((flashcard: Flashcard) => {
          if (flashcard.reviews.length === 0) return true
          const lastReview = flashcard.reviews[0]
          return new Date(lastReview.nextReview) <= new Date()
        })
        
        setFlashcards(dueFlashcards)
        setStats(prev => ({
          ...prev,
          total: dueFlashcards.length,
          remaining: dueFlashcards.length
        }))
        
        if (dueFlashcards.length > 0) {
          setStudying(true)
        }
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
    loadDueFlashcards()
  }, [pdfId])

  // 处理复习评分
  const handleReview = async (rating: 'EASY' | 'MEDIUM' | 'HARD' | 'AGAIN') => {
    if (currentIndex >= flashcards.length) return

    const currentFlashcard = flashcards[currentIndex]
    
    try {
      const response = await fetch(`/api/flashcards/${currentFlashcard.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })

      if (response.ok) {
        setCompleted(completed + 1)
        
        // 更新统计信息
        setStats(prev => ({
          ...prev,
          remaining: prev.remaining - 1,
          [rating.toLowerCase()]: prev[rating.toLowerCase() as keyof typeof prev] + 1
        }))
        
        // 移到下一张卡片
        if (currentIndex + 1 < flashcards.length) {
          setCurrentIndex(currentIndex + 1)
          setShowAnswer(false)
        } else {
          // 学习完成
          setStudying(false)
          onComplete?.()
        }

        toast({
          title: t('已评分'),
          description: t(`已将此卡片标记为${getRatingText(rating)}`),
          variant: "default"
        })
      }
    } catch (error) {
      console.error('复习失败:', error)
      toast({
        title: t('复习失败'),
        description: t('无法提交评分，请重试'),
        variant: "destructive"
      })
    }
  }

  // 获取评分文本
  const getRatingText = (rating: string) => {
    switch (rating) {
      case 'AGAIN': return t('再次')
      case 'HARD': return t('困难')
      case 'MEDIUM': return t('一般')
      case 'EASY': return t('简单')
      default: return rating
    }
  }

  // 获取评分颜色
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'AGAIN': return 'border-red-300 text-red-700 hover:bg-red-50'
      case 'HARD': return 'border-orange-300 text-orange-700 hover:bg-orange-50'
      case 'MEDIUM': return 'border-blue-300 text-blue-700 hover:bg-blue-50'
      case 'EASY': return 'border-green-300 text-green-700 hover:bg-green-50'
      default: return 'border-gray-300 text-gray-700 hover:bg-gray-50'
    }
  }

  // 重新开始学习
  const restartStudy = () => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setCompleted(0)
    setStats({
      total: flashcards.length,
      remaining: flashcards.length,
      easy: 0,
      medium: 0,
      hard: 0,
      again: 0
    })
    setStudying(true)
  }

  // 上一张卡片
  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowAnswer(false)
    }
  }

  // 下一张卡片
  const handleNextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    }
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

  if (flashcards.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('太棒了！')}</h3>
            <p className="text-gray-600 mb-4">{t('暂时没有需要复习的闪卡。')}</p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={loadDueFlashcards}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('刷新')}
              </Button>
              <Button
                onClick={onComplete}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('返回列表')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!studying) {
    return (
      <div className={`p-6 ${className}`}>
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('学习完成！')}</h3>
            <p className="text-gray-600 mb-4">
              {t('你已经完成了')} {completed} {t('张闪卡的复习。')}
            </p>
            
            {/* 统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto mb-6">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{stats.easy}</div>
                <div className="text-sm text-gray-600">{t('简单')}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{stats.medium}</div>
                <div className="text-sm text-gray-600">{t('一般')}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{stats.hard}</div>
                <div className="text-sm text-gray-600">{t('困难')}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">{stats.again}</div>
                <div className="text-sm text-gray-600">{t('再次')}</div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button
                onClick={restartStudy}
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('重新开始')}
              </Button>
              <Button
                onClick={onComplete}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('返回列表')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentFlashcard = flashcards[currentIndex]
  const progress = Math.round((completed / flashcards.length) * 100);

  return (
    <TooltipProvider>
      <div className={`p-6 max-w-4xl mx-auto ${className}`}>
        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t('闪卡学习')}
            </h2>
            <span className="text-sm text-gray-600">
              {currentIndex + 1} / {flashcards.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* 统计信息 */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <div>{t('剩余')}: {stats.remaining}</div>
            <div className="flex gap-2">
              <span className="text-green-600">{t('简单')}: {stats.easy}</span>
              <span className="text-blue-600">{t('一般')}: {stats.medium}</span>
              <span className="text-orange-600">{t('困难')}: {stats.hard}</span>
              <span className="text-red-600">{t('再次')}: {stats.again}</span>
            </div>
          </div>
        </div>

        {/* 闪卡 */}
        <div className="perspective-1000 mb-6">
          <div 
            className={`relative transition-all duration-500 preserve-3d cursor-pointer ${
              showAnswer ? 'rotate-y-180' : ''
            }`}
            onClick={() => setShowAnswer(!showAnswer)}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* 卡片正面 */}
            <Card className="backface-hidden">
              <CardHeader>
                <CardTitle className="text-center">
                  {t('问题')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="text-lg leading-relaxed mb-6 min-h-[120px] flex items-center justify-center">
                    {currentFlashcard.question}
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-4">
                    {t('点击卡片查看答案')}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 卡片背面 */}
            <Card className="backface-hidden rotate-y-180 absolute top-0 left-0 w-full h-full">
              <CardHeader>
                <CardTitle className="text-center">
                  {t('答案')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="text-lg leading-relaxed mb-6 min-h-[120px] flex items-center justify-center">
                    {currentFlashcard.answer}
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-gray-600 mb-6">
                      {t('请根据你的掌握程度选择')}:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview('AGAIN');
                            }}
                            variant="outline"
                            className={getRatingColor('AGAIN')}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {t('再次')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('完全不记得，1天后再复习')}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview('HARD');
                            }}
                            variant="outline"
                            className={getRatingColor('HARD')}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            {t('困难')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('记得很困难，3天后再复习')}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview('MEDIUM');
                            }}
                            variant="outline"
                            className={getRatingColor('MEDIUM')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {t('一般')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('记得有点困难，7天后再复习')}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview('EASY');
                            }}
                            variant="outline"
                            className={getRatingColor('EASY')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {t('简单')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('完全记住了，14天后再复习')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handlePrevCard}
                variant="outline"
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('上一张')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('查看上一张闪卡')}</p>
            </TooltipContent>
          </Tooltip>
          
          <Button
            onClick={() => setStudying(false)}
            variant="outline"
          >
            {t('结束学习')}
          </Button>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleNextCard}
                variant="outline"
                disabled={currentIndex === flashcards.length - 1}
              >
                {t('下一张')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('查看下一张闪卡')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}