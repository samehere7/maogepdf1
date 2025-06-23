"use client"

import { useLocale } from "next-intl"

export default function TermsOfUsePage() {
  const t = useTranslations()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('termsOfUse')}</h1>
      <div className="prose max-w-none">
        <p>{t('termsContent')}</p>
      </div>
    </div>
  )
} 