"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface ShareDetectorProps {
  onShareDetected: (shareId: string) => void
}

export default function ShareDetector({ onShareDetected }: ShareDetectorProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const shareParam = searchParams.get('share')
    if (shareParam) {
      onShareDetected(shareParam)
      // 清除URL中的分享参数
      const url = new URL(window.location.href)
      url.searchParams.delete('share')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [searchParams, onShareDetected])

  return null // 这个组件不渲染任何内容
}