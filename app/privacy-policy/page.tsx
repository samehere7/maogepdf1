"use client"

import { useLanguage } from "@/components/language-provider"

export default function PrivacyPolicyPage() {
  const { t } = useLanguage()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('privacyPolicy')}</h1>
      <div className="prose max-w-none">
        <p>{t('privacyContent')}</p>
      </div>
    </div>
  )
} 