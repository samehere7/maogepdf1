"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageCircle } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { chatWithDocument } from "@/lib/openrouter"

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
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      const response = await chatWithDocument(input.trim(), documentName)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
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
    <section className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-[600px]">
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

      {/* Input */}
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
    </section>
  )
}
