"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/language-selector"
import { MaogeInterface } from "@/components/chat-interface"
import { Download, InfoIcon as Insights, List, Flag } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { analyzeDocument } from "@/lib/openrouter"
import { UpgradeModal } from "@/components/upgrade-modal"
import { LoginModal } from "@/components/login-modal"

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-slate-200 px-10 py-4 shadow-sm">
        <div className="flex items-center gap-3 text-slate-900">
          <div className="size-8 text-[#0A52A1]">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                clipRule="evenodd"
                d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                fill="currentColor"
                fillRule="evenodd"
              ></path>
            </svg>
          </div>
          <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">Maoge PDF</h2>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <nav className="flex items-center gap-6">
            <a
              className="text-slate-700 hover:text-slate-900 text-sm font-medium leading-normal transition-colors"
              href="/account"
            >
              {t("myLibrary")}
            </a>
            <a
              className="text-slate-700 hover:text-slate-900 text-sm font-medium leading-normal transition-colors"
              href="/"
            >
              {t("explore")}
            </a>
          </nav>
          <LanguageSelector />
          <UpgradeModal>
            <button className="flex items-center gap-1 bg-[#d2e2f3] text-slate-900 hover:bg-[#b0cce8] px-4 py-2 rounded-md text-sm font-medium transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>{t("upgrade")}</span>
            </button>
          </UpgradeModal>
          {isLoggedIn ? (
            <a href="/account">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-slate-300 shadow-sm"
                style={{ 
                  backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA6IhW592oJH7AwT9DjMtVEWXh8NHP1Yh6MKd3UbP61_uKdfoaFoHi5f-pJ0aYqXcpcxUIuG718DoNTXoEu1Zctidl-xP1MrjbvT6yE0KJp3IRTeSucfpMEvikR6PcLVNyB9eEHPr0ERqzgpi93OZCAN5qIvq-U43WN3rQK-y2wez_TYLP4ymvJPNxtHFeepfLwcEnk3K04dsiT1y2TtCx0Z1f-ZMPBlUAv_0KKo90xe-SMBm-JtqHVCW5Zaaq8YClXGnQvz347ttg")' 
                }}
              ></div>
            </a>
          ) : (
            <LoginModal>
              <Button variant="outline" className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{t("login")}</span>
              </Button>
            </LoginModal>
          )}
        </div>
      </header>

      <main className="px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-8 bg-slate-50">
        <div className="layout-content-container flex flex-col max-w-[1200px] flex-1 gap-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
            <ol className="flex items-center gap-1.5 text-sm">
              <li>
                <a className="text-slate-600 hover:text-slate-800 font-medium transition-colors" href="/account">
                  {t("myLibrary")}
                </a>
              </li>
              <li>
                <span className="text-slate-400">/</span>
              </li>
              <li>
                <span className="text-slate-800 font-semibold">{t("documentAnalysis")}</span>
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Analysis Results */}
            <section className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div className="flex flex-col gap-1">
                  <h1 className="text-slate-900 text-3xl font-bold leading-tight tracking-tight">
                    {t("documentAnalysisResults")}
                  </h1>
                  <p className="text-slate-600 text-base font-normal leading-normal">{t("aiPoweredAnalysis")}</p>
                </div>
              </div>

              {analysis && (
                <div className="space-y-8">
                  {/* Document Theme */}
                  <div>
                    <h2 className="text-slate-800 text-xl font-semibold leading-tight tracking-tight mb-3 flex items-center gap-2">
                      <Insights className="text-[#0A52A1] text-2xl h-6 w-6" />
                      {t("documentTheme")}
                    </h2>
                    <p className="text-slate-700 text-base font-normal leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-200">
                      {analysis.theme}
                    </p>
                  </div>

                  {/* Main Points */}
                  <div>
                    <h2 className="text-slate-800 text-xl font-semibold leading-tight tracking-tight mb-4 flex items-center gap-2">
                      <List className="text-[#0A52A1] text-2xl h-6 w-6" />
                      {t("mainPoints")}
                    </h2>
                    <div className="space-y-4">
                      {analysis.mainPoints.map((point, index) => (
                        <div
                          key={index}
                          className="p-4 border border-slate-200 rounded-md hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="flex flex-col gap-1">
                            <p className="text-slate-900 text-base font-semibold leading-normal">{point.title}</p>
                            <p className="text-slate-500 text-xs font-normal leading-normal">
                              {t("reference")}: {point.reference}
                            </p>
                            <p className="text-slate-600 text-sm font-normal leading-relaxed mt-1">
                              {point.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conclusions */}
                  <div>
                    <h2 className="text-slate-800 text-xl font-semibold leading-tight tracking-tight mb-3 flex items-center gap-2">
                      <Flag className="text-[#0A52A1] text-2xl h-6 w-6" />
                      {t("conclusions")}
                    </h2>
                    <p className="text-slate-700 text-base font-normal leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-200">
                      {analysis.conclusions}
                    </p>
                  </div>

                  <div className="mt-8 flex justify-start">
                    <Button
                      className="bg-[#0A52A1] hover:bg-[#084382] text-white shadow-sm hover:shadow-md"
                      onClick={downloadSummary}
                    >
                      <Download className="h-5 w-5 mr-2" />
                      {t("downloadSummary")}
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* Chat Interface */}
            <MaogeInterface documentId={params.id as string} documentName={fileInfo?.name || ""} />
          </div>
        </div>
      </main>
    </div>
  )
}
