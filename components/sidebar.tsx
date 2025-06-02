"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLanguage } from "@/hooks/use-language"
import { signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2 } from "lucide-react"

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
    <aside className="fixed top-0 left-0 h-screen w-[300px] bg-[#18181b] flex flex-col px-4 pt-4 pb-2 z-30">
      {/* 顶部logo+产品名 */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <img src="/logo.svg" alt="logo" className="h-8 w-8" />
        <span className="text-white text-2xl font-bold tracking-tight">MaogePDF</span>
      </div>
      {/* 操作按钮区 */}
      <div className="flex flex-col gap-3 mb-6">
        <Button
          className="w-full h-12 text-base font-semibold bg-[#23232a] text-white border border-[#35353c] rounded-xl hover:bg-[#23232a]/80 flex items-center justify-center gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          上传 PDF
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileInput}
        />
        <Button
          className="w-full h-12 text-base font-semibold bg-[#23232a] text-white border border-[#35353c] rounded-xl hover:bg-[#23232a]/80 flex items-center justify-center gap-2"
          onClick={() => setShowFolderModal(true)}
        >
          新建文件夹
        </Button>
      </div>
      {/* 文件夹列表 */}
      {folders.length > 0 && (
        <div className="mb-8">
          {folders.map(folder => (
            <div key={folder.id} className="w-full px-3 py-2 mb-2 rounded-lg bg-[#23232a] text-white text-base font-medium truncate flex items-center group">
              {editingFolderId === folder.id ? (
                <input
                  className="flex-1 bg-[#23232a] border border-[#8b5cf6] rounded px-2 py-1 text-white outline-none"
                  value={editFolderName}
                  onChange={e => setEditFolderName(e.target.value)}
                  onBlur={() => handleRenameFolder(folder.id)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameFolder(folder.id) }}
                  autoFocus
                />
              ) : (
                <>
                  <span className="flex-1 truncate">{folder.name}</span>
                  <button
                    className="ml-2 p-1 text-gray-400 hover:text-[#8b5cf6]"
                    onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name) }}
                    title="重命名"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="ml-1 p-1 text-gray-400 hover:text-red-400"
                    onClick={() => handleDeleteFolder(folder.id)}
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {/* 新建文件夹弹窗 */}
      <Dialog open={showFolderModal} onOpenChange={setShowFolderModal}>
        <DialogContent className="max-w-md">
          <div className="text-lg font-bold mb-4">创建新文件夹</div>
          <Input
            className="mb-3 border-[#8b5cf6] focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            autoFocus
          />
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-slate-700 mb-4">
            使用文件夹可以：<br />
            • 管理文件<br />
            • 同时与多个文件进行聊天
          </div>
          <div className="flex justify-end">
            <Button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-6" onClick={handleCreateFolder}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* 聊天历史区/提示区 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* 插画（可用svg或占位div） */}
        <div className="mb-4">
          <img src="/chat-history-illustration.svg" alt="history" className="w-32 h-20 opacity-80" />
        </div>
        <div className="text-gray-300 text-sm mb-4 text-center">登录免费保存你的聊天记录</div>
        <Button
          className="w-24 h-10 text-base font-bold bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg shadow"
          onClick={() => signIn("google")}
        >
          登录
        </Button>
      </div>
      {/* 底部菜单区 */}
      <div className="mt-auto pt-6 border-t border-[#23232a]">
        {/* 语言/AI Scholar/AI检测器等保留 */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1 text-gray-400 text-sm cursor-pointer">
            <span className="material-icons text-base">language</span>
            <span>ZH</span>
            <span className="material-icons text-xs">expand_more</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span className="material-icons text-base">settings</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-gray-400 text-sm px-1 mb-4">
          <div className="flex items-center gap-2 cursor-pointer"><span className="material-icons text-base">school</span>AI Scholar</div>
          <div className="flex items-center gap-2 cursor-pointer"><span className="material-icons text-base">science</span>AI检测器</div>
        </div>
        {/* 登录信息区 */}
        <div className="bg-[#23232a] rounded-xl px-3 py-4 flex flex-col items-center gap-3 mb-2">
          {userInfo && userInfo.isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 w-full">
                <div className="bg-[#8b5cf6] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                  {userInfo.name?.[0]?.toUpperCase() || userInfo.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold truncate">{userInfo.email}</div>
                </div>
              </div>
              <Button className="w-full bg-[#a21cf7] hover:bg-[#9333ea] text-white font-bold rounded-lg text-base py-2" onClick={() => alert('会员功能开发中~')}>升级到 Plus</Button>
            </>
          ) : (
            <Button className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold rounded-lg text-base py-2" onClick={() => signIn('google')}>登录</Button>
          )}
        </div>
      </div>
    </aside>
  )
}
