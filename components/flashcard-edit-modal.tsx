"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import { useTranslations } from 'next-intl'

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
  title
}: FlashcardEditModalProps) {
  const t = useTranslations('flashcard');
  const tc = useTranslations('common');
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
      alert(t('editFillRequired'))
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
            {title || t('editFlashcard')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 正面 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('frontSide')}
            </label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('questionPlaceholder')}
              className="min-h-[120px] resize-none border-2 border-purple-200 focus:border-purple-500 rounded-lg"
            />
          </div>

          {/* 背面 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('backSide')}
            </label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={t('answerPlaceholder')}
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
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              className="px-6 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {tc('save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}