"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageCircle } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { chatWithDocument } from "@/lib/openrouter"
import { UpgradeModal } from "@/components/upgrade-modal"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface MaogeInterfaceProps {
  documentId: string
  documentName: string
}

export function MaogeInterface({ documentId, documentName }: MaogeInterfaceProps) {
  const { t, language } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [modelType, setModelType] = useState<'fast' | 'quality'>('fast')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isPro, setIsPro] = useState(false) // 这里可根据实际会员状态判断

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load maoge history from localStorage
    const maogeHistory = JSON.parse(localStorage.getItem(`maoge-${documentId}`) || "[]")
    setMessages(
      maogeHistory.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    )

    // Add welcome message if no history
    if (maogeHistory.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: t("chatWelcomeMessage").replace("{documentName}", documentName),
        isUser: false,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [documentId, documentName, t])

  const saveMessages = (newMessages: Message[]) => {
    localStorage.setItem(`maoge-${documentId}`, JSON.stringify(newMessages))
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      // 通过后端代理安全调用
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), modelType }),
      })
      const data = await response.json()
      const aiContent = data.choices?.[0]?.message?.content || t("chatErrorMessage")

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        isUser: false,
        timestamp: new Date(),
      }

      const finalMessages = [...newMessages, aiMessage]
      setMessages(finalMessages)
      saveMessages(finalMessages)
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: t("chatErrorMessage"),
        isUser: false,
        timestamp: new Date(),
      }

      const finalMessages = [...newMessages, errorMessage]
      setMessages(finalMessages)
      saveMessages(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <section className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-[700px] min-h-[700px]">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
        <MessageCircle className="h-6 w-6 text-[#0A52A1]" />
        <h2 className="text-slate-800 text-xl font-semibold leading-tight tracking-tight">{t("chatWithDocument")}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isUser ? "bg-[#0A52A1] text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-2 ${message.isUser ? "text-slate-200" : "text-slate-500"}`}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-800 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                <span className="text-sm">{t("typing")}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区和模型切换，固定到底部 */}
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t("askAboutDocument")}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-[#0A52A1] hover:bg-[#084382] text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center">
          <div className="inline-flex rounded border border-gray-300 bg-gray-100">
            <button
              className={`px-4 py-1 rounded-l ${modelType === 'fast' ? 'bg-white font-bold text-[#8b5cf6]' : 'text-gray-500'}`}
              onClick={() => setModelType('fast')}
              disabled={isLoading}
            >
              {language === 'zh' ? '快速' : language === 'ja' ? '高速' : 'Fast'}
            </button>
            <button
              className={`px-4 py-1 rounded-r ${modelType === 'quality' ? 'bg-white font-bold text-[#8b5cf6]' : 'text-gray-500'}`}
              onClick={() => {
                if (isPro) {
                  setModelType('quality')
                } else {
                  setShowUpgrade(true)
                }
              }}
              disabled={isLoading}
            >
              {language === 'zh' ? '高质量' : language === 'ja' ? '高品質' : 'High Quality'}
            </button>
          </div>
        </div>
      </div>
      {/* 付费弹窗 */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-0">
            <UpgradeModal>
              <div />
            </UpgradeModal>
            <div className="flex justify-end p-2">
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowUpgrade(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
