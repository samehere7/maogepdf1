"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface FlashcardEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (question: string, answer: string) => void
  initialData?: {
    question: string
    answer: string
  }
  title?: string
}

export default function FlashcardEditModal({ 
  open, 
  onOpenChange, 
  onSave, 
  initialData,
  title = "编辑闪卡"
}: FlashcardEditModalProps) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")

  // 当模态框打开时，初始化数据
  useEffect(() => {
    if (open) {
      setQuestion(initialData?.question || "")
      setAnswer(initialData?.answer || "")
    }
  }, [open, initialData])

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) {
      alert('请填写正面和背面内容')
      return
    }
    onSave(question, answer)
    setQuestion("")
    setAnswer("")
  }

  const handleCancel = () => {
    setQuestion("")
    setAnswer("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 正面 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              正面
            </label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="输入问题或概念..."
              className="min-h-[120px] resize-none border-2 border-purple-200 focus:border-purple-500 rounded-lg"
            />
          </div>

          {/* 背面 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              背面
            </label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="输入答案或解释..."
              className="min-h-[120px] resize-none border-2 border-purple-200 focus:border-purple-500 rounded-lg"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-6"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="px-6 bg-purple-600 hover:bg-purple-700 text-white"
            >
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}