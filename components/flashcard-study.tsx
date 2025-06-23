"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RotateCcw, CheckCircle, AlertCircle, Clock, Brain } from "lucide-react"
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('flashcard');
  const tc = useTranslations('common');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [studying, setStudying] = useState(false)
  const [completed, setCompleted] = useState(0)

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
        
        if (dueFlashcards.length > 0) {
          setStudying(true)
        }
      }
    } catch (error) {
      console.error(t('studyLoadFailed') + ':', error)
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
        
        // 移到下一张卡片
        if (currentIndex + 1 < flashcards.length) {
          setCurrentIndex(currentIndex + 1)
          setShowAnswer(false)
        } else {
          // 学习完成
          setStudying(false)
          onComplete?.()
        }
      }
    } catch (error) {
      console.error(t('studyReviewFailed') + ':', error)
      alert(t('studyReviewFailedAlert'))
    }
  }

  // 重新开始学习
  const restartStudy = () => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setCompleted(0)
    setStudying(true)
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

  if (flashcards.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('studyGreat')}</h3>
            <p className="text-gray-600 mb-4">{t('studyNoCards')}</p>
            <Button
              onClick={loadDueFlashcards}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('studyRefresh')}
            </Button>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('studyCompleted')}</h3>
            <p className="text-gray-600 mb-4">
              {t('studyCompletedCount', { count: completed })}
            </p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={restartStudy}
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('studyRestart')}
              </Button>
              <Button
                onClick={onComplete}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {t('studyBackToList')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentFlashcard = flashcards[currentIndex]
  const progress = ((currentIndex + (showAnswer ? 0.5 : 0)) / flashcards.length) * 100

  return (
    <div className={`p-6 max-w-4xl mx-auto ${className}`}>
      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {t('studyTitle')}
          </h2>
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {flashcards.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* 闪卡 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center">
            {showAnswer ? t('practiceAnswer') : t('practiceQuestion')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="text-lg leading-relaxed mb-6 min-h-[120px] flex items-center justify-center">
              {showAnswer ? currentFlashcard.answer : currentFlashcard.question}
            </div>
            
            {!showAnswer ? (
              <Button
                onClick={() => setShowAnswer(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                size="lg"
              >
                {t('practiceShowAnswer')}
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 mb-6">
                  {t('studySelectDifficulty')}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    onClick={() => handleReview('AGAIN')}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50 py-3"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {t('studyAgain')}
                  </Button>
                  <Button
                    onClick={() => handleReview('HARD')}
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 py-3"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {t('hard')}
                  </Button>
                  <Button
                    onClick={() => handleReview('MEDIUM')}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 py-3"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('studyMedium')}
                  </Button>
                  <Button
                    onClick={() => handleReview('EASY')}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50 py-3"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('easy')}
                  </Button>
                </div>
                <div className="text-sm text-gray-500 mt-4">
                  {t('studyReviewSchedule')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-center">
        <Button
          onClick={() => setStudying(false)}
          variant="outline"
        >
          {t('studyEnd')}
        </Button>
      </div>
    </div>
  )
}