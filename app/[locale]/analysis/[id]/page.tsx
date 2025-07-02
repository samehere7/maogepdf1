"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/language-selector"
import { MaogeInterface } from "@/components/chat-interface"
import { Download, InfoIcon as Insights, List, Flag, ZoomIn, ZoomOut, RotateCw, Send, FolderOpen, FileText, Plus, Zap, Sparkles, BookOpen, Brain, Share2 } from "lucide-react"
import { useLocale, useTranslations } from 'next-intl'
import { analyzeDocument } from "@/lib/openrouter"
import { UpgradeModal } from "@/components/upgrade-modal"
import { LoginModal } from "@/components/login-modal"
import { Sidebar } from "@/components/sidebar"
import { supabase } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import FlashcardCreateModal from "@/components/flashcard-create-modal"
import FlashcardManager from "@/components/flashcard-manager"
import FlashcardPractice from "@/components/flashcard-practice"
import FlashcardResults from "@/components/flashcard-results"
import { PageAnchorText } from "@/components/page-anchor-button"
import { WelcomeQuestions, WelcomeQuestionsLoading } from "@/components/welcome-questions"
import { generatePDFQuestions } from "@/lib/pdf-question-generator"
import { extractTextFromPDF } from "@/lib/pdf-text-extractor"
import ShareChatModal from "@/components/share-chat-modal"
import PDFOutlineNavigator from "@/components/pdf-outline-navigator"
import MinimalPdfViewer from "@/components/MinimalPdfViewer"
import PdfOutlineSidebar from "@/components/PdfOutlineSidebar"

interface AnalysisResult {
  theme: string
  mainPoints: Array<{
    title: string
    reference: string
    description: string
  }>
  conclusions: string
}

interface OutlineItem {
  title: string;
  dest: any;
  items?: OutlineItem[];
  pageNumber?: number;
  level: number;
}

// 移除硬编码的API密钥配置，改为通过后端API调用

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const hookLocale = useLocale()
  const t = useTranslations()
  const tAnalysis = useTranslations('analysis')
  
  // 修复：从URL直接提取locale确保多语言功能正常
  const [actualLocale, setActualLocale] = useState(hookLocale);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const urlLocale = pathSegments[0];
      const validLocales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt-BR', 'ru', 'it', 'nl', 'sv', 'da', 'no', 'fi', 'pl', 'tr', 'hi', 'bn', 'pa', 'kn', 'th', 'vi', 'id', 'ms'];
      
      if (validLocales.includes(urlLocale)) {
        setActualLocale(urlLocale);
      }
    }
  }, [hookLocale]);
  
  const locale = actualLocale;
  
  // Locale防护机制
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const pathSegments = currentPath.split('/').filter(Boolean)
      const firstSegment = pathSegments[0]
      
      // 检查URL是否包含有效的locale前缀
      const validLocales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt-BR', 'ru', 'it', 'nl', 'sv', 'da', 'no', 'fi', 'pl', 'tr', 'hi', 'bn', 'pa', 'kn', 'th', 'vi', 'id', 'ms']
      const hasValidLocale = validLocales.includes(firstSegment)
      
      // 如果URL缺少locale前缀，执行重定向
      if (!hasValidLocale && pathSegments.length >= 2 && pathSegments[0] === 'analysis') {
        const targetLocale = locale || 'en'
        const newPath = `/${targetLocale}${currentPath}`
        console.log('[Locale防护] 检测到缺少locale前缀，重定向到:', newPath)
        window.location.href = newPath
        return
      }
    }
  }, [locale])
  const [user, setUser] = useState<any>(null)
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
  
  // 新增：存储PDF文本内容
  const [pdfTextContent, setPdfTextContent] = useState<string>('');
  
  // 闪卡相关状态
  const [activeTab, setActiveTab] = useState<'flashcards' | 'study'>('flashcards');
  
  // PDF标题编辑状态
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  
  // PDF查看器ref（已简化为MinimalPdfViewer，无需ref）
  
  // 客户端渲染检查
  const [isClient, setIsClient] = useState(false);
  
  // 欢迎问题相关状态
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeQuestions, setWelcomeQuestions] = useState<any[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  
  // 分享弹窗状态
  const [showShareModal, setShowShareModal] = useState(false);
  
  
  // PDF目录相关状态
  const [pdfOutline, setPdfOutline] = useState<OutlineItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 本地PDF文件状态（用于即时预览）
  const [localPdfFile, setLocalPdfFile] = useState<File | null>(null);
  
  // 计算最终的PDF文件（本地文件优先，否则使用URL）
  const finalPdfFile = useMemo(() => {
    console.log('[分析页] 重新计算finalPdfFile - localPdfFile:', localPdfFile, 'pdfUrl:', pdfUrl);
    
    if (localPdfFile) {
      console.log('[分析页] 使用本地PDF文件:', localPdfFile.name);
      return localPdfFile;
    }
    if (pdfUrl && typeof pdfUrl === 'string' && pdfUrl.trim()) {
      const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : 
        (typeof window !== 'undefined' ? window.location.origin + pdfUrl : pdfUrl);
      console.log('[分析页] 使用远程PDF URL:', fullUrl);
      return fullUrl;
    }
    console.log('[分析页] 没有可用的PDF文件');
    return null;
  }, [localPdfFile, pdfUrl]);
  
  // 闪卡功能状态
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [flashcardView, setFlashcardView] = useState<'none' | 'create' | 'manage' | 'practice' | 'results'>('none');
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [practiceResults, setPracticeResults] = useState<any>(null)
  const [shouldOpenFlashcard, setShouldOpenFlashcard] = useState(false) // 记录是否需要打开闪卡
  
  // 计算PDF闪卡计数 - 使用useMemo避免无限循环
  const pdfFlashcardCounts = useMemo(() => {
    if (!fileInfo?.id) return {}
    
    // 尝试从本地存储获取闪卡数量
    try {
      const storageKey = `flashcards_${fileInfo.id}`
      const localData = localStorage.getItem(storageKey)
      if (localData) {
        const localFlashcards = JSON.parse(localData)
        if (Array.isArray(localFlashcards)) {
          return { [fileInfo.id]: localFlashcards.length }
        }
      }
    } catch (error) {
      console.error('[分析页] 获取本地闪卡数量失败:', error)
    }
    
    // 降级使用状态中的flashcards
    return flashcards.length > 0 ? { [fileInfo.id]: flashcards.length } : {}
  }, [fileInfo?.id, flashcards.length]);

  useEffect(() => {
    setIsClient(true);
    
    // 早期检查URL参数
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('flashcard') === 'true') {
        console.log('[分析页] 早期检测到flashcard参数，标记需要打开闪卡');
        setShouldOpenFlashcard(true);
        // 清除URL参数
        window.history.replaceState({}, '', `/${locale}/analysis/${params.id}`);
      }
    }
  }, [params.id]);

  useEffect(() => {
    console.log('[分析页] PDF加载useEffect触发，参数:', { id: params.id, locale })
    
    const loadPDF = async () => {
      // 获取当前用户
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        setLoading(false);
        router.push(`/${locale}/auth/login`);
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
          setLoading(false);
          setTimeout(() => router.push('/'), 3000);
          return;
        }
        
        const data = await response.json();
        const pdf = data.pdf;
        
        if (!pdf) {
          console.log('[Analysis] 数据库中未找到PDF');
          setPdfError('PDF文件未找到，可能已被删除或您没有访问权限');
          setLoading(false);
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        console.log('[Analysis] 从数据库成功获取PDF信息');
        setFileInfo(pdf);

        // 优先检查本地缓存的PDF文件用于即时预览
        const localPdfKey = `pdf_local_${pdf.id}`;
        const localPdfData = sessionStorage.getItem(localPdfKey);
        
        if (localPdfData) {
          console.log('[PDF预览] 找到本地缓存数据，启用即时预览');
          // 将base64数据转换为File对象
          try {
            const response = await fetch(localPdfData);
            const blob = await response.blob();
            const file = new File([blob], pdf.name, { type: 'application/pdf' });
            setLocalPdfFile(file);
            console.log('[PDF预览] 本地文件对象创建成功');
          } catch (error) {
            console.warn('[PDF预览] 本地文件转换失败，使用远程URL:', error);
            setLocalPdfFile(null);
          }
          // 清理本地缓存（一次性使用）
          sessionStorage.removeItem(localPdfKey);
        } else {
          console.log('[PDF预览] 使用远程PDF URL');
          setLocalPdfFile(null);
        }
        
        setPdfUrl(pdf.url);

        // 从数据库加载聊天记录
        const chatMessages = await loadChatMessages(pdf.id);
        console.log('[智能推荐] 加载的聊天记录数量:', chatMessages.length);
        
        // 如果是首次访问（没有聊天记录），显示欢迎问题
        if (chatMessages.length === 0) {
          console.log('[欢迎问题] 首次访问，准备生成欢迎问题');
          setIsGeneratingQuestions(true);
          // 异步生成欢迎问题，不阻塞PDF加载
          generateWelcomeQuestions(pdf.url, pdf.name);
        } else {
          // 直接加载聊天记录
          console.log('[聊天记录] 加载现有聊天记录');
          setMessages(chatMessages);
        }

        // 分离PDF加载和文档分析，避免分析阻塞PDF显示
        setLoading(false); // 先让PDF显示，分析可以异步进行
        
        // 异步执行文档分析，不阻塞PDF显示
        setTimeout(async () => {
          try {
            console.log('[分析页] 开始生成文档分析');
            const analysisData = await analyzeDocument(pdf.name);
            if (analysisData) {
              setAnalysis(analysisData);
              console.log('[分析页] 文档分析完成');
            }
          } catch (err) {
            console.error('[分析页] 生成分析失败:', err);
            const fallbackAnalysis = {
              theme: '无法生成分析',
              mainPoints: [],
              conclusions: '暂时无法生成分析结果，但您仍可以提问文档相关问题。'
            };
            setAnalysis(fallbackAnalysis);
          }
        }, 100);

      } catch (error) {
        console.error("Error loading PDF:", error);
        setPdfError('加载PDF失败，请重试');
        setLoading(false);
      }
    };

    loadPDF();
  }, [params.id, router, locale]);

  // 监听PDF删除事件，处理页面导航
  useEffect(() => {
    const handlePdfDeleted = (event: CustomEvent) => {
      const { deletedId, nextPdfId } = event.detail;
      
      // 如果删除的是当前正在查看的PDF
      if (deletedId === params.id) {
        console.log('[PDF删除导航] 当前PDF被删除，下一个PDF ID:', nextPdfId);
        
        if (nextPdfId) {
          // 导航到下一个PDF
          router.push(`/${locale}/analysis/${nextPdfId}`);
        } else {
          // 没有其他PDF了，回到主页
          router.push(`/${locale}`);
        }
      }
    };

    window.addEventListener('pdf-deleted', handlePdfDeleted as EventListener);

    return () => {
      window.removeEventListener('pdf-deleted', handlePdfDeleted as EventListener);
    };
  }, [params.id, router]);

  // 当PDF加载完成且需要打开闪卡时，自动切换到闪卡界面
  useEffect(() => {
    if (fileInfo && shouldOpenFlashcard) {
      console.log('[分析页] PDF加载完成，自动打开闪卡管理界面');
      setFlashcardView('manage');
      setShouldOpenFlashcard(false); // 清除标记
    }
  }, [fileInfo, shouldOpenFlashcard]);

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
    router.push(`/${locale}/analysis/${id}`)
  }

  // 上传新PDF
  const uploadNewPdf = () => {
    router.push(`/${locale}`)
  }

  // 处理PDF目录加载
  const handleOutlineLoaded = useCallback((outline: OutlineItem[]) => {
    console.log('[PDF目录] 接收到目录数据:', outline.length, '项');
    setPdfOutline(outline);
  }, []);

  // 处理跳转到指定页面（MinimalPdfViewer暂不支持页面跳转）
  const handleJumpToPage = (pageNumber: number) => {
    console.log('[PDF目录] 页面跳转功能已简化，当前请求跳转到页面:', pageNumber);
    // TODO: 如需要页面跳转功能，可在后续版本中实现
  };

  // 更新当前页面（MinimalPdfViewer已简化，移除页面监听）
  useEffect(() => {
    // MinimalPdfViewer不需要复杂的页面监听
    console.log('[分析页] PDF查看器已简化，不再监听页面变化');
  }, []);

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
        content: quality === 'fast' ? tAnalysis('switchedToFastMode') : tAnalysis('switchedToHighQualityMode')
      }]);
    }
  };

  // 发送问题
  const handleSendQuestion = async (customQuestion?: string) => {
    const questionToSend = customQuestion || question;
    if (!questionToSend.trim() || !fileInfo) return;
    
    // 检查用户登录状态
    if (!user) {
      console.warn('[聊天] 用户未登录，无法发送消息');
      router.push(`/${locale}/auth/login`);
      return;
    }
    
    // 添加用户问题到消息列表
    const userQuestion = questionToSend;
    setMessages(prev => [...prev, { role: "user", content: userQuestion }]);
    setQuestion("");
    setAnswering(true);
    
    // 立即显示"正在思考"状态
    const thinkingMessage = { role: "assistant" as const, content: `🤔 ${tAnalysis('analyzingPdfContent')}` };
    setMessages(prev => [...prev, thinkingMessage]);

    // 保存用户问题到数据库
    const userSaveSuccess = await saveChatMessage(fileInfo.id, userQuestion, true);
    if (!userSaveSuccess) {
      console.warn('[聊天记录] 用户消息保存失败，但继续处理请求');
    }

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
          pdfId: fileInfo.id,
          quality: modelQuality,
          locale: locale
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("聊天请求失败:", response.status, errorText);
        throw new Error(`聊天请求失败: ${response.status}`);
      }

      const data = await response.json();
      console.log("聊天API响应:", data);
      const assistantReply = data.content || "无法生成回答";
      
      // 替换thinking消息为实际AI回答
      setMessages(prev => {
        const newMessages = [...prev];
        // 移除最后的thinking消息，添加实际回答
        newMessages.pop();
        newMessages.push({ role: "assistant", content: assistantReply });
        return newMessages;
      });
      
      // 保存AI回答到数据库
      const assistantSaveSuccess = await saveChatMessage(fileInfo.id, assistantReply, false);
      if (!assistantSaveSuccess) {
        console.warn('[聊天记录] AI回答保存失败');
      }
      
    } catch (error) {
      console.error("聊天错误:", error);
      const errorMessage = "抱歉，处理您的问题时出错了。请稍后再试。";
      
      // 替换thinking消息为错误消息
      setMessages(prev => {
        const newMessages = [...prev];
        // 移除最后的thinking消息，添加错误消息
        newMessages.pop();
        newMessages.push({ role: "assistant", content: errorMessage });
        return newMessages;
      });
      
      // 保存错误消息到数据库
      const errorSaveSuccess = await saveChatMessage(fileInfo.id, errorMessage, false);
      if (!errorSaveSuccess) {
        console.warn('[聊天记录] 错误消息保存失败');
      }
    } finally {
      setAnswering(false);
    }
  };

  // 新增：检测PDF文件是否可访问
  useEffect(() => {
    console.log('[分析页] PDF可访问性检查useEffect触发，fileInfo.url:', fileInfo?.url)
    
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
      console.log('[聊天记录] 开始加载聊天消息，文档ID:', documentId);
      const response = await fetch(`/api/chat-messages?documentId=${documentId}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[聊天记录] 加载成功，消息数量:', data.messages?.length || 0);
        return data.messages || [];
      } else {
        const errorData = await response.json();
        console.error('[聊天记录] 加载失败:', response.status, errorData);
        if (response.status === 401) {
          console.log('[聊天记录] 用户未登录，跳转到登录页');
          router.push(`/${locale}/auth/login`);
        }
      }
    } catch (error) {
      console.error('[聊天记录] 加载聊天记录异常:', error);
    }
    return [];
  };

  // 保存聊天消息
  const saveChatMessage = async (documentId: string, content: string, isUser: boolean) => {
    try {
      console.log('[聊天记录] 开始保存聊天消息，文档ID:', documentId, '是否用户消息:', isUser, '内容长度:', content.length);
      
      const response = await fetch('/api/chat-messages', {
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

      if (response.ok) {
        const data = await response.json();
        console.log('[聊天记录] 保存成功，消息ID:', data.id);
        return true;
      } else {
        const errorData = await response.json();
        console.error('[聊天记录] 保存失败:', response.status, errorData);
        if (response.status === 401) {
          console.log('[聊天记录] 用户未登录，无法保存消息');
        }
        return false;
      }
    } catch (error) {
      console.error('[聊天记录] 保存聊天消息异常:', error);
      return false;
    }
  };

  // 处理PDF文本选择
  const handleTextSelect = (text: string, action: 'explain' | 'summarize' | 'rewrite') => {
    let prompt = '';
    
    switch (action) {
      case 'explain':
        prompt = `解释："${text}"。`;
        break;
      case 'summarize':
        prompt = `总结："${text}"。`;
        break;
      case 'rewrite':
        prompt = `改写："${text}"。`;
        break;
    }
    
    // 直接发送自定义问题
    handleSendQuestion(prompt);
  };

  // 生成欢迎问题
  const generateWelcomeQuestions = async (pdfUrl: string, fileName: string) => {
    try {
      console.log('[欢迎问题] 开始生成推荐问题...');
      setIsGeneratingQuestions(true);
      
      // 提取PDF文本内容
      const pdfContent = await extractTextFromPDF(pdfUrl);
      console.log('[欢迎问题] PDF内容提取完成，长度:', pdfContent.length);
      
      // 保存PDF内容到状态中，供闪卡创建使用
      setPdfTextContent(pdfContent);
      
      // 生成推荐问题
      const questions = await generatePDFQuestions(pdfContent, fileName);
      console.log('[欢迎问题] 推荐问题生成完成:', questions);
      
      setWelcomeQuestions(questions);
      setShowWelcome(true);
      
    } catch (error) {
      console.error('[欢迎问题] 生成推荐问题失败:', error);
      // 即使失败也显示欢迎界面，但不包含推荐问题
      setWelcomeQuestions([]);
      setShowWelcome(true);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // 处理推荐问题点击
  const handleWelcomeQuestionClick = (questionText: string) => {
    console.log('[欢迎问题] 用户点击问题:', questionText);
    
    // 直接调用handleSendQuestion，它会处理消息添加
    handleSendQuestion(questionText);
    
    // 隐藏欢迎界面
    setShowWelcome(false);
  };

  // 跳转到指定页面的函数（MinimalPdfViewer已简化）
  const handlePageJump = (pageNumber: number) => {
    console.log(`[页码跳转] 简化版PDF查看器，暂不支持页面跳转到第${pageNumber}页`);
    // TODO: 如需要页面跳转功能，可在后续版本的PDF查看器中实现
  };

  // 渲染包含页码链接的文本
  const renderTextWithPageLinks = (text: string) => {
    if (!text) return text;
    
    // 匹配页码模式：增强版，支持更多格式
    const pagePatterns = [
      /第(\d+)页/g,                    // 第X页
      /根据第(\d+)页/g,                // 根据第X页
      /如第(\d+)页所示/g,              // 如第X页所示
      /第(\d+)页提到/g,                // 第X页提到
      /第(\d+)页的?内容/g,             // 第X页内容/第X页的内容
      /第(\d+)页描述/g,                // 第X页描述
      /页码?(\d+)/g,                   // 页X/页码X
      /第(\d+)-(\d+)页/g,              // 第X-Y页
      /(\d+)页/g,                      // X页
      /（第(\d+)页）/g,                // （第X页）
      /\(第(\d+)页\)/g,                // (第X页)
      /见第(\d+)页/g,                  // 见第X页
      /参考第(\d+)页/g,                // 参考第X页
      /详见第(\d+)页/g,                // 详见第X页
      /第(\d+)页中/g,                  // 第X页中
      /第(\d+)页说明/g,                // 第X页说明
      /第(\d+)页指出/g                 // 第X页指出
    ];
    
    let processedText = text;
    const pageReferences: Array<{pageNum: number, originalText: string}> = [];
    
    // 提取所有页码引用
    pagePatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const fullMatch = match[0];
        // 处理不同的捕获组结构 - 增强版
        let pageNum: number;
        if (pattern.source.includes('（第') || pattern.source.includes('\\(第')) {
          // 处理括号格式：（第X页）或(第X页)
          pageNum = parseInt(match[1]);
        } else if (pattern.source.includes('第') && pattern.source.includes('-')) {
          // 处理范围格式：第X-Y页，取第一个数字
          pageNum = parseInt(match[1]);
        } else if (pattern.source.includes('根据第') || pattern.source.includes('如第') || 
                   pattern.source.includes('见第') || pattern.source.includes('参考第') || 
                   pattern.source.includes('详见第')) {
          // 处理复合格式：根据第X页、如第X页所示等
          pageNum = parseInt(match[1]);
        } else {
          // 其他格式，取第一个捕获组
          pageNum = parseInt(match[1]);
        }
        
        if (pageNum > 0 && numPages && pageNum <= numPages) {
          pageReferences.push({
            pageNum,
            originalText: fullMatch
          });
        }
      });
    });
    
    // 如果没有页码引用，返回原文本
    if (pageReferences.length === 0) {
      return <span>{text}</span>;
    }
    
    // 分割文本并插入页码按钮
    const parts = [];
    let lastIndex = 0;
    
    // 重新匹配所有页码引用以获取正确的位置
    const allMatches: Array<{index: number; length: number; pageNum: number; text: string}> = [];
    pagePatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        // 处理不同的捕获组结构 - 增强版（第二处）
        let pageNum: number;
        if (pattern.source.includes('（第') || pattern.source.includes('\\(第')) {
          // 处理括号格式：（第X页）或(第X页)
          pageNum = parseInt(match[1]);
        } else if (pattern.source.includes('第') && pattern.source.includes('-')) {
          // 处理范围格式：第X-Y页，取第一个数字
          pageNum = parseInt(match[1]);
        } else if (pattern.source.includes('根据第') || pattern.source.includes('如第') || 
                   pattern.source.includes('见第') || pattern.source.includes('参考第') || 
                   pattern.source.includes('详见第')) {
          // 处理复合格式：根据第X页、如第X页所示等
          pageNum = parseInt(match[1]);
        } else {
          // 其他格式，取第一个捕获组
          pageNum = parseInt(match[1]);
        }
        
        if (pageNum > 0 && numPages && pageNum <= numPages) {
          allMatches.push({
            index: match.index || 0,
            length: match[0].length,
            pageNum,
            text: match[0]
          });
        }
      });
    });
    
    // 按位置排序
    allMatches.sort((a, b) => a.index - b.index);
    
    // 构建结果
    allMatches.forEach((match, i) => {
      // 添加匹配前的文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${i}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // 添加页码按钮 - 区分括号格式和普通格式
      const isParentheses = match.text.includes('（') || match.text.includes('(');
      
      if (isParentheses) {
        // 括号格式：显示为高亮文字样式
        parts.push(
          <span
            key={`page-${i}`}
            className="inline cursor-pointer text-blue-600 hover:text-blue-800 font-medium underline decoration-dotted underline-offset-2 transition-colors duration-200"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePageJump(match.pageNum);
            }}
            title={`点击跳转到第${match.pageNum}页`}
          >
            {match.text}
          </span>
        );
      } else {
        // 普通格式：使用增强的圆形数字样式（页码气泡）
        parts.push(
          <span
            key={`page-${i}`}
            className="page-bubble"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // 添加点击动画效果
              e.currentTarget.classList.add('page-bubble-click');
              setTimeout(() => {
                e.currentTarget.classList.remove('page-bubble-click');
              }, 200);
              
              // 执行页面跳转
              handlePageJump(match.pageNum);
              
              console.log(`[页码气泡] 用户点击页码 ${match.pageNum}`);
            }}
            title={`点击跳转到第${match.pageNum}页`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePageJump(match.pageNum);
              }
            }}
          >
            {match.pageNum}
          </span>
        );
      }
      
      lastIndex = match.index + match.length;
    });
    
    // 添加最后部分的文本
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return <>{parts}</>;
  };




  // 移除全屏loading，在主界面中显示加载状态

  if (pdfError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">{t('chat.fileNotFound')}</h1>
        <p className="text-gray-600 mb-6">{pdfError}</p>
        <Button onClick={() => window.location.href = `/${locale}`}>{t('chat.backToHome')}</Button>
      </div>
    );
  }

  if (!fileInfo && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">{t('chat.fileNotFound')}</h1>
        <p className="text-gray-600 mb-6">{t('chat.cannotFindSpecifiedPdf')}</p>
        <Button onClick={() => window.location.href = `/${locale}`}>{t('chat.backToHome')}</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧边栏 - 固定宽度与主页一致 */}
      <div className="w-80 min-w-[240px] max-w-[320px] flex-shrink-0 border-r border-gray-200 bg-white">
        <Sidebar 
          pdfFlashcardCounts={pdfFlashcardCounts} 
          onFlashcardClick={(pdfId, pdfName) => {
            if (pdfId === fileInfo?.id) {
              // 如果是当前PDF的闪卡，直接打开管理界面
              setFlashcardView('manage');
            } else {
              // 如果是其他PDF的闪卡，跳转到对应页面并打开闪卡
              router.push(`/${locale}/analysis/${pdfId}?flashcard=true`);
            }
          }}
        />
      </div>

      {/* 中间PDF展示区 - 在闪卡模式下隐藏 */}
      {flashcardView === 'none' && (
        <div className="flex-1 flex flex-col min-w-[400px] border-r border-gray-200 bg-gray-50">
        {/* PDF文件信息 */}
        <div className="p-3 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            {isEditingTitle ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={async (e: React.FocusEvent<HTMLInputElement>) => {
                  if (editingTitle.trim() && editingTitle !== fileInfo?.name) {
                    try {
                      const response = await fetch(`/api/pdfs/${params.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name: editingTitle.trim() }),
                      });
                      
                      if (response.ok) {
                        setFileInfo((prev: any) => prev ? {...prev, name: editingTitle.trim()} : null);
                        // 通知侧边栏刷新PDF列表
                        window.dispatchEvent(new CustomEvent('pdf-renamed', { 
                          detail: { id: params.id, newName: editingTitle.trim() } 
                        }));
                      } else {
                        console.error('重命名失败');
                        setEditingTitle(fileInfo?.name || '');
                      }
                    } catch (error) {
                      console.error('重命名出错:', error);
                      setEditingTitle(fileInfo?.name || '');
                    }
                  }
                  setIsEditingTitle(false);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="text-base font-semibold bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none flex-1"
                autoFocus
              />
            ) : (
              <h2 
                className="text-base font-semibold truncate cursor-pointer hover:text-purple-600 transition-colors"
                onClick={() => {
                  setIsEditingTitle(true);
                  setEditingTitle(fileInfo?.name || '');
                }}
                title="点击重命名"
              >
                {fileInfo?.name}
              </h2>
            )}
            <div className="flex items-center gap-2 ml-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                title="分享聊天"
                onClick={() => setShowShareModal(true)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-1">
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
        <div className="flex-1 flex flex-col overflow-hidden bg-white" onClick={(e) => e.stopPropagation()}>
          {/* PDF展示区 */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
                  <p className="text-slate-600">{t('loadingPdf')}...</p>
                </div>
              </div>
            ) : pdfError ? (
              <div className="flex items-center justify-center h-full text-red-500">{pdfError}</div>
            ) : fileInfo?.url ? (
              <div className="h-full">
                {isClient ? (
                    <MinimalPdfViewer 
                      file={finalPdfFile}
                    />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
                      <p className="text-slate-600">{t('initializingPdfViewer')}...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <p>{t('noPdfFile')}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* 闪卡和分享按钮 - 移动到PDF下方 */}
          <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300"
                onClick={() => {
                  setShowFlashcardModal(true);
                }}
              >
                <BookOpen className="h-4 w-4" />
                {t('flashcard.createFlashcard')}
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => {
                  setShowShareModal(true);
                }}
              >
                <Share2 className="h-4 w-4" />
                {t('share.shareThisPdf')}
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}


      {/* 右侧聊天区/闪卡区 - 在闪卡模式下占据更多空间 */}
      <div className={`${flashcardView === 'none' ? 'flex-1' : 'flex-[2]'} flex-shrink-0 h-full flex flex-col bg-white`} onClick={(e) => e.stopPropagation()}>
        {flashcardView === 'manage' ? (
          /* 闪卡管理界面 */
          fileInfo && (
            <FlashcardManager
              pdfId={fileInfo.id}
              pdfName={fileInfo.name}
              initialFlashcards={flashcards}
              onBack={() => setFlashcardView('none')}
              onStartPractice={(cards) => {
                setFlashcards(cards);
                setFlashcardView('practice');
              }}
              onAddFlashcard={() => {
                setFlashcardView('none');
                setShowFlashcardModal(true);
              }}
            />
          )
        ) : flashcardView === 'practice' ? (
          /* 闪卡练习界面 */
          fileInfo && (
            <FlashcardPractice
              flashcards={flashcards}
              pdfId={fileInfo.id}
              onBack={() => setFlashcardView('manage')}
              onComplete={(results, updatedFlashcards) => {
                setPracticeResults(results);
                setFlashcards(updatedFlashcards); // 更新闪卡数据
                setFlashcardView('results');
              }}
            />
          )
        ) : flashcardView === 'results' ? (
          /* 闪卡结果界面 */
          fileInfo && practiceResults && (
            <FlashcardResults
              results={practiceResults}
              pdfName={fileInfo.name}
              onBack={() => setFlashcardView('manage')}
              onPracticeAgain={() => setFlashcardView('practice')}
            />
          )
        ) : (
          /* 默认聊天界面 */
          <>
            {/* 聊天标题 */}
            <div className="p-3 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Send className="h-5 w-5 text-[#8b5cf6]" />
{t('chat.conversation')}
              </h3>
              <div className="text-sm text-gray-500 mt-1">
{t('chat.currentMode')}: {modelQuality === 'fast' ? t('chat.fastMode') : t('chat.highQualityMode')}
              </div>
            </div>

          {/* 消息区域 */}
          <TooltipProvider>
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Send className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-600 mb-2">{t('chat.preparingChatEnvironment')}</p>
                    <p className="text-gray-400 text-sm">{t('chat.chatAvailableAfterPdfLoad')}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* 欢迎问题组件 */}
                  {(showWelcome || isGeneratingQuestions) && fileInfo && (
                    <div className="mb-4">
                      {isGeneratingQuestions ? (
                        <WelcomeQuestionsLoading pdfName={fileInfo.name} />
                      ) : (
                        <WelcomeQuestions
                          pdfName={fileInfo.name}
                          questions={welcomeQuestions}
                          onQuestionClick={handleWelcomeQuestionClick}
                          onClose={() => setShowWelcome(false)}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* 聊天消息 */}
                  {messages.map((msg, index) => {
                console.log(`[渲染消息] 索引${index}:`, msg);
                return (
                  <div
                    key={index}
                    className={`mb-4 ${
                      msg.role === "user" ? "flex justify-end" : "flex justify-start"
                    }`}
                  >
                    {/* 移除智能推荐功能，直接显示普通消息 */}
                    {msg.content === "SMART_RECOMMENDATIONS" ? null : (
                    // 普通聊天消息
                    <div
                      className={`max-w-[85%] p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-[#8b5cf6] text-white"
                          : "bg-white border border-gray-200 shadow-sm"
                      }`}
                    >
                      <div className="whitespace-pre-wrap overflow-hidden">
                        {/* 使用 PageAnchorText 组件支持【X】格式页码跳转 */}
                        <div className="text-xs leading-relaxed">
                          <PageAnchorText 
                            content={msg.content} 
                            onPageClick={handlePageJump}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                );
              })}
                </>
              )}
            {/* 示例问题按钮 - 只在非加载状态显示 */}
            {!loading && exampleQuestions.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {exampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded cursor-pointer text-xs text-purple-800 transition"
                    onClick={() => setQuestion(q)}
                  >
{t('youCanAskMe')}: {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
            </div>
          </TooltipProvider>

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
{tAnalysis('fast')}
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
{tAnalysis('highQuality')}
            </Button>
          </div>


          {/* 输入区域 */}
          <div className="p-3 border-t border-gray-200 bg-white">
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
                placeholder={loading ? t('common.loading') : tAnalysis('askDocument')}
                className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent"
                disabled={answering || loading}
              />
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendQuestion();
                }}
                disabled={!question.trim() || answering || loading}
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
          </>
        )}
      </div>

      {/* 分享聊天记录弹窗 */}
      {fileInfo && (
        <ShareChatModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          pdfId={fileInfo.id}
          pdfName={fileInfo.name}
        />
      )}

      {/* 闪卡创建弹窗 */}
      {fileInfo && (
        <FlashcardCreateModal
          isOpen={showFlashcardModal}
          onClose={() => setShowFlashcardModal(false)}
          pdfId={fileInfo.id}
          pdfName={fileInfo.name}
          pdfContent={pdfTextContent}
          onSuccess={(newFlashcards) => {
            // 合并新闪卡与现有闪卡
            const mergedFlashcards = [...flashcards, ...newFlashcards];
            setFlashcards(mergedFlashcards);
            setFlashcardView('manage');
            
            // 保存合并后的闪卡到本地存储
            try {
              const storageKey = `flashcards_${fileInfo.id}`;
              localStorage.setItem(storageKey, JSON.stringify(mergedFlashcards));
              console.log('[闪卡创建] 新闪卡已合并并保存到本地存储:', mergedFlashcards.length);
              
              // 触发存储事件，通知其他页面更新闪卡计数
              window.dispatchEvent(new StorageEvent('storage', {
                key: storageKey,
                newValue: JSON.stringify(mergedFlashcards),
                storageArea: localStorage
              }));
            } catch (error) {
              console.error('[闪卡创建] 保存到本地存储失败:', error);
            }
          }}
        />
      )}


    </div>
  );
}