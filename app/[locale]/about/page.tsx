"use client"

import { useLocale, useTranslations } from "next-intl"

export default function AboutPage() {
  const t = useTranslations()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('about')}</h1>
      <div className="prose max-w-none">
        <p>{t('aboutContent')}</p>
      </div>
    </div>
  )
} 