'use client'

import React, { createContext, useContext, useState } from 'react'

export type Language = 'en' | 'zh' | 'ja'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    about: 'About',
    aboutContent: 'About content in English',
    privacyPolicy: 'Privacy Policy',
    privacyContent: 'Privacy policy content in English',
    termsOfUse: 'Terms of Use',
    termsContent: 'Terms of use content in English',
    account: 'Account',
    accountContent: 'Account content in English',
    pricing: 'Pricing',
    pricingContent: 'Pricing content in English',
    uploadPdf: 'Upload PDF',
    onlyPdfAllowed: 'Only PDF files are allowed',
    fileSizeLimit: 'File size must be less than 10MB',
    uploadError: 'Upload failed',
    clickToUpload: 'Click to upload',
    orDragAndDrop: 'or drag and drop',
    pdfMaxSize: 'PDF up to 10MB',
    heroTitleV2: 'Chat with your PDF',
    heroDescriptionV2: 'The best way to chat with your PDF documents for students, researchers and professionals',
  },
  zh: {
    about: '关于',
    aboutContent: '关于内容中文版',
    privacyPolicy: '隐私政策',
    privacyContent: '隐私政策内容中文版',
    termsOfUse: '使用条款',
    termsContent: '使用条款内容中文版',
    account: '账户',
    accountContent: '账户内容中文版',
    pricing: '价格',
    pricingContent: '价格内容中文版',
    uploadPdf: '上传PDF',
    onlyPdfAllowed: '只允许上传PDF文件',
    fileSizeLimit: '文件大小必须小于10MB',
    uploadError: '上传失败',
    clickToUpload: '点击上传',
    orDragAndDrop: '或拖放文件',
    pdfMaxSize: 'PDF最大10MB',
    heroTitleV2: '与您的PDF对话',
    heroDescriptionV2: '为学生、研究者和专业人士提供的最佳PDF对话方式',
  },
  ja: {
    about: '概要',
    aboutContent: '日本語の概要コンテンツ',
    privacyPolicy: 'プライバシーポリシー',
    privacyContent: '日本語のプライバシーポリシー',
    termsOfUse: '利用規約',
    termsContent: '日本語の利用規約',
    account: 'アカウント',
    accountContent: '日本語のアカウント内容',
    pricing: '価格',
    pricingContent: '日本語の価格内容',
    uploadPdf: 'PDFをアップロード',
    onlyPdfAllowed: 'PDFファイルのみアップロード可能です',
    fileSizeLimit: 'ファイルサイズは10MB未満である必要があります',
    uploadError: 'アップロードに失敗しました',
    clickToUpload: 'クリックしてアップロード',
    orDragAndDrop: 'またはドラッグ＆ドロップ',
    pdfMaxSize: 'PDFは最大10MB',
    heroTitleV2: 'PDFとチャット',
    heroDescriptionV2: '学生、研究者、専門家のための最高のPDFチャット体験',
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    // 提供默认值而不是抛出错误，避免在SSR/hydration过程中出错
    console.warn('useLanguage called outside of LanguageProvider, using defaults')
    return {
      language: 'zh' as Language,
      setLanguage: () => {},
      t: (key: string) => key
    }
  }
  return context
} 