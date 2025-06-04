"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/language-selector"
import { MaogeInterface } from "@/components/chat-interface"
import { Download, InfoIcon as Insights, List, Flag, ZoomIn, ZoomOut, RotateCw, Send, FolderOpen, FileText, Plus, Zap, Sparkles } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { analyzeDocument } from "@/lib/openrouter"
import { UpgradeModal } from "@/components/upgrade-modal"
import { LoginModal } from "@/components/login-modal"
import { Sidebar } from "@/components/sidebar"
import dynamic from 'next/dynamic'

// 动态导入 PDFViewer 组件，确保只在客户端渲染
const PDFViewer = dynamic(
  () => import('@/components/pdf-viewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <p className="text-slate-600">加载PDF中...</p>
        </div>
      </div>
    )
  }
);

interface AnalysisResult {
  theme: string
  mainPoints: Array<{
    title: string
    reference: string
    description: string
  }>
  conclusions: string
}

// 定义模型配置
const MODEL_CONFIGS = {
  fast: {
    model: "openai/gpt-4o-mini",
    apiKey: "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"
  },
  highQuality: {
    model: "openai/gpt-4o-2024-11-20",
    apiKey: "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"
  }
};

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [fileInfo, setFileInfo] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [answering, setAnswering] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [pdfFiles, setPdfFiles] = useState<any[]>([])
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [modelQuality, setModelQuality] = useState<'fast' | 'highQuality'>(
    fileInfo?.quality === 'fast' ? 'fast' : 'highQuality'
  )
  
  // PDF 预览相关状态
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
    setIsLoggedIn(!!userInfo.isLoggedIn)
    
    // 加载所有PDF文件
    const files = JSON.parse(localStorage.getItem("uploadedPdfs") || "[]")
    setPdfFiles(files)
    
    const loadAnalysis = async () => {
      try {
        const file = files.find((f: any) => f.id === params.id)

        if (!file) {
          router.push("/")
          return
        }

        setFileInfo(file)
        setPdfError(null)

        // Check if analysis already exists
        const existingAnalysis = localStorage.getItem(`analysis-${params.id}`)
        if (existingAnalysis) {
          setAnalysis(JSON.parse(existingAnalysis))
          setLoading(false)
          return
        }

        // Simulate AI analysis
        const result = await analyzeDocument(file.name)
        setAnalysis(result)

        // Store analysis
        localStorage.setItem(`analysis-${params.id}`, JSON.stringify(result))

        // 添加欢迎消息
        setMessages([
          { 
            role: "assistant", 
            content: `欢迎！我已经分析了文档 "${file.name}"，请随时向我提问关于这个文档的任何内容。` 
          }
        ]);
      } catch (error) {
        console.error("Error loading analysis:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    loadAnalysis()
  }, [params.id, router])

  useEffect(() => {
    // 当fileInfo更新时，设置初始modelQuality
    if (fileInfo) {
      setModelQuality(fileInfo.quality === 'fast' ? 'fast' : 'highQuality');
    }
  }, [fileInfo]);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 切换到其他PDF
  const switchToPdf = (id: string) => {
    router.push(`/analysis/${id}`)
  }

  // 上传新PDF
  const uploadNewPdf = () => {
    router.push('/')
  }

  // PDF 预览功能
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPdfError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF 加载失败:', error);
    setPdfError('无法加载 PDF 文件，请确认文件是否有效。');
  }

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.6));
  };

  // 切换模型质量
  const switchModelQuality = (quality: 'fast' | 'highQuality') => {
    setModelQuality(quality);
    
    // 更新本地存储中的文件质量设置
    if (fileInfo) {
      const updatedFileInfo = { ...fileInfo, quality: quality === 'fast' ? 'fast' : 'highQuality' };
      setFileInfo(updatedFileInfo);
      
      // 更新localStorage中的文件信息
      const files = JSON.parse(localStorage.getItem("uploadedPdfs") || "[]");
      const updatedFiles = files.map((f: any) => 
        f.id === updatedFileInfo.id ? updatedFileInfo : f
      );
      localStorage.setItem("uploadedPdfs", JSON.stringify(updatedFiles));
      
      // 添加模型切换消息
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `已切换到${quality === 'fast' ? '快速' : '高质量'}模式。` 
      }]);
    }
  };

  // 发送问题
  const handleSendQuestion = async () => {
    if (!question.trim() || !fileInfo) return;
    
    // 添加用户问题到消息列表
    const userQuestion = question;
    setMessages(prev => [...prev, { role: "user", content: userQuestion }]);
    setQuestion("");
    setAnswering(true);

    try {
      // 调用聊天API，传入当前选择的模型配置
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userQuestion,
          embeddingsFile: fileInfo.embeddingsFile,
          model: MODEL_CONFIGS[modelQuality].model,
          apiKey: MODEL_CONFIGS[modelQuality].apiKey
        }),
      });

      if (!response.ok) {
        throw new Error("聊天请求失败");
      }

      const data = await response.json();
      
      // 添加AI回答到消息列表
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (error) {
      console.error("聊天错误:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "抱歉，处理您的问题时出错了。请稍后再试。" 
      }]);
    } finally {
      setAnswering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mx-auto mb-4"></div>
          <p className="text-slate-600">{t("analyzingDocument")}</p>
        </div>
      </div>
    )
  }

  if (!fileInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">文件未找到</h1>
        <p className="text-gray-600 mb-6">无法找到指定的PDF文件</p>
        <Button onClick={() => window.location.href = "/"}>返回首页</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-slate-200 px-6 sm:px-10 py-4 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-slate-800">
            <div className="size-8 text-[#8b5cf6]">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path
                  clipRule="evenodd"
                  d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                  fill="currentColor"
                  fillRule="evenodd"
                ></path>
              </svg>
            </div>
            <h2 className="text-slate-800 text-xl font-bold leading-tight tracking-[-0.015em]">Maoge PDF</h2>
          </div>
          <div className="flex flex-1 justify-end gap-6 sm:gap-8 items-center">
            <LanguageSelector />
          </div>
        </header>

        <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
          {/* 左侧边栏 */}
          <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white">
            <Sidebar />
          </div>

          {/* PDF查看区域 */}
          <div className="flex-1 h-full border-r border-gray-200 overflow-hidden bg-gray-100" onClick={(e) => e.stopPropagation()}>
            {fileInfo?.url && (
              <div className="h-full">
                <PDFViewer file={fileInfo.url} />
              </div>
            )}
          </div>

          {/* 聊天区域 */}
          <div className="w-96 h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 文件信息头部 */}
            <div className="p-3 border-b border-gray-200 bg-white">
              <h2 className="text-base font-semibold truncate">{fileInfo?.name}</h2>
              <div className="flex items-center text-xs text-gray-500">
                <span className="mr-2">
                  {fileInfo?.uploadDate && new Date(fileInfo.uploadDate).toLocaleString()}
                </span>
                <span className="mr-2">·</span>
                <span className="mr-2">
                  {fileInfo && (fileInfo.size / (1024 * 1024)).toFixed(2)} MB
                </span>
                <span className="mr-2">·</span>
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                  {modelQuality === 'fast' ? '快速模式' : '高质量模式'}
                </span>
              </div>
            </div>
            
            {/* 模型质量选择按钮 */}
            <div className="p-3 flex justify-center space-x-4 border-b border-gray-200 bg-gray-50">
              <Button 
                variant={modelQuality === 'fast' ? 'default' : 'outline'}
                className={`w-24 ${modelQuality === 'fast' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  switchModelQuality('fast');
                }}
              >
                <Zap className="mr-2 h-4 w-4" />
                快速
              </Button>
              <Button 
                variant={modelQuality === 'highQuality' ? 'default' : 'outline'}
                className={`w-24 ${modelQuality === 'highQuality' ? 'bg-purple-500 hover:bg-purple-600' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  switchModelQuality('highQuality');
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                高质量
              </Button>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    msg.role === "user" ? "flex justify-end" : "flex justify-start"
                  }`}
                >
                  <div
                    className={`max-w-3/4 p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-[#8b5cf6] text-white"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => {
                    e.stopPropagation();
                    setQuestion(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleSendQuestion();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="向文档提问..."
                  className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent"
                  disabled={answering}
                />
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendQuestion();
                  }}
                  disabled={!question.trim() || answering}
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-l-none"
                >
                  {answering ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
