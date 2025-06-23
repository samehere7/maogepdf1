"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageCircle } from "lucide-react"
import { useLocale, useTranslations } from 'next-intl'
import { chatWithDocument } from "@/lib/openrouter"
import { UpgradeModal } from "@/components/upgrade-modal"
import { PageAnchorText } from "@/components/page-anchor-button"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface MaogeInterfaceProps {
  documentId: string
  documentName: string
  initialMessages?: Array<{role: string, content: string}>
  onPageJump?: (pageNumber: number) => void
}

export function MaogeInterface({ documentId, documentName, initialMessages, onPageJump }: MaogeInterfaceProps) {
  const locale = useLocale()
  const t = useTranslations()
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
    // 优先使用传入的初始消息
    if (initialMessages && initialMessages.length > 0) {
      const formattedMessages = initialMessages.map((msg, index) => ({
        id: (Date.now() + index).toString(),
        content: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(),
      }));
      setMessages(formattedMessages);
      // 同时保存到localStorage
      saveMessages(formattedMessages);
    } else {
      // 如果没有初始消息，检查localStorage
      const maogeHistory = JSON.parse(localStorage.getItem(`maoge-${documentId}`) || "[]")
      
      if (maogeHistory.length > 0) {
        setMessages(
          maogeHistory.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        )
      } else {
        // 显示欢迎消息
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          content: t("chatWelcomeMessage").replace("{documentName}", documentName),
          isUser: false,
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
        saveMessages([welcomeMessage])
      }
    }
  }, [documentId, documentName, initialMessages, t])

  const saveMessages = (newMessages: Message[]) => {
    localStorage.setItem(`maoge-${documentId}`, JSON.stringify(newMessages))
  }

  // 保存聊天记录到数据库
  const saveChatToDatabase = async (userMessage: Message, aiMessage: Message) => {
    try {
      // 保存用户消息
      await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: documentId,
          content: userMessage.content,
          isUser: true
        })
      });

      // 保存AI回复
      await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: documentId,
          content: aiMessage.content,
          isUser: false
        })
      });
      
      console.log(t('chat.chatHistorySaved'));
    } catch (error) {
      console.error(t('chat.chatHistorySaveFailed'), error);
    }
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
      console.log("开始PDF对话:", input.trim(), "文档ID:", documentId);
      
      // 调用正确的聊天API，使用正确的消息格式
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [
            ...newMessages.map(msg => ({
              role: msg.isUser ? 'user' : 'assistant',
              content: msg.content
            })),
            {
              role: 'user',
              content: input.trim()
            }
          ],
          pdfId: documentId,
          quality: modelType === 'quality' ? 'highQuality' : 'fast'
        }),
      })
      
      console.log("聊天API响应状态:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("聊天API错误:", errorData);
        throw new Error(errorData.error || t('chat.chatRequestFailed'));
      }
      
      const data = await response.json();
      console.log("聊天API成功:", data);
      
      // 正确解析API响应 - 聊天API返回的是content字段
      const aiContent = data.content || t("chatErrorMessage");

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        isUser: false,
        timestamp: new Date(),
      }

      const finalMessages = [...newMessages, aiMessage]
      setMessages(finalMessages)
      saveMessages(finalMessages)
      
      // 保存对话到数据库
      await saveChatToDatabase(userMessage, aiMessage)
    } catch (error) {
      console.error(t('chat.chatError'), error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error ? error.message : t("chat.chatError"),
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

  const handlePageClick = (pageNumber: number) => {
    console.log(`点击页码: ${pageNumber}`);
    if (onPageJump) {
      onPageJump(pageNumber);
    }
  }

  return (
    <section className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-[700px] min-h-[700px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isUser ? "bg-[#0A52A1] text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              <div className="text-xs leading-relaxed">
                {message.isUser ? (
                  <span className="whitespace-pre-wrap">{message.content}</span>
                ) : (
                  <PageAnchorText 
                    content={message.content} 
                    onPageClick={handlePageClick}
                  />
                )}
              </div>
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
              {locale === 'zh' ? '快速' : locale === 'ja' ? '高速' : 'Fast'}
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
              {locale === 'zh' ? '高质量' : locale === 'ja' ? '高品質' : 'High Quality'}
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
