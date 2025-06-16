"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface PracticeResults {
  totalCards: number
  easyCount: number
  mediumCount: number
  hardCount: number
  sessionTime: number
}

interface FlashcardResultsProps {
  results: PracticeResults
  pdfName: string
  onBack: () => void
  onPracticeAgain: () => void
}

export default function FlashcardResults({ 
  results, 
  pdfName, 
  onBack, 
  onPracticeAgain 
}: FlashcardResultsProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  }

  const getPercentage = (count: number) => {
    return results.totalCards > 0 ? Math.round((count / results.totalCards) * 100) : 0
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
        <h1 className="text-lg font-semibold">{pdfName}</h1>
        <div className="w-9"></div> {/* 占位符保持居中 */}
      </div>

      {/* 结果内容 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6">
          {/* 完成提示 */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              练习完成！
            </h2>
            <p className="text-gray-600">
              你已完成了本次闪卡练习
            </p>
          </div>

          {/* 学习统计 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">学习统计</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {results.totalCards}
                </div>
                <div className="text-sm text-gray-600">学习卡片</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(results.sessionTime)}
                </div>
                <div className="text-sm text-gray-600">学习时间</div>
              </div>
            </div>

            {/* 平均时间 */}
            {results.totalCards > 0 && (
              <div className="text-center text-sm text-gray-600">
                平均每卡片: {formatTime(Math.round(results.sessionTime / results.totalCards))}
              </div>
            )}
          </div>

          {/* 学习进度更新 */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-gray-900">学习进度</h3>
            
            {/* 新 -> 容易 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                容易 ({getPercentage(results.easyCount)}%)
              </span>
              <span className="text-sm font-medium text-green-600">
                {results.easyCount} 张卡片
                {results.easyCount > 0 && (
                  <span className="text-green-500 ml-1">(+{results.easyCount})</span>
                )}
              </span>
            </div>
            {results.easyCount > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${getPercentage(results.easyCount)}%` }}
                ></div>
              </div>
            )}

            {/* 中等 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                中等 ({getPercentage(results.mediumCount)}%)
              </span>
              <span className="text-sm font-medium">
                {results.mediumCount} 张卡片
              </span>
            </div>
            {results.mediumCount > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${getPercentage(results.mediumCount)}%` }}
                ></div>
              </div>
            )}

            {/* 困难 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                困难 ({getPercentage(results.hardCount)}%)
              </span>
              <span className="text-sm font-medium text-red-600">
                {results.hardCount} 张卡片
                {results.hardCount > 0 && (
                  <span className="text-red-500 ml-1">(-{results.hardCount})</span>
                )}
              </span>
            </div>
            {results.hardCount > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${getPercentage(results.hardCount)}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <Button
              onClick={onPracticeAgain}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
            >
              再次练习
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full py-3"
            >
              返回闪卡管理
            </Button>
          </div>

          {/* 学习建议 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">学习建议</h4>
            <div className="text-sm text-blue-800 space-y-1">
              {results.hardCount > 0 && (
                <p>• 建议重点复习标记为"困难"的卡片</p>
              )}
              {results.easyCount > results.totalCards * 0.7 && (
                <p>• 表现很好！可以尝试学习新的内容</p>
              )}
              {results.mediumCount > results.totalCards * 0.5 && (
                <p>• 继续练习可以提高记忆效果</p>
              )}
              <p>• 建议定期复习以巩固记忆</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}