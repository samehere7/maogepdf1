"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"

interface LoginModalProps {
  children: React.ReactNode
}

export function LoginModal({ children }: LoginModalProps) {
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    window.location.href = '/auth/login';
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-4">{t('login')}</h2>
          <p className="text-slate-500 text-center mb-8">{t('loginPrompt')}</p>
          <Button
            type="button"
            className="w-full h-12 bg-white border border-slate-300 text-slate-700 flex items-center justify-center gap-2 mb-4 hover:bg-slate-50"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_17_40)">
                <path d="M47.5 24.5C47.5 22.6 47.3 20.8 47 19H24V29.1H37.4C36.7 32.2 34.7 34.7 31.8 36.4V42.1H39.3C44 38 47.5 31.9 47.5 24.5Z" fill="#4285F4"/>
                <path d="M24 48C30.6 48 36.1 45.9 39.3 42.1L31.8 36.4C30.1 37.5 27.9 38.2 24 38.2C17.7 38.2 12.2 34.1 10.3 28.7H2.5V34.6C5.7 41.1 14.1 48 24 48Z" fill="#34A853"/>
                <path d="M10.3 28.7C9.8 27.6 9.5 26.4 9.5 25.2C9.5 24 9.8 22.8 10.3 21.7V15.8H2.5C0.8 19.1 0 22.9 0 25.2C0 27.5 0.8 31.3 2.5 34.6L10.3 28.7Z" fill="#FBBC05"/>
                <path d="M24 9.8C27.2 9.8 29.7 10.9 31.3 12.3L39.4 5.1C36.1 2.1 30.6 0 24 0C14.1 0 5.7 6.9 2.5 15.8L10.3 21.7C12.2 16.3 17.7 9.8 24 9.8Z" fill="#EA4335"/>
              </g>
              <defs>
                <clipPath id="clip0_17_40">
                  <rect width="48" height="48" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            {isLoading ? t("loggingIn") : "使用 Google 登录"}
          </Button>
          <p className="text-xs text-slate-400 text-center">
            {t("termsAndConditionsPrompt")}
            <a href="/terms" className="underline hover:text-slate-500">{t("termsOfService")}</a>
            {t('and')}
            <a href="/privacy" className="underline hover:text-slate-500">{t("privacyPolicy")}</a>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 