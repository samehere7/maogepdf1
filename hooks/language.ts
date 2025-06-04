"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

// 定义类型
export type Language = "en" | "zh" | "ja"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string>) => string
}

const translations = {
  en: {
    // Footer
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    contactUs: "Contact Us",
    allRightsReserved: "All rights reserved.",

    // Privacy, Terms, About pages
    privacyPolicyTitle: "Privacy Policy",
    privacyPolicyContent1: "We value your privacy. Maoge PDF does not store your uploaded PDF files or chat content on our servers. All file processing and AI analysis are performed locally in your browser or securely via our AI API.",
    privacyPolicyContent2: "We only use your email for account management and do not share your personal information with third parties.",
    privacyPolicyContent3: "You may contact us at {email} for any privacy-related questions.",
    privacyPolicyContact: "Contact: {email}",
    termsTitle: "Terms of Use",
    termsContent1: "By using Maoge PDF, you agree to use the service for lawful purposes only. You are responsible for the content you upload and analyze.",
    termsContent2: "Maoge PDF provides AI-powered PDF analysis and chat for informational purposes. We do not guarantee the accuracy or completeness of AI-generated content.",
    termsContent3: "We reserve the right to update these terms at any time. Continued use of the service constitutes acceptance of the updated terms.",
    termsContact: "Contact: {email}",
    aboutTitle: "About Maoge PDF",
    aboutContent1: "Maoge PDF is an AI-powered platform for PDF analysis and chat. Our mission is to help users quickly extract insights, summarize, and interact with PDF documents using advanced AI technology.",
    aboutContent2: "Features include PDF upload and management, AI document analysis, chat with documents, folder organization, and multi-language support.",
    aboutContact: "Contact: {email}",
  },
  zh: {
    // Footer
    termsOfService: "使用条款",
    privacyPolicy: "隐私政策",
    contactUs: "联系我们",
    allRightsReserved: "版权所有。",

    // Privacy, Terms, About pages
    privacyPolicyTitle: "隐私政策",
    privacyPolicyContent1: "我们重视您的隐私。猫哥PDF不会在我们的服务器上存储您上传的PDF文件或聊天内容。所有文件处理和AI分析都在您的浏览器本地进行，或通过我们的AI API安全地进行。",
    privacyPolicyContent2: "我们仅使用您的电子邮件进行账户管理，不会与第三方共享您的个人信息。",
    privacyPolicyContent3: "如有任何隐私相关问题，您可以通过 {email} 联系我们。",
    privacyPolicyContact: "联系方式：{email}",
    termsTitle: "使用条款",
    termsContent1: "使用猫哥PDF即表示您同意仅将服务用于合法目的。您对上传和分析的内容负责。",
    termsContent2: "猫哥PDF提供AI驱动的PDF分析和聊天，仅供参考。我们不保证AI生成内容的准确性或完整性。",
    termsContent3: "我们保留随时更新这些条款的权利。继续使用服务即表示接受更新后的条款。",
    termsContact: "联系方式：{email}",
    aboutTitle: "关于猫哥PDF",
    aboutContent1: "猫哥PDF是一个AI驱动的PDF分析和聊天平台。我们的使命是帮助用户使用先进的AI技术快速提取见解，总结并与PDF文档交互。",
    aboutContent2: "功能包括PDF上传和管理，AI文档分析，文档聊天，文件夹组织和多语言支持。",
    aboutContact: "联系方式：{email}",
  },
  ja: {
    // Footer
    termsOfService: "利用規約",
    privacyPolicy: "プライバシーポリシー",
    contactUs: "お問い合わせ",
    allRightsReserved: "全著作権所有。",

    // Privacy, Terms, About pages
    privacyPolicyTitle: "プライバシーポリシー",
    privacyPolicyContent1: "私たちはお客様のプライバシーを大切にします。Maoge PDFはアップロードされたPDFやチャット内容をサーバーに保存しません。すべてのファイル処理とAI分析はお客様のブラウザ内または安全なAI API経由で行われます。",
    privacyPolicyContent2: "メールアドレスはアカウント管理のみに使用し、第三者に個人情報を提供することはありません。",
    privacyPolicyContent3: "プライバシーに関するご質問は {email} までご連絡ください。",
    privacyPolicyContact: "連絡先：{email}",
    termsTitle: "利用規約",
    termsContent1: "Maoge PDFのご利用にあたり、法令に従った目的でのみサービスを利用することに同意したものとみなします。アップロードおよび分析する内容についてはご自身の責任となります。",
    termsContent2: "Maoge PDFが提供するAIによるPDF分析・チャットは情報提供のみを目的としています。AI生成コンテンツの正確性や完全性は保証しません。",
    termsContent3: "本規約は随時更新される場合があります。サービスの継続利用は最新規約への同意とみなします。",
    termsContact: "連絡先：{email}",
    aboutTitle: "Maoge PDFについて",
    aboutContent1: "Maoge PDFはAIを活用したPDF分析・チャットプラットフォームです。高度なAI技術でPDF文書の要点抽出・要約・対話を迅速に実現することを目指しています。",
    aboutContent2: "PDFのアップロード・管理、AIによる文書分析、ドキュメントチャット、フォルダ管理、多言語対応などの機能を備えています。",
    aboutContact: "連絡先：{email}",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("language") as Language) || "zh"
    }
    return "zh"
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", language)
    }
  }, [language])

  const t = (key: string, params?: Record<string, string>): string => {
    let str = translations[language]?.[key] || key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`{${k}}`, 'g'), v)
      })
    }
    return str
  }

  const value = { language, setLanguage, t }
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
} 