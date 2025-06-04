"use client"
import { useLanguage } from "@/hooks/useLanguage"

export default function AboutPage() {
  const { t } = useLanguage()
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">{t('aboutTitle')}</h1>
      <p className="mb-4">{t('aboutContent1')}</p>
      <p className="mb-4">{t('aboutContent2')}</p>
      <p className="mb-4">{t('aboutContact', { email: 'a12311001001@163.com' })}</p>
    </div>
  )
} 