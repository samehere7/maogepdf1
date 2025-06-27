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
import { DebugPanel } from "@/components/debug-panel"

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
  const locale = useLocale() // 多语言支持 - 强制重新部署
  const t = useTranslations()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [modelType, setModelType] = useState<'fast' | 'quality'>('fast')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isPro, setIsPro] = useState(false) // 这里可根据实际会员状态判断
  const [showDebug, setShowDebug] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

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
      setLastError(null);
      
      // 保存用户消息
      const userResponse = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: documentId,
          content: userMessage.content,
          isUser: true
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(`保存用户消息失败: ${errorData.error} (${userResponse.status})`);
      }

      // 保存AI回复
      const aiResponse = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: documentId,
          content: aiMessage.content,
          isUser: false
        })
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(`保存AI消息失败: ${errorData.error} (${aiResponse.status})`);
      }
      
      console.log(t('chat.chatHistorySaved'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLastError(errorMessage);
      console.error(t('chat.chatHistorySaveFailed'), errorMessage);
      setShowDebug(true); // 出错时自动显示调试面板
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
      console.log("=== PDF聊天调试信息 ===");
      console.log("locale变量类型:", typeof locale);
      console.log("locale变量值:", locale);
      console.log("useLocale()返回:", useLocale());
      console.log("开始PDF对话:", input.trim(), "文档ID:", documentId, "模式:", modelType, "语言:", locale);
      
      const requestPayload = { 
        pdfId: documentId,
        question: input.trim(),
        mode: modelType === 'quality' ? 'high' : 'fast',
        locale: locale || 'zh' // 确保有默认值
      };
      
      console.log("发送请求payload:", JSON.stringify(requestPayload, null, 2));
      console.log("payload中的locale:", requestPayload.locale);
      
      // 使用新的PDF QA API
      const response = await fetch("/api/pdf/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      })
      
      console.log("PDF QA API响应状态:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("PDF QA API错误:", errorData);
        throw new Error(errorData.error || t('chat.chatRequestFailed'));
      }
      
      const data = await response.json();
      console.log("PDF QA API成功:", data);
      
      // 解析API响应
      const aiContent = data.answer || t("chatErrorMessage");

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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-medium">{t("chat.chatWithDocument")}</h3>
        </div>
        
        {/* 添加质量模式切换 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{t("chat.responseMode")}:</span>
          <div className="flex rounded-md border overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${
                modelType === 'fast' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setModelType('fast')}
            >
              {t("chat.fastMode")}
            </button>
            <button
              className={`px-3 py-1 text-sm ${
                modelType === 'quality' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setModelType('quality')}
            >
              {t("chat.qualityMode")}
            </button>
          </div>
          
          {/* 调试按钮 */}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`px-3 py-1 text-sm rounded ${
              showDebug ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            调试
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {lastError && (
        <div className="mx-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-red-800">聊天功能出现问题</p>
              <p className="text-sm text-red-600 mt-1">{lastError}</p>
            </div>
            <button
              onClick={() => setLastError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 调试面板 */}
      {showDebug && (
        <div className="mx-4 mb-4">
          <DebugPanel 
            documentId={documentId}
            onDebugComplete={(success) => {
              if (success) {
                setLastError(null);
              }
            }}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.isUser
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <PageAnchorText 
                content={message.content} 
                onPageClick={onPageJump || (() => {})} 
              />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-100">
              <div className="flex space-x-2">
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex space-x-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.askAboutDocument")}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">{t("chat.send")}</span>
          </Button>
        </form>
      </div>
      
      {showUpgrade && (
        <UpgradeModal>
          <div></div>
        </UpgradeModal>
      )}
    </div>
  )
}
