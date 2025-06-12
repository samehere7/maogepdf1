"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/language-selector"
import { MaogeInterface } from "@/components/chat-interface"
import { Download, InfoIcon as Insights, List, Flag, ZoomIn, ZoomOut, RotateCw, Send, FolderOpen, FileText, Plus, Zap, Sparkles, BookOpen, Brain } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { analyzeDocument } from "@/lib/openrouter"
import { UpgradeModal } from "@/components/upgrade-modal"
import { LoginModal } from "@/components/login-modal"
import { Sidebar } from "@/components/sidebar"
import dynamic from 'next/dynamic'
import * as pdfjsLib from 'pdfjs-dist'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FlashcardList from "@/components/flashcard-list"
import FlashcardStudy from "@/components/flashcard-study"

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
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
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
  const [modelQuality, setModelQuality] = useState<'fast' | 'highQuality'>('highQuality')
  
  // PDF 预览相关状态
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // 新增：存储示例问题
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
  
  // 闪卡相关状态
  const [activeTab, setActiveTab] = useState<'flashcards' | 'study'>('flashcards');

  useEffect(() => {
    const loadPDF = async () => {
      // 获取当前用户
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/auth/login');
        return;
      }
      
      setUser(user);

      try {
        setLoading(true);
        setPdfError(null);

        console.log(`[Analysis] 开始加载PDF，ID: ${params.id}, 用户: ${user.id}`);

        // 从API获取PDF信息
        const response = await fetch(`/api/pdfs/${params.id}/details`);
        
        if (!response.ok) {
          console.log('[Analysis] API请求失败:', response.status);
          setPdfError('无法获取PDF信息，请检查网络连接');
          setTimeout(() => router.push('/'), 3000);
          return;
        }
        
        const data = await response.json();
        const pdf = data.pdf;
        
        if (!pdf) {
          console.log('[Analysis] 数据库中未找到PDF');
          setPdfError('PDF文件未找到，可能已被删除或您没有访问权限');
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        console.log('[Analysis] 从数据库成功获取PDF信息');
        setFileInfo(pdf);

        // TODO: 从数据库加载分析结果，而不是localStorage
        // 这里暂时生成新的分析，后续可以添加分析结果的数据库存储
        try {
          const analysisData = await analyzeDocument(pdf.name);
          if (analysisData) {
            setAnalysis(analysisData);
          }
        } catch (err) {
          console.error('生成分析失败:', err);
          const fallbackAnalysis = {
            theme: '无法生成分析',
            mainPoints: [],
            conclusions: '暂时无法生成分析结果，但您仍可以提问文档相关问题。'
          };
          setAnalysis(fallbackAnalysis);
        }

        // 从数据库加载聊天记录
        const chatMessages = await loadChatMessages(pdf.id);
        
        if (chatMessages.length > 0) {
          setMessages(chatMessages);
        } else {
          // 设置并保存欢迎消息
          const greeting = `你好，PDF已加载成功！`;
          const summary = `一句话总结：${analysis?.theme || '本PDF内容丰富，欢迎提问。'}`;
          const welcomeMessages = [
            { role: "assistant", content: greeting },
            { role: "assistant", content: summary }
          ];
          setMessages(welcomeMessages);
          
          // 保存欢迎消息到数据库
          for (const msg of welcomeMessages) {
            await saveChatMessage(pdf.id, msg.content, msg.role === 'user');
          }
        }

      } catch (error) {
        console.error("Error loading PDF:", error);
        setPdfError('加载PDF失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [params.id, router, supabase]);

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
    
    // 更新模型质量设置（仅在前端状态中）
    if (fileInfo) {
      setFileInfo({ ...fileInfo, quality: quality === 'fast' ? 'fast' : 'highQuality' });
      
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

    // 保存用户问题到数据库
    await saveChatMessage(fileInfo.id, userQuestion, true);

    try {
      // 确保fileUrl是完整的URL路径
      const fileUrl = fileInfo.url.startsWith('http') 
        ? fileInfo.url 
        : (typeof window !== 'undefined' ? window.location.origin + fileInfo.url : fileInfo.url);
        
      console.log('发送聊天请求，文件URL:', fileUrl);
      
      // 调用聊天API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userQuestion }],
          fileUrl: fileUrl
        }),
      });

      if (!response.ok) {
        throw new Error("聊天请求失败");
      }

      const data = await response.json();
      const assistantReply = data.content || "无法生成回答";
      
      // 添加AI回答到消息列表
      setMessages(prev => [...prev, { role: "assistant", content: assistantReply }]);
      
      // 保存AI回答到数据库
      await saveChatMessage(fileInfo.id, assistantReply, false);
      
    } catch (error) {
      console.error("聊天错误:", error);
      const errorMessage = "抱歉，处理您的问题时出错了。请稍后再试。";
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: errorMessage 
      }]);
      
      // 保存错误消息到数据库
      await saveChatMessage(fileInfo.id, errorMessage, false);
    } finally {
      setAnswering(false);
    }
  };

  // 新增：检测PDF文件是否可访问
  useEffect(() => {
    if (fileInfo?.url) {
      // 确保URL是完整的
      const fullUrl = fileInfo.url.startsWith('http') ? fileInfo.url : 
                      (typeof window !== 'undefined' ? window.location.origin + fileInfo.url : fileInfo.url);
      console.log('检查PDF文件可访问性:', fullUrl);
      
      fetch(fullUrl, { method: 'HEAD' })
        .then(res => {
          if (!res.ok) {
            console.error('PDF文件不可访问:', res.status, res.statusText);
            setPdfError('PDF文件不存在或已损坏');
          } else {
            console.log('PDF文件可访问');
            setPdfError(null);
          }
        })
        .catch((err) => {
          console.error('PDF文件访问出错:', err);
          setPdfError('PDF文件不存在或已损坏');
        });
    }
  }, [fileInfo?.url]);

  // 加载聊天消息
  const loadChatMessages = async (documentId: string) => {
    try {
      const response = await fetch(`/api/chat-messages?documentId=${documentId}`);
      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    }
    return [];
  };

  // 保存聊天消息
  const saveChatMessage = async (documentId: string, content: string, isUser: boolean) => {
    try {
      await fetch('/api/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          content,
          isUser
        })
      });
    } catch (error) {
      console.error('保存聊天消息失败:', error);
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

  if (pdfError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">文件未找到</h1>
        <p className="text-gray-600 mb-6">{pdfError}</p>
        <Button onClick={() => window.location.href = "/"}>返回首页</Button>
      </div>
    );
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
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧边栏 */}
        <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white">
          <Sidebar />
        </div>

        {/* 中间内容区：PDF + 闪卡 */}
        <div className="flex-1 flex flex-col min-w-[400px] max-w-[700px] border-r border-gray-200">
          {/* PDF文件信息 */}
          <div className="p-3 border-b border-gray-200 bg-white flex-shrink-0">
            <h2 className="text-base font-semibold truncate">{fileInfo?.name}</h2>
            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-2">
                {fileInfo?.uploadDate && new Date(fileInfo.uploadDate).toLocaleString()}
              </span>
              <span className="mr-2">·</span>
              <span className="mr-2">
                {fileInfo && (fileInfo.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          </div>

          {/* PDF查看区域 */}
          <div className="flex-1 overflow-hidden bg-gray-100" onClick={(e) => e.stopPropagation()}>
            {pdfError ? (
              <div className="flex items-center justify-center h-full text-red-500">{pdfError}</div>
            ) : fileInfo?.url && (
              <div className="h-full">
                <PDFViewer 
                  file={fileInfo.url.startsWith('http') ? fileInfo.url : 
                        (typeof window !== 'undefined' ? window.location.origin + fileInfo.url : fileInfo.url)} 
                />
              </div>
            )}
          </div>

          {/* 闪卡功能区 */}
          <div className="h-64 border-t border-gray-200 bg-white flex-shrink-0">
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 border-b flex-shrink-0">
                <TabsTrigger value="flashcards" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  闪卡
                </TabsTrigger>
                <TabsTrigger value="study" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  学习
                </TabsTrigger>
              </TabsList>

              <TabsContent value="flashcards" className="flex-1 m-0 overflow-hidden">
                <FlashcardList pdfId={params.id as string} className="h-full overflow-y-auto" />
              </TabsContent>

              <TabsContent value="study" className="flex-1 m-0 overflow-hidden">
                <FlashcardStudy 
                  pdfId={params.id as string} 
                  onComplete={() => setActiveTab('flashcards')}
                  className="h-full overflow-y-auto" 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* 右侧聊天区 */}
        <div className="w-96 flex-shrink-0 h-full flex flex-col bg-white" onClick={(e) => e.stopPropagation()}>
          {/* 聊天标题 */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Send className="h-5 w-5 text-[#8b5cf6]" />
              对话
            </h3>
            <div className="text-sm text-gray-500 mt-1">
              当前模式: {modelQuality === 'fast' ? '快速模式' : '高质量模式'}
            </div>
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
                  className={`max-w-[85%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-white border border-gray-200 shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {/* 示例问题按钮 */}
            {exampleQuestions.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {exampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded cursor-pointer text-sm text-purple-800 transition"
                    onClick={() => setQuestion(q)}
                  >
                    你可以问我：{q}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 模型选择按钮 */}
          <div className="p-3 flex justify-center space-x-3 border-t border-gray-200 bg-gray-50">
            <Button 
              variant={modelQuality === 'fast' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 ${modelQuality === 'fast' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
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
              size="sm"
              className={`flex-1 ${modelQuality === 'highQuality' ? 'bg-purple-500 hover:bg-purple-600' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                switchModelQuality('highQuality');
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              高质量
            </Button>
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
                className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent"
                disabled={answering}
              />
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendQuestion();
                }}
                disabled={!question.trim() || answering}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-l-none px-4"
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
  );
}