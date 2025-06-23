"use client"

import { useLocale } from "next-intl"

export default function PrivacyPolicyPage() {
  const t = useTranslations()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('privacyPolicy')}</h1>
      <div className="prose max-w-none">
        <p>{t('privacyContent')}</p>
      </div>
    </div>
  )
} 