"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, FileText, GraduationCap, Briefcase, Quote } from "lucide-react"
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
import { Suspense } from 'react'

export default function HomePageContent() {
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
  const { profile, loading: profileLoading } = useUser()
  const [shareId, setShareId] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [pdfFlashcardCounts, setPdfFlashcardCounts] = useState<{[pdfId: string]: number}>({})
  
  // 默认非Plus会员
  const isPlus = profile?.plus && profile?.is_active
  const isLoggedIn = !!profile

  // 简化的文本，不使用翻译
  const texts = {
    uploadPdf: "Upload PDF",
    orDragDrop: "Or drag and drop your PDF here",
    analyzeDocument: "Analyze Document",
    chatWithPdf: "Chat with your PDF using AI",
    generateFlashcards: "Generate flashcards for study",
    trustedByResearchers: "100K+ researchers worldwide"
  }

  const loadFlashcardCounts = () => {
    if (typeof window === 'undefined') return
    
    try {
      const counts: {[pdfId: string]: number} = {}
      
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
              console.warn('Failed to parse flashcard data:', key, e)
            }
          }
        }
      }
      
      setPdfFlashcardCounts(counts)
    } catch (error) {
      console.error('Failed to load flashcard counts:', error)
    }
  }

  const handleShareDetected = (detectedShareId: string) => {
    setShareId(detectedShareId)
    setShowShareModal(true)
  }

  useEffect(() => {
    if (isLoggedIn) {
      const pendingShareId = localStorage.getItem('pendingShareId')
      if (pendingShareId) {
        localStorage.removeItem('pendingShareId')
        handleShareDetected(pendingShareId)
      }
    }
  }, [isLoggedIn])

  useEffect(() => {
    loadFlashcardCounts()
  }, [])

  const handleFileUpload = async (file: File) => {
    if (!file) return

    const maxSize = isPlus ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    
    if (file.size > maxSize) {
      if (isPlus) {
        setOversizedFile({name: file.name, size: file.size})
        setShowFileSizeUpgrade(true)
      } else {
        setUpgradeFile({name: file.name, size: file.size})
        setShowUpgrade(true)
      }
      return
    }

    if (!isLoggedIn) {
      setUpgradeFile({name: file.name, size: file.size})
      setShowUpgrade(true)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/en/analysis/${result.id}`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(`Upload failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <ShareDetector onShareDetected={handleShareDetected} />
      </Suspense>

      <div className="flex">
        <Sidebar 
          pdfFlashcardCounts={pdfFlashcardCounts}
          onFlashcardCountUpdate={loadFlashcardCounts}
        />
        
        <div className="flex-1 lg:ml-80">
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-[#8b5cf6] size-8">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path
                      clipRule="evenodd"
                      d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                      fill="currentColor"
                      fillRule="evenodd"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Maoge PDF</h1>
              </div>
              <div className="flex items-center gap-4">
                <AuthButton />
              </div>
            </div>
          </div>

          <main className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  {texts.analyzeDocument}
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  {texts.chatWithPdf}
                </p>
              </div>

              <div 
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive ? 'border-[#8b5cf6] bg-purple-50' : 'border-gray-300'
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragActive(false)
                  const files = Array.from(e.dataTransfer.files)
                  const pdfFile = files.find(file => file.type === 'application/pdf')
                  if (pdfFile) {
                    handleFileUpload(pdfFile)
                  }
                }}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {texts.uploadPdf}
                </h3>
                <p className="text-gray-600 mb-6">
                  {texts.orDragDrop}
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                >
                  {uploading ? 'Uploading...' : 'Choose File'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload(file)
                    }
                  }}
                />
              </div>

              <div className="mt-16 grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-[#8b5cf6] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Smart Analysis</h3>
                  <p className="text-gray-600">AI-powered PDF analysis and insights</p>
                </div>
                <div className="text-center">
                  <GraduationCap className="h-12 w-12 text-[#8b5cf6] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Interactive Chat</h3>
                  <p className="text-gray-600">Ask questions about your documents</p>
                </div>
                <div className="text-center">
                  <Briefcase className="h-12 w-12 text-[#8b5cf6] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Study Tools</h3>
                  <p className="text-gray-600">{texts.generateFlashcards}</p>
                </div>
              </div>

              <div className="mt-16 text-center">
                <p className="text-gray-500 mb-4">{texts.trustedByResearchers}</p>
              </div>
            </div>
          </main>
        </div>
      </div>

      <UpgradeModal 
        open={showUpgrade} 
        onOpenChange={setShowUpgrade}
        file={upgradeFile}
      />

      <LoginModal 
        open={showUpgrade && !isLoggedIn} 
        onOpenChange={setShowUpgrade}
      />

      <UpgradePlusModal 
        open={showUpgrade && isLoggedIn && !isPlus} 
        onOpenChange={setShowUpgrade}
      />

      <FileSizeUpgradeModal
        open={showFileSizeUpgrade}
        onOpenChange={setShowFileSizeUpgrade}
        file={oversizedFile}
      />

      <ShareReceiveModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        shareId={shareId}
      />
    </div>
  )
}