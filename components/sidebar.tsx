"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLanguage } from "@/hooks/use-language"

interface UserInfo {
  name: string
  email: string
  isLoggedIn: boolean
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    // Load user info from localStorage
    const savedUserInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
    if (savedUserInfo.isLoggedIn) {
      setUserInfo(savedUserInfo)
    }
  }, [])

  const navigation = [
    { name: "home", href: "/", icon: "home" },
    { name: "myPdfs", href: "/account", icon: "description" },
    { name: "explore", href: "/", icon: "explore" },
    { name: "upgrade", href: "/pricing", icon: "rocket_launch" },
    { name: "account", href: "/account", icon: "person" },
  ]

  const handleLogout = () => {
    // Clear user session data
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
    localStorage.setItem("userInfo", JSON.stringify({
      ...userInfo,
      isLoggedIn: false
    }))
    router.push("/")
  }

  return (
    <aside className="w-72 bg-white shadow-md flex flex-col p-6 space-y-6 border-r border-slate-200">
      <div className="flex items-center gap-3">
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-slate-300"
          style={{ 
            backgroundImage: userInfo?.isLoggedIn 
              ? 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA6IhW592oJH7AwT9DjMtVEWXh8NHP1Yh6MKd3UbP61_uKdfoaFoHi5f-pJ0aYqXcpcxUIuG718DoNTXoEu1Zctidl-xP1MrjbvT6yE0KJp3IRTeSucfpMEvikR6PcLVNyB9eEHPr0ERqzgpi93OZCAN5qIvq-U43WN3rQK-y2wez_TYLP4ymvJPNxtHFeepfLwcEnk3K04dsiT1y2TtCx0Z1f-ZMPBlUAv_0KKo90xe-SMBm-JtqHVCW5Zaaq8YClXGnQvz347ttg")'
              : 'url("/placeholder.svg?height=40&width=40")' 
          }}
        ></div>
        <h1 className="text-slate-800 text-lg font-semibold">Maoge PDF</h1>
      </div>

      <nav className="flex flex-col gap-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href === "/account" && pathname.startsWith("/account"))

          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                isActive ? "bg-[#d2e2f3] text-slate-900" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className={`material-icons ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                {item.icon}
              </span>
              <p className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{t(item.name)}</p>
            </a>
          )
        })}
      </nav>

      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors duration-150 w-full"
        >
          <span className="material-icons text-slate-600">logout</span>
          <p className="text-sm font-medium">{t("logout")}</p>
        </button>
      </div>
    </aside>
  )
}
