"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Gift, Download, User, Clock } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

interface ShareReceiveModalProps {
  isOpen: boolean
  onClose: () => void
  shareId: string
  isLoggedIn: boolean
}

interface SharedPDFInfo {
  id: string
  name: string
  ownerName: string
  uploadDate: string
  size: number
}

export default function ShareReceiveModal({ isOpen, onClose, shareId, isLoggedIn }: ShareReceiveModalProps) {
  const locale = useLocale()
  const t = useTranslations('shareReceiveModal');
  const router = useRouter()
  const [pdfInfo, setPdfInfo] = useState<SharedPDFInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取分享的PDF信息
  useEffect(() => {
    if (isOpen && shareId) {
      loadPdfInfo()
    }
  }, [isOpen, shareId])

  const loadPdfInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 解析shareId获取pdfId
      const parts = shareId.split('-')
      const pdfId = parts[0]
      
      const response = await fetch(`/api/share/pdf/${pdfId}`)
      
      if (!response.ok) {
        throw new Error('获取PDF信息失败')
      }
      
      const data = await response.json()
      const pdf = data.pdf
      
      if (pdf) {
        setPdfInfo({
          id: pdf.id,
          name: pdf.name,
          ownerName: pdf.ownerName,
          uploadDate: pdf.upload_date,
          size: pdf.size
        })
      }
    } catch (error) {
      console.error('加载PDF信息失败:', error)
      setError('加载分享信息失败，请检查链接是否有效')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginAndSave = () => {
    // 保存分享ID到localStorage，登录后使用
    localStorage.setItem('pendingShareId', shareId)
    onClose()
    // 跳转到登录页面
    router.push(`/${locale}/auth/login`)
  }

  const handleAcceptShare = async () => {
    if (!isLoggedIn) {
      handleLoginAndSave()
      return
    }

    try {
      setAccepting(true)
      setError(null)

      const response = await fetch('/api/share/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '接收分享失败')
      }

      const result = await response.json()
      
      if (result.success) {
        // 成功接收，跳转到PDF页面
        onClose()
        router.push(`/${locale}/analysis/${result.pdfId}`)
      } else {
        throw new Error(result.message || '接收分享失败')
      }
      
    } catch (error) {
      console.error('接收分享失败:', error)
      setError(error instanceof Error ? error.message : '接收分享失败')
    } finally {
      setAccepting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            朋友分享了PDF
          </DialogTitle>
          {!isLoggedIn && (
            <DialogDescription className="text-sm text-gray-600">
              请先登录即可查看朋友分享的PDF
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : pdfInfo ? (
            <>
              {/* PDF信息卡片 */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Download className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{pdfInfo.name}</h3>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-1" />
                        分享者: {pdfInfo.ownerName}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(pdfInfo.uploadDate)} • {formatFileSize(pdfInfo.size)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 说明文字 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  {isLoggedIn 
                    ? "🎉 接收后，这个PDF将添加到您的账户中，您可以随时查看和使用。"
                    : "💡 登录后，您将获得这个PDF的专属副本，可以自由使用所有功能。"
                  }
                </p>
              </div>

              {/* 错误信息 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-between gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                  disabled={accepting}
                >
                  稍后再说
                </Button>
                <Button 
                  onClick={handleAcceptShare}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={accepting}
                >
                  {accepting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      接收中...
                    </div>
                  ) : (
                    isLoggedIn ? '接收PDF' : '登录并保存'
                  )}
                </Button>
              </div>
            </>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={onClose} variant="outline">关闭</Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}