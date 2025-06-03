"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLanguage } from "@/hooks/use-language"
import { signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface UserInfo {
  name: string
  email: string
  isLoggedIn: boolean
}

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderName, setFolderName] = useState("我的文件夹")
  const [folders, setFolders] = useState<any[]>([])
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState("")

  useEffect(() => {
    // Load user info from localStorage
    const savedUserInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
    if (savedUserInfo.isLoggedIn) {
      setUserInfo(savedUserInfo)
    }
    // 加载文件夹列表
    const savedFolders = JSON.parse(localStorage.getItem("uploadedFolders") || "[]")
    setFolders(savedFolders)
  }, [])

  const routes = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
    },
    {
      href: "/account",
      label: "Account",
      active: pathname === "/account",
    },
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

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf")) {
      alert("只允许上传PDF文件")
      return
    }
    // 构造 FormData
    const formData = new FormData();
    formData.append('file', file);

    // 上传到后端
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.url) {
      alert('上传失败');
      return;
    }

    const fileInfo = {
      name: file.name,
      size: file.size,
      uploadDate: new Date().toISOString(),
      id: Date.now().toString(),
      url: data.url, // 用后端返回的真实 URL
    }
    const existingFiles = JSON.parse(localStorage.getItem("uploadedPdfs") || "[]")
    existingFiles.push(fileInfo)
    localStorage.setItem("uploadedPdfs", JSON.stringify(existingFiles))
    alert("上传成功！")
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleCreateFolder = () => {
    if (!folderName.trim()) return
    const newFolder = { id: Date.now().toString(), name: folderName.trim() }
    const newFolders = [...folders, newFolder]
    setFolders(newFolders)
    localStorage.setItem("uploadedFolders", JSON.stringify(newFolders))
    setShowFolderModal(false)
    setFolderName("我的文件夹")
  }

  const handleRenameFolder = (id: string) => {
    if (!editFolderName.trim()) return
    const newFolders = folders.map(f => f.id === id ? { ...f, name: editFolderName.trim() } : f)
    setFolders(newFolders)
    localStorage.setItem("uploadedFolders", JSON.stringify(newFolders))
    setEditingFolderId(null)
    setEditFolderName("")
  }

  const handleDeleteFolder = (id: string) => {
    const newFolders = folders.filter(f => f.id !== id)
    setFolders(newFolders)
    localStorage.setItem("uploadedFolders", JSON.stringify(newFolders))
  }

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                  route.active ? "text-primary bg-primary/10" : "text-zinc-400"
                )}
              >
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
