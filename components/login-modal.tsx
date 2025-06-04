"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/components/language-provider"
import { signIn } from "next-auth/react"

interface LoginModalProps {
  children: React.ReactNode
}

export function LoginModal({ children }: LoginModalProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    })
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    })
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate login process
    setTimeout(() => {
      // Store user info in localStorage
      const userInfo = {
        name: "Demo User",
        email: loginData.email,
        isLoggedIn: true,
      }
      localStorage.setItem("userInfo", JSON.stringify(userInfo))
      setIsLoading(false)
      
      // Redirect to account page
      router.push("/account")
    }, 1000)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Simulate registration process
    setTimeout(() => {
      // Store user info in localStorage
      const userInfo = {
        name: registerData.name,
        email: registerData.email,
        isLoggedIn: true,
      }
      localStorage.setItem("userInfo", JSON.stringify(userInfo))
      setIsLoading(false)
      
      // Redirect to account page
      router.push("/account")
    }, 1000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">{t("login")}</TabsTrigger>
            <TabsTrigger value="register">{t("register")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Button
              type="button"
              className="w-full h-12 bg-white border border-slate-300 text-slate-700 flex items-center justify-center gap-2 mb-4 hover:bg-slate-50"
              onClick={() => signIn("google")}
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
              使用 Google 登录
            </Button>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">或邮箱登录</span>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  {t("email")}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("enterYourEmail")}
                  required
                  value={loginData.email}
                  onChange={handleLoginChange}
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    {t("password")}
                  </label>
                  <a href="#" className="text-xs text-[#3b82f6] hover:text-[#2563eb]">
                    {t("forgotPassword")}
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="h-12"
                />
              </div>
              
              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#2A66A9] hover:bg-[#22558C] text-white"
                disabled={isLoading}
              >
                {isLoading ? t("loggingIn") : t("login")}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="register-name" className="text-sm font-medium text-slate-700">
                  {t("name")}
                </label>
                <Input
                  id="register-name"
                  name="name"
                  type="text"
                  placeholder={t("enterYourName")}
                  required
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm font-medium text-slate-700">
                  {t("email")}
                </label>
                <Input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder={t("enterYourEmail")}
                  required
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-password" className="text-sm font-medium text-slate-700">
                  {t("password")}
                </label>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-confirm-password" className="text-sm font-medium text-slate-700">
                  {t("confirmPassword")}
                </label>
                <Input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  className="h-12"
                />
              </div>
              
              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#2A66A9] hover:bg-[#22558C] text-white"
                disabled={isLoading}
              >
                {isLoading ? t("registering") : t("register")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 