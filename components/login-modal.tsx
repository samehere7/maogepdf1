"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/hooks/use-language"

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