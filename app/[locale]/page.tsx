"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/language-selector"
import { Upload, FileText, GraduationCap, Briefcase, Quote } from "lucide-react"
import {useTranslations, useLocale} from 'next-intl';
import { UpgradeModal } from "@/components/upgrade-modal"
import { LoginModal } from "@/components/login-modal"
import { UpgradePlusModal } from "@/components/upgrade-plus-modal"
import FileSizeUpgradeModal from "@/components/FileSizeUpgradeModal"
import { Sidebar } from "@/components/sidebar"
import { ModelQuality } from "@/types/api"
import AuthButton from "@/components/AuthButton"
import { useUser } from '@/components/UserProvider'
import ShareReceiveModal from "@/components/share-receive-modal"
import ShareDetector from "@/components/share-detector"
import { PolicyModal } from "@/components/policy-modal"
import { Suspense } from 'react'

export default function HomePage() {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeFile, setUpgradeFile] = useState<{name: string, size: number} | null>(null)
  const [showFileSizeUpgrade, setShowFileSizeUpgrade] = useState(false)
  const [oversizedFile, setOversizedFile] = useState<{name: string, size: number} | null>(null)
  const [modelQuality, setModelQuality] = useState<ModelQuality>('high')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations();
  const locale = useLocale();
  const { profile, loading: profileLoading, user } = useUser()
  const [shareId, setShareId] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [pdfFlashcardCounts, setPdfFlashcardCounts] = useState<{[pdfId: string]: number}>({})
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policyModalType, setPolicyModalType] = useState<'terms' | 'privacy' | 'refund' | 'contact'>('terms')
  
  // 默认非Plus会员
  const isPlus = profile?.plus && profile?.is_active
  const isLoggedIn = !!profile

  // 从本地存储计算闪卡数量
  const loadFlashcardCounts = () => {
    if (typeof window === 'undefined') return
    
    try {
      const counts: {[pdfId: string]: number} = {}
      
      // 遍历localStorage寻找闪卡数据
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('flashcards_')) {
          const pdfId = key.replace('flashcards_', '')
          const data = localStorage.getItem(key)
          if (data) {
            try {
              const flashcards = JSON.parse(data)
              if (Array.isArray(flashcards)) {
                counts[pdfId] = flashcards.length
              }
            } catch (e) {
              console.warn('[主页] 解析闪卡数据失败:', key, e)
            }
          }
        }
      }
      
      setPdfFlashcardCounts(counts)
      console.log('[Homepage] Flashcard counts loaded:', counts)
    } catch (error) {
      console.error('[Homepage] Failed to load flashcard counts:', error)
    }
  }

  // 处理分享检测
  const handleShareDetected = (detectedShareId: string) => {
    setShareId(detectedShareId)
    setShowShareModal(true)
  }

  // 检测登录状态变化，自动处理待处理的分享
  useEffect(() => {
    if (isLoggedIn) {
      const pendingShareId = localStorage.getItem('pendingShareId')
      if (pendingShareId) {
        // 清除存储的分享ID
        localStorage.removeItem('pendingShareId')
        // 自动接收分享
        handlePendingShare(pendingShareId)
      }
    }
  }, [isLoggedIn])

  // 组件加载时计算闪卡数量
  useEffect(() => {
    loadFlashcardCounts()
    
    // 监听storage事件，当其他标签页更新闪卡时同步
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('flashcards_')) {
        loadFlashcardCounts()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 处理待处理的分享
  const handlePendingShare = async (shareId: string) => {
    try {
      const response = await fetch('/api/share/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('自动接收分享失败:', errorData.error)
        // 如果自动接收失败，重新显示分享弹窗
        setShareId(shareId)
        setShowShareModal(true)
        return
      }

      const result = await response.json()
      
      if (result.success) {
        // 成功接收，直接跳转到PDF页面
        router.push(`/${locale}/analysis/${result.pdfId}`)
      } else {
        // 接收失败，重新显示分享弹窗
        setShareId(shareId)
        setShowShareModal(true)
      }
      
    } catch (error) {
      console.error('处理待处理分享失败:', error)
      // 出错时重新显示分享弹窗
      setShareId(shareId)
      setShowShareModal(true)
    }
  }

  const handleFile = async (file: File, quality: ModelQuality) => {
    // 检查用户是否已登录
    if (!isLoggedIn) {
      alert(t('auth.pleaseLoginToUpload'));
      return;
    }
    
    if (!file.type.includes("pdf")) {
      alert(t("upload.onlyPdfAllowed"))
      return
    }
    const maxSize = isPlus ? Infinity : 10 * 1024 * 1024
    if (file.size > maxSize) {
      if (!isPlus) {
        setOversizedFile({name: file.name, size: file.size})
        setShowFileSizeUpgrade(true)
        return
      }
    }
    setUploading(true)
    try {
      // 获取用户的access token
      let accessToken = null;
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token;
        console.log("获取access token:", accessToken ? "成功" : "失败");
      } catch (tokenError) {
        console.warn("获取access token失败:", tokenError);
      }
      
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', quality);
      
      console.log("开始上传文件:", file.name, "质量模式:", quality);
      
      // 准备请求headers
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData
      });
      
      console.log("上传响应状态:", uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("解析错误响应失败:", errorText);
          throw new Error('上传失败，服务器返回无效响应');
        }
        console.error("上传错误:", errorData);
        
        // 如果是认证错误，提示用户登录
        if (uploadResponse.status === 401) {
          throw new Error('请先登录后再上传文件');
        }
        
        throw new Error(errorData.error || '上传失败');
      }
      
      let uploadResult;
      try {
        const resultText = await uploadResponse.text();
        uploadResult = JSON.parse(resultText);
      console.log("上传成功:", uploadResult);
      } catch (e) {
        console.error("解析成功响应失败:", e);
        throw new Error('解析服务器响应失败');
      }
      
      // 使用服务器返回的PDF ID
      const pdfId = uploadResult.pdf?.id || Date.now().toString();
      
      console.log("上传成功，跳转到分析页面:", pdfId);
      
      // 使用语言感知的路由跳转
      router.push(`/${locale}/analysis/${pdfId}`)
    } catch (error) {
      console.error("上传处理失败:", error);
      alert(error instanceof Error ? error.message : t("uploadError"))
    } finally {
      setUploading(false)
    }
  }

  const handleUploadWithQuality = (quality: ModelQuality) => {
    setModelQuality(quality);
    fileInputRef.current?.click();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], modelQuality)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0], modelQuality)
    }
  }

  // 简化加载逻辑 - 只在初次加载的短时间内显示加载状态
  const [showLoading, setShowLoading] = useState(true)
  
  useEffect(() => {
    // 设置一个较短的超时时间来隐藏加载状态
    const timer = setTimeout(() => {
      setShowLoading(false)
    }, 500) // 0.5秒后强制隐藏加载状态
    
    return () => clearTimeout(timer)
  }, [])
  
  // 只在短时间内且确实在加载时显示加载状态
  if (profileLoading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <p className="text-slate-600">{t('common.initializing')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      
      {/* 固定侧边栏 */}
      <div className="fixed top-0 left-0 h-screen w-80 min-w-[240px] max-w-[320px] z-30 bg-[#18181b]">
        <Sidebar 
          pdfFlashcardCounts={pdfFlashcardCounts}
          onFlashcardClick={(pdfId, pdfName) => {
            console.log('[Homepage] Flashcard click event triggered:', pdfId, pdfName);
            // 跳转到PDF页面并直接打开闪卡管理
            router.push(`/${locale}/analysis/${pdfId}?flashcard=true`);
          }}
        />
      </div>
      {/* 主内容区，留出侧边栏宽度 */}
      <div className="ml-80 flex-1 bg-white shadow-lg p-8 sm:p-12 md:p-16 lg:p-20 xl:p-24" style={{boxShadow: 'rgba(0,0,0,0.06) -4px 0 16px'}}>
        <UpgradePlusModal
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          fileName={upgradeFile?.name || ''}
          fileSizeMB={upgradeFile ? Math.round(upgradeFile.size / 1024 / 1024) : 0}
        />
        <FileSizeUpgradeModal
          open={showFileSizeUpgrade}
          onOpenChange={setShowFileSizeUpgrade}
          fileName={oversizedFile?.name || ''}
          fileSizeMB={oversizedFile ? Math.round(oversizedFile.size / 1024 / 1024) : 0}
        />
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
          <AuthButton />
        </div>
      </header>

        {/* 成就展示区：header下方，主标题上方 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-2 mb-4">
          {/* 左侧 */}
          <div className="flex flex-col items-center min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 2C16 2 12.5 8.5 6 10C6 10 7.5 19 16 30C24.5 19 26 10 26 10C19.5 8.5 16 2 16 2Z" stroke="#a259ff" strokeWidth="2" fill="none"/><path d="M16 7V17" stroke="#a259ff" strokeWidth="2" strokeLinecap="round"/><rect x="13" y="17" width="6" height="6" rx="3" fill="#a259ff"/></svg>
              <span className="text-xs text-slate-500 font-medium">#1 PDF Chat AI</span>
            </div>
            <div className="text-xl font-bold text-slate-800">Original</div>
          </div>
          {/* 右侧 */}
          <div className="flex flex-col items-center min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 2C16 2 12.5 8.5 6 10C6 10 7.5 19 16 30C24.5 19 26 10 26 10C19.5 8.5 16 2 16 2Z" stroke="#38bdf8" strokeWidth="2" fill="none"/><path d="M16 7V17" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/><circle cx="16" cy="20" r="3" fill="#38bdf8"/></svg>
              <span className="text-xs text-slate-500 font-medium">Q's answered every day</span>
            </div>
            <div className="text-xl font-bold text-slate-800">1,000,000+</div>
          </div>
        </div>

      {/* Hero Section */}
      <main className="px-4 sm:px-10 flex flex-1 justify-center py-10 sm:py-16">
        <div className="layout-content-container flex flex-col max-w-6xl flex-1">
          {/* Hero Upload Area */}
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-6xl font-bold text-slate-800 mb-4 flex flex-wrap items-center justify-center gap-2">
                {t('hero.title').split('PDF')[0]}
                <span className="inline-block bg-[#a259ff] text-white rounded-lg px-4 py-1 ml-2 text-4xl sm:text-6xl font-bold align-middle" style={{lineHeight:'1.1'}}>PDF</span>
            </h1>
              <p className="text-slate-600 text-lg sm:text-xl mb-8 max-w-3xl mx-auto">
                {t('hero.description')}
              </p>

            {/* Upload Area */}
            <div
              className={`flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                dragActive
                  ? "border-[#8b5cf6] bg-purple-50 scale-105"
                  : "border-slate-300 hover:border-[#8b5cf6] hover:bg-purple-50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center">
                {uploading ? (
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8b5cf6] mb-4"></div>
                ) : (
                  <Upload className="text-[#8b5cf6] h-16 w-16 mb-4" />
                )}
                <p className="mb-2 text-lg text-slate-700">
                  <span className="font-semibold">{t("upload.clickToUpload")}</span> {t("upload.orDragAndDrop")}
                </p>
              </div>
              <input
                ref={fileInputRef}
                accept=".pdf"
                className="hidden"
                type="file"
                onChange={handleFileInput}
                disabled={uploading}
              />
            </div>


            <Button
              className="mt-8 min-w-[160px] h-14 px-8 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? t("upload.uploading") : t("upload.uploadPdf")}
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Researchers */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <FileText className="h-8 w-8 text-[#8b5cf6]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{t("features.forResearchers")}</h3>
              </div>
              <p className="text-slate-600 mb-6">{t("features.researchersDescription")}</p>

              {/* Demo Interface for Researchers */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-[#8b5cf6] rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">{t('demo.academicPaperAnalysis')}</span>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="w-16 h-12 bg-[#8b5cf6] rounded-md mb-2"></div>
                    <div className="text-xs text-slate-500">{t('demo.researchDocument')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-sm text-slate-600 flex-1">{t('demo.askAnyQuestion')}</span>
                  <div className="w-8 h-8 bg-[#8b5cf6] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">▶</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Students */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{t("features.forStudents")}</h3>
              </div>
              <p className="text-slate-600 mb-6">{t("features.studentsDescription")}</p>

              {/* Demo Interface for Students */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                  <div className="text-sm font-medium text-slate-700 mb-3">{t('demo.capitalOfFrance')}</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                      <div className="w-3 h-3 rounded-full border-2 border-slate-400"></div>
                      <span className="text-sm text-slate-600">{t('demo.berlin')}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                      <div className="w-3 h-3 rounded-full border-2 border-slate-400"></div>
                      <span className="text-sm text-slate-600">{t('demo.madrid')}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-purple-100 rounded-md">
                      <div className="w-3 h-3 bg-[#8b5cf6] rounded-full"></div>
                      <span className="text-sm text-slate-700 font-medium">{t('demo.paris')}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm">
                    {t('demo.submitAnswer')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Professionals */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{t("features.forProfessionals")}</h3>
              </div>
              <p className="text-slate-600 mb-6">{t("features.professionalsDescription")}</p>

              {/* Demo Interface for Professionals */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-slate-500 mb-2">{t('demo.financialReport')}</div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-lg font-bold text-slate-800">78.15%</div>
                    <div className="w-12 h-2 bg-green-200 rounded-full">
                      <div className="w-9 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <div className="w-8 h-4 bg-red-300 rounded"></div>
                    <div className="w-6 h-4 bg-yellow-300 rounded"></div>
                    <div className="w-10 h-4 bg-green-300 rounded"></div>
                    <div className="w-4 h-4 bg-blue-300 rounded"></div>
                  </div>
                  <Button className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm">
                    {t('demo.netProfitQuestion')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Citation Sources */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Quote className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{t("features.citationSources")}</h3>
              </div>
              <p className="text-slate-600 mb-6">{t("features.citationDescription")}</p>

              {/* Demo Interface for Citations */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm font-medium text-slate-700 mb-3">{t('demo.authorQuestion')}</div>
                  <div className="bg-[#8b5cf6] text-white rounded-lg p-3 mb-3">
                    <div className="text-sm">
                      The author of the article "Moderated and Unmoderated Card Sorting in UX Design" is Marcin Majka
                      👨‍💻
                    </div>
                  </div>
                  <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm">
                    {t('demo.scrollToPage')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex justify-center bg-slate-50 border-t border-slate-200 mt-16">
        <div className="flex max-w-6xl flex-1 flex-col">
          <div className="flex flex-col gap-6 px-5 py-8 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <button
                onClick={() => { setPolicyModalType('terms'); setShowPolicyModal(true) }}
                className="text-slate-600 hover:text-[#8b5cf6] text-sm font-medium leading-normal min-w-32 transition-colors cursor-pointer"
              >
                {t("footer.termsOfService")}
              </button>
              <button
                onClick={() => { setPolicyModalType('privacy'); setShowPolicyModal(true) }}
                className="text-slate-600 hover:text-[#8b5cf6] text-sm font-medium leading-normal min-w-32 transition-colors cursor-pointer"
              >
                {t("footer.privacyPolicy")}
              </button>
              <button
                onClick={() => { setPolicyModalType('refund'); setShowPolicyModal(true) }}
                className="text-slate-600 hover:text-[#8b5cf6] text-sm font-medium leading-normal min-w-32 transition-colors cursor-pointer"
              >
                {t("footer.refundPolicy")}
              </button>
              <button
                onClick={() => { setPolicyModalType('contact'); setShowPolicyModal(true) }}
                className="text-slate-600 hover:text-[#8b5cf6] text-sm font-medium leading-normal min-w-32 transition-colors cursor-pointer"
              >
                {t("footer.contactUs")}
              </button>
            </div>
            <p className="text-slate-500 text-sm font-normal leading-normal">
              © 2024 Maoge PDF. {t("footer.allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>

      {/* Share Detector */}
      <Suspense fallback={null}>
        <ShareDetector onShareDetected={handleShareDetected} />
      </Suspense>

      {/* Share Receive Modal */}
      {shareId && (
        <ShareReceiveModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareId={shareId}
          isLoggedIn={isLoggedIn}
        />
      )}

      {/* Policy Modal */}
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        type={policyModalType}
      />
      </div>
    </div>
  )
}
