"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Volume2 } from "lucide-react"

interface Flashcard {
  id: string
  question: string
  answer: string
  difficulty: number
  page_number?: number
  review_count: number
  last_reviewed_at?: string
}

interface FlashcardPracticeProps {
  flashcards: Flashcard[]
  pdfId: string
  onBack: () => void
  onComplete: (results: PracticeResults) => void
}

interface PracticeResults {
  totalCards: number
  easyCount: number
  mediumCount: number
  hardCount: number
  sessionTime: number
}

type DifficultyRating = 1 | 2 | 3 // 1: 容易, 2: 中等, 3: 困难

export default function FlashcardPractice({ 
  flashcards, 
  pdfId, 
  onBack, 
  onComplete 
}: FlashcardPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [practiceResults, setPracticeResults] = useState<PracticeResults>({
    totalCards: flashcards.length,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    sessionTime: 0
  })
  const [startTime] = useState(Date.now())

  const currentCard = flashcards[currentIndex]
  const isLastCard = currentIndex === flashcards.length - 1

  // 键盘事件监听
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        if (!showAnswer) {
          handleAnswer()
        }
      } else if (event.key >= '1' && event.key <= '3' && showAnswer) {
        const rating = parseInt(event.key) as DifficultyRating
        handleDifficultyRating(rating)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showAnswer, currentIndex, isFlipping])

  const handleAnswer = () => {
    setIsFlipping(true)
    setTimeout(() => {
      setShowAnswer(true)
      setIsFlipping(false)
    }, 300) // 翻转动画时间
  }

  const handleDifficultyRating = (rating: DifficultyRating) => {
    // 移除数据库操作，仅更新本地状态
    
    // 更新结果统计
    const newResults = { ...practiceResults }
    switch (rating) {
      case 1:
        newResults.easyCount++
        break
      case 2:
        newResults.mediumCount++
        break
      case 3:
        newResults.hardCount++
        break
    }
    setPracticeResults(newResults)

    // 移动到下一张卡片或完成练习
    if (isLastCard) {
      const finalResults = {
        ...newResults,
        sessionTime: Math.floor((Date.now() - startTime) / 1000)
      }
      
      // 移除数据库会话更新，直接完成练习
      onComplete(finalResults)
    } else {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
      setIsFlipping(false)
    }
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      speechSynthesis.speak(utterance)
    }
  }

  const getDifficultyButtonStyle = (rating: DifficultyRating) => {
    switch (rating) {
      case 1:
        return 'bg-green-500 hover:bg-green-600 text-white'
      case 2:
        return 'bg-yellow-500 hover:bg-yellow-600 text-white'
      case 3:
        return 'bg-red-500 hover:bg-red-600 text-white'
    }
  }

  const getDifficultyText = (rating: DifficultyRating) => {
    switch (rating) {
      case 1:
        return '容易'
      case 2:
        return '中等'
      case 3:
        return '困难'
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-sm font-medium">
            卡片 {currentIndex + 1} / {flashcards.length}
          </div>
        </div>

        {/* 进度条 */}
        <div className="px-4 py-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-purple-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 卡片内容 */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div 
              className="relative w-full h-96"
              style={{ perspective: '1000px' }}
            >
              <div 
                className="relative w-full h-full transition-transform duration-300"
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: (showAnswer || isFlipping) ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* 问题面 */}
                <div 
                  className="absolute inset-0 bg-gray-50 rounded-lg p-8 flex flex-col justify-center items-center text-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-6">问题</h3>
                  <div className="text-xl text-gray-800 leading-relaxed mb-8">
                    {currentCard.question}
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    (点击查看答案或按空格键)
                  </p>
                  <Button
                    onClick={handleAnswer}
                    disabled={isFlipping}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                  >
                    {isFlipping ? '翻转中...' : '查看答案'}
                  </Button>
                </div>

                {/* 答案面 */}
                <div 
                  className="absolute inset-0 bg-gray-50 rounded-lg p-8 flex flex-col justify-center items-center text-center"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">答案</h3>
                  <div className="text-xl text-gray-800 leading-relaxed mb-8">
                    {currentCard.answer}
                  </div>
                  <button
                    onClick={() => speakText(currentCard.answer)}
                    className="mb-6 p-2 hover:bg-gray-200 rounded-full"
                    title="朗读答案"
                  >
                    <Volume2 className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* 难度评分按钮 */}
      {showAnswer && (
        <div className="p-6 border-t bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <p className="text-center text-sm text-gray-600 mb-4">
              这个问题对你来说有多难？
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => handleDifficultyRating(3)}
                className={`px-8 py-3 ${getDifficultyButtonStyle(3)}`}
              >
                困难
                <div className="text-xs opacity-80 ml-2">按 3</div>
              </Button>
              <Button
                onClick={() => handleDifficultyRating(2)}
                className={`px-8 py-3 ${getDifficultyButtonStyle(2)}`}
              >
                中等
                <div className="text-xs opacity-80 ml-2">按 2</div>
              </Button>
              <Button
                onClick={() => handleDifficultyRating(1)}
                className={`px-8 py-3 ${getDifficultyButtonStyle(1)}`}
              >
                容易
                <div className="text-xs opacity-80 ml-2">按 1</div>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}