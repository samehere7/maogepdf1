"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Copy, X, Check } from "lucide-react"
import { supabase } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

interface ShareChatModalProps {
  isOpen: boolean
  onClose: () => void
  pdfId: string
  pdfName: string
}

export default function ShareChatModal({ isOpen, onClose, pdfId, pdfName }: ShareChatModalProps) {
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const t = useTranslations()

  // 生成分享链接
  const generateShareLink = async () => {
    try {
      setIsGenerating(true)
      console.log('[分享] 开始生成分享链接，PDF ID:', pdfId)
      
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[分享] 用户状态:', user ? `已登录 ${user.id}` : '未登录')
      
      if (!user) {
        console.error('[分享] 用户未登录')
        throw new Error(t('share.userNotLoggedIn'))
      }

      // 创建分享记录
      console.log('[分享] 调用分享创建API...')
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfId,
          userId: user.id
        }),
      })

      console.log('[分享] API响应状态:', response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('[分享] API错误响应:', errorData)
        throw new Error(`${t('share.createShareLinkFailed')}: ${response.status}`)
      }

      const data = await response.json()
      console.log('[分享] API返回数据:', data)
      const shareId = data.shareId
      
      if (!shareId) {
        throw new Error(t('share.shareIdNotReceived'))
      }
      
      // 生成完整的分享URL
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const fullShareUrl = `${baseUrl}/share/${shareId}`
      console.log('[分享] 生成的分享链接:', fullShareUrl)
      setShareUrl(fullShareUrl)
      
    } catch (error) {
      console.error('[分享] 生成分享链接失败:', error)
      // 降级处理：生成一个正确格式的临时链接
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const tempShareId = `${pdfId}-${Date.now()}-temp`
      const fallbackUrl = `${baseUrl}/share/${tempShareId}`
      console.log('[分享] 使用降级链接:', fallbackUrl)
      setShareUrl(fallbackUrl)
    } finally {
      setIsGenerating(false)
    }
  }

  // 复制链接到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error(`${t('share.copyFailed')}:`, error)
      // 降级处理：选中文本
      const input = document.querySelector('input[value="' + shareUrl + '"]') as HTMLInputElement
      if (input) {
        input.select()
        input.setSelectionRange(0, 99999) // 移动端兼容
        try {
          document.execCommand('copy')
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch (err) {
          console.error(`${t('share.fallbackCopyFailed')}:`, err)
        }
      }
    }
  }

  // 当弹窗打开时生成分享链接
  useEffect(() => {
    if (isOpen && !shareUrl) {
      generateShareLink()
    }
  }, [isOpen])

  // 重置状态当弹窗关闭时
  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {t('share.shareThisPdf')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 说明文字 */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {t('share.shareDescription')}
          </p>
          
          {/* 分享链接输入框 */}
          <div className="flex items-center space-x-2">
            <Input
              value={isGenerating ? t('share.generatingLink') : shareUrl}
              readOnly
              className="flex-1 bg-gray-50 border-gray-200 text-sm font-mono text-gray-700 px-3 py-2"
              placeholder={isGenerating ? t('share.generatingLink') : t('share.shareLinkPlaceholder')}
            />
            <Button
              onClick={copyToClipboard}
              disabled={!shareUrl || isGenerating}
              variant="outline"
              size="sm"
              className={`shrink-0 min-w-[80px] ${
                copied 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t('share.copied')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  {t('share.copyLink')}
                </>
              )}
            </Button>
          </div>
          
          {/* 底部提示 */}
          <p className="text-xs text-gray-500 leading-relaxed">
            {t('share.shareNote')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}