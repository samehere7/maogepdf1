"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Globe } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
]

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 min-w-[100px] bg-white text-gray-900 border border-gray-300 shadow-sm hover:bg-gray-100">
          <Globe className="h-4 w-4" />
          <span className="text-sm">
            {currentLanguage.flag} {currentLanguage.name}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => {
              setLanguage(lang.code as import("./language-provider").Language)
              setOpen(false)
            }}
            className={`flex items-center gap-2 cursor-pointer ${language === lang.code ? "bg-slate-100" : ""}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
