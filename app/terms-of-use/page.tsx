"use client"
import { useLanguage } from "@/hooks/useLanguage"

export default function TermsOfUsePage() {
  const { t } = useLanguage()
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">{t('termsTitle')}</h1>
      <p className="mb-4">{t('termsContent1')}</p>
      <p className="mb-4">{t('termsContent2')}</p>
      <p className="mb-4">{t('termsContent3')}</p>
      <p className="mb-4">{t('termsContact', { email: 'a12311001001@163.com' })}</p>
    </div>
  )
} 