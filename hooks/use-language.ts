import { useState, useEffect, createContext, useContext } from "react"

const translations = {
  en: {
    account: "Account",
    personalInformation: "Personal Information",
    name: "Name",
    email: "Email",
    password: "Password",
    enterYourName: "Enter your name",
    enterYourEmail: "Enter your email",
    enterNewPassword: "Enter new password",
    updateInformation: "Update Information",
    informationUpdated: "Information updated successfully",
    myPdfs: "My PDFs",
    dateAnalyzed: "Date Analyzed",
    actions: "Actions",
    viewAnalysis: "View Analysis",
    noPdfsUploaded: "No PDFs uploaded yet",
    subscription: "Subscription",
    currentPlan: "Current Plan",
    status: "Status",
    nextBillingDate: "Next Billing Date",
    manageSubscription: "Manage Subscription"
  },
  zh: {
    account: "账户",
    personalInformation: "个人信息",
    name: "姓名",
    email: "邮箱",
    password: "密码",
    enterYourName: "请输入您的姓名",
    enterYourEmail: "请输入您的邮箱",
    enterNewPassword: "请输入新密码",
    updateInformation: "更新信息",
    informationUpdated: "信息更新成功",
    myPdfs: "我的PDF文件",
    dateAnalyzed: "分析日期",
    actions: "操作",
    viewAnalysis: "查看分析",
    noPdfsUploaded: "暂无上传的PDF文件",
    subscription: "订阅",
    currentPlan: "当前计划",
    status: "状态",
    nextBillingDate: "下次账单日期",
    manageSubscription: "管理订阅"
  }
}

type LanguageContextType = {
  language: string
  changeLanguage: (lang: string) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  changeLanguage: () => {},
  t: (key: string) => key
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage) {
      setLanguage(savedLanguage)
    } else {
      const browserLanguage = navigator.language.split("-")[0]
      setLanguage(browserLanguage)
      localStorage.setItem("language", browserLanguage)
    }
  }, [])

  const changeLanguage = (newLanguage: string) => {
    setLanguage(newLanguage)
    localStorage.setItem("language", newLanguage)
  }

  const t = (key: string) => {
    return translations[language as keyof typeof translations]?.[key as keyof typeof translations.en] || key
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
} 