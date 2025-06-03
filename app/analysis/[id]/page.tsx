"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/language-selector"
import { MaogeInterface } from "@/components/chat-interface"
import { Download, InfoIcon as Insights, List, Flag, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { analyzeDocument } from "@/lib/openrouter"
import { UpgradeModal } from "@/components/upgrade-modal"
import { LoginModal } from "@/components/login-modal"
import { Sidebar } from "@/components/sidebar"
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 设置 PDF.js worker 路径（CDN 方式，兼容 Vercel 构建）
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface AnalysisResult {
  theme: string
  mainPoints: Array<{
    title: string
    reference: string
    description: string
  }>
  conclusions: string
}

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [fileInfo, setFileInfo] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // PDF 预览相关状态
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
    setIsLoggedIn(!!userInfo.isLoggedIn)
    
    const loadAnalysis = async () => {
      try {
        const files = JSON.parse(localStorage.getItem("uploadedPdfs") || "[]")
        const file = files.find((f: any) => f.id === params.id)

        if (!file) {
          router.push("/")
          return
        }

        setFileInfo(file)

        // 设置 PDF URL，优先使用上传时保存的 url 字段
        setPdfUrl(file.url || '/sample.pdf')
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
      } catch (error) {
        console.error("Error loading analysis:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    loadAnalysis()
  }, [params.id, router])

  const downloadSummary = () => {
    if (!analysis || !fileInfo) return
    const summary = `
Document Analysis: ${fileInfo.name}
Date: ${new Date().toLocaleDateString()}

THEME:
${analysis.theme}

MAIN POINTS:
${analysis.mainPoints
  .map(
    (point, index) =>
      `${index + 1}. ${point.title} (${point.reference})
   ${point.description}`,
  )
  .join("\n\n")}

CONCLUSIONS:
${analysis.conclusions}
    `

    const blob = new Blob([summary], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileInfo.name}-summary.txt`
    a.click()
    URL.revokeObjectURL(url)
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

  return (
    <div className="flex min-h-screen">
      {/* 左侧侧边栏 */}
      <div className="w-[180px] min-w-[140px] max-w-[200px] bg-[#18181b]">
        <Sidebar />
      </div>

      {/* 中间 PDF 预览区 */}
      <div className="flex-1 flex flex-col border-r border-slate-200 bg-white overflow-auto">
        {/* PDF 工具栏 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 bg-white">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
            <span className="text-sm">
              {pageNumber} / {numPages || '?'}
            </span>
            <Button variant="ghost" size="sm" onClick={goToNextPage} disabled={pageNumber >= (numPages || 1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={zoomOut}>
              <ZoomOut size={16} />
            </Button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={zoomIn}>
              <ZoomIn size={16} />
            </Button>
            <Button variant="ghost" size="sm">
              <RotateCw size={16} />
            </Button>
          </div>
        </div>

        {/* PDF 内容 */}
        <div className="flex-1 overflow-auto bg-slate-100 flex justify-center">
          {pdfUrl ? (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              className="flex flex-col items-center py-4"
              loading={<div className="flex items-center justify-center h-full"><p className="text-slate-500">正在加载 PDF...</p></div>}
              error={<div className="flex items-center justify-center h-full"><p className="text-red-500">{pdfError || '加载 PDF 时出错'}</p></div>}
            >
              {!pdfError && (
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  className="shadow-lg mb-4"
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  error={<div className="bg-red-50 p-4 rounded border border-red-200 text-red-600">无法加载页面</div>}
                />
              )}
            </Document>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">PDF 文件不可用</p>
            </div>
          )}
        </div>
      </div>

      {/* 右侧 AI 分析和聊天区 */}
      <div className="w-[40%] min-w-[380px] max-w-[600px] flex flex-col bg-white overflow-auto">
        {/* 右侧顶部工具栏 */}
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{fileInfo?.name || "文档"}</h2>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              {isLoggedIn ? (
                <a href="/account">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 border border-slate-300 shadow-sm"
                    style={{ 
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA6IhW592oJH7AwT9DjMtVEWXh8NHP1Yh6MKd3UbP61_uKdfoaFoHi5f-pJ0aYqXcpcxUIuG718DoNTXoEu1Zctidl-xP1MrjbvT6yE0KJp3IRTeSucfpMEvikR6PcLVNyB9eEHPr0ERqzgpi93OZCAN5qIvq-U43WN3rQK-y2wez_TYLP4ymvJPNxtHFeepfLwcEnk3K04dsiT1y2TtCx0Z1f-ZMPBlUAv_0KKo90xe-SMBm-JtqHVCW5Zaaq8YClXGnQvz347ttg")' 
                    }}
                  ></div>
                </a>
              ) : (
                <LoginModal>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{t("login")}</span>
                  </Button>
                </LoginModal>
              )}
            </div>
                </div>
              </div>

        {/* AI 分析和聊天界面 */}
        <div className="flex-1 overflow-auto p-4">
          {/* AI 分析摘要 */}
          {/* {analysis && (
            <div className="mb-6 bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Insights className="text-[#8b5cf6] h-5 w-5" />
                      {t("documentTheme")}
              </h3>
              <p className="text-slate-700 text-sm">{analysis.theme}</p>
              
              <div className="flex justify-end mt-3">
                    <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-[#8b5cf6] text-[#8b5cf6] hover:bg-purple-50"
                      onClick={downloadSummary}
                    >
                  <Download className="h-3 w-3 mr-1" />
                      {t("downloadSummary")}
                    </Button>
                  </div>
                </div>
          )} */}

          {/* 聊天界面 */}
          <MaogeInterface documentId={params.id as string} documentName={fileInfo?.name || ""} />
        </div>
      </div>
    </div>
  )
}
