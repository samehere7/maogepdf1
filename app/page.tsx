"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/language-selector"
import { Upload, FileText, GraduationCap, Briefcase, Quote } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { UpgradeModal } from "@/components/upgrade-modal"
import { LoginModal } from "@/components/login-modal"
import { UpgradePlusModal } from "@/components/upgrade-plus-modal"
import { signIn } from "next-auth/react"
import { Sidebar } from "@/components/sidebar"

export default function HomePage() {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeFile, setUpgradeFile] = useState<{name: string, size: number} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { t, language } = useLanguage()

  useEffect(() => {
    // Check if user is logged in
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
    setIsLoggedIn(!!userInfo.isLoggedIn)
  }, [])

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf")) {
      alert(t("onlyPdfAllowed"))
      return
    }
    // 超过10MB弹窗
    if (file.size > 10 * 1024 * 1024) {
      setUpgradeFile({ name: file.name, size: file.size })
      setShowUpgrade(true)
      return
    }
    setUploading(true)

    try {
      // Simulate file processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Store file info in localStorage
      const fileInfo = {
        name: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        id: Date.now().toString(),
      }

      const existingFiles = JSON.parse(localStorage.getItem("uploadedPdfs") || "[]")
      existingFiles.push(fileInfo)
      localStorage.setItem("uploadedPdfs", JSON.stringify(existingFiles))

      // Redirect to analysis page
      router.push(`/analysis/${fileInfo.id}`)
    } catch (error) {
      alert(t("uploadError"))
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-1/5 min-w-[260px] max-w-[340px] bg-[#18181b]">
        <Sidebar />
      </div>
      <div className="flex-1 bg-white shadow-lg p-8 sm:p-12 md:p-16 lg:p-20 xl:p-24" style={{boxShadow: 'rgba(0,0,0,0.06) -4px 0 16px'}}>
        <UpgradePlusModal
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          fileName={upgradeFile?.name || ''}
          fileSizeMB={upgradeFile ? Math.round(upgradeFile.size / 1024 / 1024) : 0}
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
          <Button
            className="min-w-[100px] bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
            onClick={() => fileInputRef.current?.click()}
          >
            {t("uploadPdf")}
          </Button>
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
                {language === 'zh'
                  ? (<>
                      {t('heroTitleV2').replace('PDF', '')}
                      <span className="inline-block bg-[#a259ff] text-white rounded-lg px-4 py-1 ml-2 text-4xl sm:text-6xl font-bold align-middle" style={{lineHeight:'1.1'}}>PDF</span>
                    </>)
                  : (<>
                      {t('heroTitleV2').split('PDF')[0]}
                      <span className="inline-block bg-[#a259ff] text-white rounded-lg px-4 py-1 ml-2 text-4xl sm:text-6xl font-bold align-middle" style={{lineHeight:'1.1'}}>PDF</span>
                    </>)}
            </h1>
              <p className="text-slate-600 text-lg sm:text-xl mb-8 max-w-3xl mx-auto">
                {language === 'zh'
                  ? (<>
                      {t('heroDescriptionV2').split('，')[0]}，
                      <span className="text-[#ff9100] underline underline-offset-4 decoration-[#ff9100] mx-1">学生、研究者和专业人士</span>
                      {t('heroDescriptionV2').split('，')[1]}
                    </>)
                  : (<>
                      {t('heroDescriptionV2').split('students, researchers and professionals')[0]}
                      <span className="text-[#ff9100] underline underline-offset-4 decoration-[#ff9100] mx-1">students, researchers and professionals</span>
                      {t('heroDescriptionV2').split('students, researchers and professionals')[1]}
                    </>)}
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
                  <span className="font-semibold">{t("clickToUpload")}</span> {t("orDragAndDrop")}
                </p>
                <p className="text-sm text-slate-500">{t("pdfMaxSize")}</p>
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
              {uploading ? t("uploading") : t("uploadPdf")}
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
                <h3 className="text-2xl font-bold text-slate-800">{t("forResearchers")}</h3>
              </div>
              <p className="text-slate-600 mb-6">{t("researchersDescription")}</p>

              {/* Demo Interface for Researchers */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-[#8b5cf6] rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">Academic Paper Analysis</span>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="w-16 h-12 bg-[#8b5cf6] rounded-md mb-2"></div>
                    <div className="text-xs text-slate-500">Research Document</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-sm text-slate-600 flex-1">Ask any question...</span>
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
                <h3 className="text-2xl font-bold text-slate-800">{t("forStudents")}</h3>
              </div>
              <p className="text-slate-600 mb-6">{t("studentsDescription")}</p>

              {/* Demo Interface for Students */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                  <div className="text-sm font-medium text-slate-700 mb-3">What is the capital of France?</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                      <div className="w-3 h-3 rounded-full border-2 border-slate-400"></div>
                      <span className="text-sm text-slate-600">Berlin</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                      <div className="w-3 h-3 rounded-full border-2 border-slate-400"></div>
                      <span className="text-sm text-slate-600">Madrid</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-purple-100 rounded-md">
                      <div className="w-3 h-3 bg-[#8b5cf6] rounded-full"></div>
                      <span className="text-sm text-slate-700 font-medium">Paris</span>
                    </div>
                  </div>
                  <Button className="w-full mt-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm">
                    Submit Answer
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
                <h3 className="text-2xl font-bold text-slate-800">{t("forProfessionals")}</h3>
              </div>
              <p className="text-slate-600 mb-6">{t("professionalsDescription")}</p>

              {/* Demo Interface for Professionals */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-slate-500 mb-2">Financial_report.pdf</div>
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
                    What's the net profit for Q2 in the financial report?
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
                <h3 className="text-2xl font-bold text-slate-800">{t("citationSources")}</h3>
              </div>
              <p className="text-slate-600 mb-6">{t("citationDescription")}</p>

              {/* Demo Interface for Citations */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm font-medium text-slate-700 mb-3">Who is the author of this article?</div>
                  <div className="bg-[#8b5cf6] text-white rounded-lg p-3 mb-3">
                    <div className="text-sm">
                      The author of the article "Moderated and Unmoderated Card Sorting in UX Design" is Marcin Majka
                      👨‍💻
                    </div>
                  </div>
                  <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm">
                    Scroll to Page 1
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
              <a
                className="text-slate-600 hover:text-[#8b5cf6] text-sm font-medium leading-normal min-w-32 transition-colors"
                href="#"
              >
                {t("termsOfService")}
              </a>
              <a
                className="text-slate-600 hover:text-[#8b5cf6] text-sm font-medium leading-normal min-w-32 transition-colors"
                href="#"
              >
                {t("privacyPolicy")}
              </a>
              <a
                className="text-slate-600 hover:text-[#8b5cf6] text-sm font-medium leading-normal min-w-32 transition-colors"
                href="#"
              >
                {t("contactUs")}
              </a>
            </div>
            <p className="text-slate-500 text-sm font-normal leading-normal">
              © 2024 Maoge PDF. {t("allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
