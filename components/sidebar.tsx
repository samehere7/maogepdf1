"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, FolderIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function Sidebar({ className }: { className?: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderName, setFolderName] = useState("我的文件夹")
  const [folders, setFolders] = useState<any[]>([])
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState("")
  const [pdfs, setPdfs] = useState<any[]>([])
  const [draggedPdfId, setDraggedPdfId] = useState<string | null>(null)
  const [folderStructure, setFolderStructure] = useState<{[key: string]: string[]}>({})

  useEffect(() => {
    setFolders(JSON.parse(localStorage.getItem("uploadedFolders") || "[]"))
    setPdfs(JSON.parse(localStorage.getItem("uploadedPdfs") || "[]"))
    setFolderStructure(JSON.parse(localStorage.getItem("folderStructure") || "{}"))
  }, [])

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!file.type.includes("pdf")) {
        alert("只允许上传PDF文件")
        return
      }
      const fileUrl = URL.createObjectURL(file)
      const fileInfo = {
        name: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        id: Date.now().toString(),
        url: fileUrl,
      }
      const existingFiles = JSON.parse(localStorage.getItem("uploadedPdfs") || "[]")
      existingFiles.push(fileInfo)
      localStorage.setItem("uploadedPdfs", JSON.stringify(existingFiles))
      setPdfs(existingFiles)
      router.push(`/analysis/${fileInfo.id}`)
    }
  }

  const handleCreateFolder = () => {
    if (!folderName.trim()) return
    const newFolder = { id: Date.now().toString(), name: folderName.trim() }
    const newFolders = [...folders, newFolder]
    setFolders(newFolders)
    localStorage.setItem("uploadedFolders", JSON.stringify(newFolders))
    
    // Initialize empty folder in structure
    const newStructure = { ...folderStructure, [newFolder.id]: [] }
    setFolderStructure(newStructure)
    localStorage.setItem("folderStructure", JSON.stringify(newStructure))
    
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
    
    // Remove folder from structure and move PDFs back to root
    const { [id]: removedPdfs, ...newStructure } = folderStructure
    setFolderStructure(newStructure)
    localStorage.setItem("folderStructure", JSON.stringify(newStructure))
  }

  const handleDeletePdf = (id: string) => {
    const newPdfs = pdfs.filter(pdf => pdf.id !== id)
    setPdfs(newPdfs)
    localStorage.setItem("uploadedPdfs", JSON.stringify(newPdfs))
    
    // Remove PDF from folder structure
    const newStructure = { ...folderStructure }
    Object.keys(newStructure).forEach(folderId => {
      newStructure[folderId] = newStructure[folderId].filter(pdfId => pdfId !== id)
    })
    setFolderStructure(newStructure)
    localStorage.setItem("folderStructure", JSON.stringify(newStructure))
  }

  const handleDragStart = (pdfId: string) => {
    setDraggedPdfId(pdfId)
  }

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.currentTarget.style.backgroundColor = "#3f3f46"
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.style.backgroundColor = ""
  }

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.currentTarget.style.backgroundColor = ""
    
    if (!draggedPdfId) return

    // Remove PDF from previous folder if it exists
    const newStructure = { ...folderStructure }
    Object.keys(newStructure).forEach(key => {
      newStructure[key] = newStructure[key].filter(id => id !== draggedPdfId)
    })

    // Add PDF to new folder
    newStructure[folderId] = [...(newStructure[folderId] || []), draggedPdfId]
    setFolderStructure(newStructure)
    localStorage.setItem("folderStructure", JSON.stringify(newStructure))
    setDraggedPdfId(null)
  }

  // Get PDFs that are not in any folder
  const getRootPdfs = () => {
    const allFolderPdfs = new Set(
      Object.values(folderStructure).flat()
    )
    return pdfs.filter(pdf => !allFolderPdfs.has(pdf.id))
  }

  // Get PDFs in a specific folder
  const getFolderPdfs = (folderId: string) => {
    const folderPdfIds = folderStructure[folderId] || []
    return pdfs.filter(pdf => folderPdfIds.includes(pdf.id))
  }

  return (
    <div className={cn("flex flex-col h-full bg-[#18181b] text-white w-60 min-w-[180px]", className)}>
      {/* 顶部标题 */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-600 text-white font-bold">
          P
        </div>
        <h1 className="text-xl font-semibold">maoge pdf</h1>
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
        {/* Root PDFs */}
        {getRootPdfs().map((pdf) => (
          <div
            key={pdf.id}
            draggable
            onDragStart={() => handleDragStart(pdf.id)}
            className="flex items-center justify-between p-2 mb-1 hover:bg-[#2a2a2a] rounded-md group cursor-move"
          >
            <Link
              href={`/analysis/${pdf.id}`}
              className="flex items-center flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-gray-300">{pdf.name}</span>
            </Link>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button 
                onClick={() => handleDeletePdf(pdf.id)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* 文件夹列表 */}
        {folders.map((folder) => (
          <div key={folder.id}>
            <div 
              className="flex items-center justify-between p-2 mb-1 hover:bg-[#2a2a2a] rounded-md group"
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
            >
              {editingFolderId === folder.id ? (
                <Input 
                  value={editFolderName} 
                  onChange={e => setEditFolderName(e.target.value)}
                  onBlur={() => handleRenameFolder(folder.id)}
                  onKeyDown={e => e.key === 'Enter' && handleRenameFolder(folder.id)}
                  className="h-8 text-sm bg-gray-800 border-gray-700"
                  autoFocus
                />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <FolderIcon size={16} className="text-gray-400" />
                    <span>{folder.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => {
                        setEditingFolderId(folder.id)
                        setEditFolderName(folder.name)
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
            {/* Folder PDFs */}
            <div className="ml-4">
              {getFolderPdfs(folder.id).map((pdf) => (
                <div
                  key={pdf.id}
                  draggable
                  onDragStart={() => handleDragStart(pdf.id)}
                  className="flex items-center justify-between p-2 mb-1 hover:bg-[#2a2a2a] rounded-md group cursor-move"
                >
                  <Link
                    href={`/analysis/${pdf.id}`}
                    className="flex items-center flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-gray-300">{pdf.name}</span>
                  </Link>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => handleDeletePdf(pdf.id)}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 创建文件夹模态框 */}
      <Dialog open={showFolderModal} onOpenChange={setShowFolderModal}>
        <DialogContent className="sm:max-w-md bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold mb-4">新建文件夹</h2>
          <Input
            placeholder="输入文件夹名称"
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            className="bg-gray-100 border-gray-300 text-gray-900 mb-4 focus:ring-2 focus:ring-purple-200"
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFolderModal(false)}
              className="border-gray-300 hover:bg-gray-100 text-gray-700"
            >
              取消
            </Button>
            <Button 
              onClick={handleCreateFolder}
              className="bg-purple-500 hover:bg-purple-600 text-white shadow"
            >
              创建
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
