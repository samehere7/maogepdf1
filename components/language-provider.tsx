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
    
    // 智能推荐功能
    smartRecommendations: 'Smart Recommendations:',
    directQuestion: 'You can also ask questions directly below',
    analyzing: 'Analyzing',
    
    // Git文档推荐
    summarizeGuide: 'Summarize this guide',
    summarizeGuideSubtitle: 'Summarize this guide',
    syncCommands: 'Main sync commands', 
    syncCommandsSubtitle: 'Main commands for syncing code',
    branchingWorkflow: 'Branching advantages',
    branchingWorkflowSubtitle: 'How branching workflows improve collaboration',
    
    // 通用文档推荐
    documentSummary: 'Document summary',
    documentSummarySubtitle: 'Document summary',
    keyPoints: 'Key points',
    keyPointsSubtitle: 'Key points',
    commonQuestions: 'Common questions',
    commonQuestionsSubtitle: 'Frequently asked questions',
    
    // 欢迎消息
    welcomeGitDoc: '📚 Successfully analyzed "{{fileName}}"! This is a Git version control related document. I can help you understand Git concepts, commands and best practices. You can ask questions directly or use the smart recommendations below to quickly understand the core content.',
    welcomeGuideDoc: '📖 Successfully analyzed "{{fileName}}"! This guide document is ready. I can answer any questions about the document, provide detailed explanations, or generate content summaries. Please select the functions below or start asking questions directly.',
    welcomeGeneralDoc: '📄 Successfully analyzed "{{fileName}}"! Document content has been loaded successfully, I am your dedicated document assistant. You can ask about any content in the document, and I will provide accurate answers based on the document. Please use the recommended functions below or ask questions directly.',
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
    
    // 智能推荐功能
    smartRecommendations: '智能推荐功能：',
    directQuestion: '您也可以在下方输入框直接提问',
    analyzing: '正在分析',
    
    // Git文档推荐
    summarizeGuide: '总结本指南',
    summarizeGuideSubtitle: 'Summarize this guide',
    syncCommands: '主要同步命令',
    syncCommandsSubtitle: 'Main commands for syncing code',
    branchingWorkflow: '分支协作优势',
    branchingWorkflowSubtitle: 'How branching workflows improve collaboration',
    
    // 通用文档推荐
    documentSummary: '文档摘要',
    documentSummarySubtitle: 'Document summary',
    keyPoints: '关键要点',
    keyPointsSubtitle: 'Key points',
    commonQuestions: '常见问题',
    commonQuestionsSubtitle: 'Frequently asked questions',
    
    // 欢迎消息
    welcomeGitDoc: '📚 已成功分析《{{fileName}}》！这是一份Git版本控制相关的文档。我可以帮您理解Git的概念、命令和最佳实践。您可以直接提问，或使用下方的智能推荐功能快速了解核心内容。',
    welcomeGuideDoc: '📖 已成功分析《{{fileName}}》！这份指南文档已准备就绪。我可以为您解答文档中的任何问题，提供详细说明，或生成内容摘要。请选择下方功能或直接开始提问。',
    welcomeGeneralDoc: '📄 已成功分析《{{fileName}}》！文档内容已加载完成，我是您的专属文档助手。您可以询问文档的任何内容，我会基于文档为您提供准确的回答。请使用下方推荐功能或直接提问。',
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
  const [language, setLanguage] = useState<Language>('zh')

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