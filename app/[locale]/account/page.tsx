"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/sidebar"
import { useLocale, useTranslations } from "next-intl"

export default function AccountPage() {
  const t = useTranslations()
  const router = useRouter()
  const locale = useLocale()
  const [userPdfs, setUserPdfs] = useState<any[]>([])
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [subscription, setSubscription] = useState({
    plan: "Premium Monthly",
    status: "Active",
    nextBillingDate: "2024-07-15"
  })

  useEffect(() => {
    // Check if user is logged in
    const savedUserInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
    if (!savedUserInfo.isLoggedIn) {
      router.push(`/${locale}`)
      return
    }

    // Load user info from localStorage
    setUserInfo((prev) => ({ ...prev, ...savedUserInfo }))

    // Load user PDFs from localStorage
    const pdfs = JSON.parse(localStorage.getItem("uploadedPdfs") || "[]")
    setUserPdfs(pdfs)
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault()
    // Save user info to localStorage
    const updatedUserInfo = {
      ...userInfo,
      isLoggedIn: true
    }
    localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo))
    alert(t("informationUpdated"))
  }

  const handleManageSubscription = () => {
    // Open subscription management page or modal
    router.push(`/${locale}/pricing`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-slate-800 text-3xl font-bold tracking-tight">{t("account")}</h2>
        </header>

        {/* Personal Information */}
        <section className="mb-10 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-slate-800 text-xl font-semibold leading-tight tracking-tight mb-6">
            {t("personalInformation")}
          </h3>
          <form className="space-y-6 max-w-xl" onSubmit={handleUpdateInfo}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="name">
                {t("name")}
              </label>
              <Input
                id="name"
                placeholder={t("enterYourName")}
                value={userInfo.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="h-12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                {t("email")}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t("enterYourEmail")}
                value={userInfo.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="password">
                {t("password")}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={t("enterNewPassword")}
                value={userInfo.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="h-12"
              />
            </div>
            <div className="pt-2">
              <Button type="submit" className="bg-[#d2e2f3] text-slate-900 hover:bg-[#b3d1f0] h-11">
                {t("updateInformation")}
              </Button>
            </div>
          </form>
        </section>

        {/* My PDFs */}
        <section className="mb-10 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-slate-800 text-xl font-semibold leading-tight tracking-tight mb-6">{t("myPdfs")}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-sm font-semibold text-slate-900">{t("name")}</th>
                  <th className="px-6 py-3.5 text-left text-sm font-semibold text-slate-900">{t("dateAnalyzed")}</th>
                  <th className="px-6 py-3.5 text-left text-sm font-semibold text-slate-900">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {userPdfs.map((pdf: any) => (
                  <tr key={pdf.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-800">{pdf.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {new Date(pdf.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <a className="text-[#3b82f6] hover:text-[#2563eb] font-medium" href={`/${locale}/analysis/${pdf.id}`}>
                        {t("viewAnalysis")}
                      </a>
                    </td>
                  </tr>
                ))}
                {userPdfs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      {t("noPdfsUploaded")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-slate-800 text-xl font-semibold leading-tight tracking-tight mb-6">
            {t("subscription")}
          </h3>
          <form className="space-y-6 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="plan">
                {t("currentPlan")}
              </label>
              <Input id="plan" value={subscription.plan} disabled className="h-12 bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="status">
                {t("status")}
              </label>
              <Input id="status" value={subscription.status} disabled className="h-12 bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="billing-date">
                {t("nextBillingDate")}
              </label>
              <Input id="billing-date" value={subscription.nextBillingDate} disabled className="h-12 bg-slate-50" />
            </div>
            <div className="pt-2">
              <Button 
                type="button" 
                className="bg-slate-700 text-white hover:bg-slate-800" 
                onClick={handleManageSubscription}
              >
                {t("manageSubscription")}
              </Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
