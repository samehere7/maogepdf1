"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLanguage } from "@/hooks/use-language"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Upload, FolderPlus } from "lucide-react"
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
  const [pdfs, setPdfs] = useState<any[]>([])

  useEffect(() => {
    // Load user info from localStorage
    const savedUserInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
    if (savedUserInfo.isLoggedIn) {
      setUserInfo(savedUserInfo)
    }
    // 加载文件夹列表
    const savedFolders = JSON.parse(localStorage.getItem("uploadedFolders") || "[]")
    setFolders(savedFolders)
    // 加载PDF文件列表
    const savedPdfs = JSON.parse(localStorage.getItem("uploadedPdfs") || "[]")
    setPdfs(savedPdfs)
  }, [])

  const handleLogout = () => {
    // Clear user session data
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
    localStorage.setItem("userInfo", JSON.stringify({
      ...userInfo,
      isLoggedIn: false
    }))
    router.push("/")
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf")) {
      alert("只允许上传PDF文件")
      return
    }
    // 构造 FormData
    const formData = new FormData();
    formData.append('file', file);

    try {
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
      setPdfs(existingFiles)
      router.push(`/analysis/${fileInfo.id}`)
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请稍后重试')
    }
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

  const handleDeletePdf = (id: string) => {
    const newPdfs = pdfs.filter(pdf => pdf.id !== id)
    setPdfs(newPdfs)
    localStorage.setItem("uploadedPdfs", JSON.stringify(newPdfs))
  }

  return (
    <div className={cn("flex flex-col h-full bg-[#121212] text-white", className)}>
      {/* 顶部标题 */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-600 text-white font-bold">
          P
        </div>
        <h1 className="text-xl font-semibold">ChatPDF</h1>
      </div>

      {/* 上传和新建按钮 */}
      <div className="p-3 space-y-2">
        <button
          onClick={handleUploadClick}
          className="w-full py-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] rounded-md text-center transition"
        >
          上传 PDF
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInput} 
          accept=".pdf" 
          className="hidden" 
        />
        
        <button
          onClick={() => setShowFolderModal(true)}
          className="w-full py-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] rounded-md text-center transition"
        >
          新建文件夹
        </button>
      </div>

      {/* PDF 文件列表 */}
      <div className="flex-1 overflow-auto p-3">
        {pdfs.map((pdf) => (
          <Link
            href={`/analysis/${pdf.id}`}
            key={pdf.id}
            className="flex items-center justify-between p-2 mb-1 hover:bg-[#2a2a2a] rounded-md group"
          >
            <div className="flex items-center">
              <span className="text-gray-300">{pdf.name}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/analysis/${pdf.id}?edit=true`);
                }}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <Pencil size={16} />
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeletePdf(pdf.id);
                }}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Link>
        ))}

        {/* 文件夹列表 */}
        {folders.map((folder) => (
          <div 
            key={folder.id}
            className="flex items-center justify-between p-2 mb-1 hover:bg-[#2a2a2a] rounded-md group"
          >
            {editingFolderId === folder.id ? (
              <Input 
                value={editFolderName} 
                onChange={(e) => setEditFolderName(e.target.value)}
                onBlur={() => handleRenameFolder(folder.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(folder.id)}
                className="h-8 text-sm bg-gray-800 border-gray-700"
                autoFocus
              />
            ) : (
              <>
                <div className="flex items-center">
                  <span>{folder.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button 
                    onClick={() => {
                      setEditingFolderId(folder.id);
                      setEditFolderName(folder.name);
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 创建文件夹模态框 */}
      <Dialog open={showFolderModal} onOpenChange={setShowFolderModal}>
        <DialogContent className="sm:max-w-md bg-[#1e1e1e] text-white border-gray-800">
          <h2 className="text-xl font-semibold mb-4">新建文件夹</h2>
          <Input
            placeholder="输入文件夹名称"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="bg-[#2a2a2a] border-gray-700 mb-4"
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFolderModal(false)}
              className="border-gray-700 hover:bg-gray-800"
            >
              取消
            </Button>
            <Button 
              onClick={handleCreateFolder}
              className="bg-purple-600 hover:bg-purple-700"
            >
              创建
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
