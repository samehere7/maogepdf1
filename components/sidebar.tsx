"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, FolderIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import SidebarSignIn from "@/components/SidebarSignIn"
import { LanguageSelector } from "@/components/language-selector"
import { createClient } from "@/lib/supabase/client"
import SidebarUserInfo from "@/components/SidebarUserInfo"

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
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [folderStructure, setFolderStructure] = useState<{[key: string]: string[]}>({})
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingPdf, setDeletingPdf] = useState<{id: string, name: string} | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const dragElementRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    // 如果用户已登录，从API获取PDF列表
    if (isLoggedIn) {
      loadPDFsFromAPI()
    }
    
    // 加载本地文件夹数据（这些可以继续使用localStorage，因为它们是组织结构）
    setFolders(JSON.parse(localStorage.getItem("uploadedFolders") || "[]"))
    setFolderStructure(JSON.parse(localStorage.getItem("folderStructure") || "{}"))
    
    // 监听PDF重命名事件
    const handlePdfRename = (event: CustomEvent) => {
      const { id, newName } = event.detail;
      setPdfs(prev => prev.map(pdf => 
        pdf.id === id ? { ...pdf, name: newName } : pdf
      ));
    };
    
    window.addEventListener('pdf-renamed', handlePdfRename as EventListener);
    
    return () => {
      window.removeEventListener('pdf-renamed', handlePdfRename as EventListener);
    };
  }, [isLoggedIn])

  // 从API加载PDF列表
  const loadPDFsFromAPI = async () => {
    try {
      console.log('[Sidebar] 从API加载PDF列表...')
      const response = await fetch('/api/pdfs')
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Sidebar] 加载到PDF数量:', data.pdfs.length)
        setPdfs(data.pdfs || [])
      } else {
        console.error('[Sidebar] 加载PDF列表失败:', response.status)
      }
    } catch (error) {
      console.error('[Sidebar] 加载PDF列表出错:', error)
    }
  }

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!file.type.includes("pdf")) {
        alert("只允许上传PDF文件")
        return
      }

      try {
        // 使用API上传
        const formData = new FormData()
        formData.append('file', file)
        formData.append('quality', 'high')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          console.log('[Sidebar] 上传成功:', result)
          
          // 重新加载PDF列表
          await loadPDFsFromAPI()
          
          // 跳转到分析页面
          router.push(`/analysis/${result.pdf.id}`)
        } else {
          const error = await response.json()
          alert(`上传失败: ${error.error || '未知错误'}`)
        }
      } catch (error) {
        console.error('[Sidebar] 上传失败:', error)
        alert('上传失败，请重试')
      }
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
    // 找到PDF名称用于更友好的确认提示
    const pdfToDelete = pdfs.find(pdf => pdf.id === id);
    const pdfName = pdfToDelete?.name || 'PDF文件';
    
    setDeletingPdf({ id, name: pdfName });
    setShowDeleteModal(true);
  }

  const confirmDeletePdf = async () => {
    if (!deletingPdf) return;

    try {
      const response = await fetch(`/api/pdfs/${deletingPdf.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        console.log('[Sidebar] PDF删除成功')
        
        // 重新加载PDF列表
        await loadPDFsFromAPI()
        
        // Remove PDF from folder structure
        const newStructure = { ...folderStructure }
        Object.keys(newStructure).forEach(folderId => {
          newStructure[folderId] = newStructure[folderId].filter(pdfId => pdfId !== deletingPdf.id)
        })
        setFolderStructure(newStructure)
        localStorage.setItem("folderStructure", JSON.stringify(newStructure))
      } else {
        const error = await response.json()
        alert(`删除失败: ${error.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('[Sidebar] 删除PDF失败:', error)
      alert('删除失败，请重试')
    } finally {
      setShowDeleteModal(false)
      setDeletingPdf(null)
    }
  }

  const handleDragStart = (e: React.DragEvent, pdfId: string) => {
    e.stopPropagation()
    setDraggedPdfId(pdfId)
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', pdfId)
    e.dataTransfer.effectAllowed = 'move'
    
    // 设置拖拽时的视觉反馈
    const element = e.currentTarget as HTMLElement
    element.style.opacity = '0.5'
    
    // 创建自定义拖拽图像
    const dragImage = element.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '0.7'
    dragImage.style.position = 'absolute'
    dragImage.style.left = '-9999px'
    // 移除任何边框样式
    dragImage.style.border = 'none'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation()
    setDraggedPdfId(null)
    setDragOverFolderId(null)
    setIsDragging(false)
    setMousePosition(null)
    // 确保元素的样式被重置
    const element = e.target as HTMLElement
    element.style.opacity = '1'
    element.style.transform = ''
  }

  // 长按开始处理
  const handlePdfMouseDown = (e: React.MouseEvent, pdfId: string, element: HTMLDivElement) => {
    // 记录鼠标位置
    setMousePosition({ x: e.clientX, y: e.clientY })
    dragElementRef.current = element
    
    // 清除之前的定时器
    if (longPressTimer) {
      clearTimeout(longPressTimer)
    }
    
    // 设置新的定时器，长按500ms后触发拖拽模式
    const timer = setTimeout(() => {
      // 直接开始拖拽，不设置draggedPdfId
      setIsDragging(true)
      
      // 创建并触发自定义拖拽事件
      if (dragElementRef.current && mousePosition) {
        const dragEvent = new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          clientX: mousePosition.x,
          clientY: mousePosition.y
        })
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            setData: () => {},
            effectAllowed: 'move',
            setDragImage: () => {}
          }
        })
        dragElementRef.current.dispatchEvent(dragEvent)
      }
    }, 500)
    
    setLongPressTimer(timer)
  }
  
  // 鼠标抬起，取消长按
  const handlePdfMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setMousePosition(null)
    dragElementRef.current = null
  }
  
  // 鼠标离开，取消长按
  const handlePdfMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setMousePosition(null)
    dragElementRef.current = null
  }
  
  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedPdfId) {
      e.dataTransfer.dropEffect = 'move'
      setDragOverFolderId(folderId)
    }
  }

  const handleDragLeave = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 使用相关目标检查是否真的离开了文件夹区域
    const currentTarget = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement
    
    // 如果相关目标不是当前目标或其子元素，则清除高亮
    if (!currentTarget.contains(relatedTarget) && currentTarget !== relatedTarget) {
      setDragOverFolderId(null)
    }
  }

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const pdfId = e.dataTransfer.getData('text/plain')
    if (!pdfId) {
      console.log('没有找到PDF ID')
      return
    }

    console.log(`移动PDF ${pdfId} 到文件夹 ${folderId}`)

    // 从之前的文件夹中移除PDF
    const newStructure = { ...folderStructure }
    Object.keys(newStructure).forEach(key => {
      newStructure[key] = newStructure[key].filter(id => id !== pdfId)
    })
    
    // 添加PDF到新文件夹
    if (!newStructure[folderId]) {
      newStructure[folderId] = []
    }
    if (!newStructure[folderId].includes(pdfId)) {
      newStructure[folderId] = [...newStructure[folderId], pdfId]
    }
    
    setFolderStructure(newStructure)
    localStorage.setItem("folderStructure", JSON.stringify(newStructure))
    
    // 重置所有拖拽相关状态
    setDraggedPdfId(null)
    setDragOverFolderId(null)
    setIsDragging(false)
    setMousePosition(null)
    
    console.log('新的文件夹结构:', newStructure)
  }

  const handlePdfClick = (e: React.MouseEvent, pdfId: string) => {
    // 如果鼠标移动了很小的距离，我们认为这是点击而不是拖拽
    const hasMouseMoved = mousePosition && (
      Math.abs(e.clientX - mousePosition.x) > 5 ||
      Math.abs(e.clientY - mousePosition.y) > 5
    )
    
    if (isDragging || hasMouseMoved) {
      e.preventDefault()
      return
    }
    
    // 确保重置所有状态
    setIsDragging(false)
    setMousePosition(null)
    setDraggedPdfId(null)
    
    router.push(`/analysis/${pdfId}`)
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
    <div className={cn("flex flex-col h-screen bg-[#18181b] text-white w-60 min-w-[180px]", className)}>
      {/* 顶部标题 */}
      <div 
        className="flex items-center gap-2 p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => router.push('/')}
      >
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
          onClick={() => {
            if (!isLoggedIn) {
              setShowLoginModal(true)
            } else {
              setShowFolderModal(true)
            }
          }}
          className="w-full py-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] rounded-md text-center transition"
        >
          新建文件夹
        </button>
      </div>

      {/* 拖拽提示 */}
      {draggedPdfId && !isDragging && (
        <div className="mx-3 mb-2 p-2 bg-purple-900/50 border border-purple-400 rounded-md text-sm text-purple-200 text-center">
          📁 拖拽到文件夹进行整理
        </div>
      )}

      {/* PDF 文件列表 */}
      {isLoggedIn && (
        <div className="flex-1 min-h-0 overflow-auto p-3">
          {/* 当没有PDF和文件夹时显示拖拽提示 */}
          {pdfs.length === 0 && folders.length === 0 && (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center text-gray-500 text-sm">
              将 PDF 文件拖放到这里
            </div>
          )}

          {/* Root PDFs */}
          <div 
            className="space-y-2"
            onDragOver={(e) => {
              if (draggedPdfId) {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }
            }}
            onDrop={(e) => {
              if (draggedPdfId) {
                e.preventDefault()
                e.stopPropagation()
                
                // 从所有文件夹中移除该PDF
                const newStructure = { ...folderStructure }
                Object.keys(newStructure).forEach(key => {
                  newStructure[key] = newStructure[key].filter(id => id !== draggedPdfId)
                })
                
                setFolderStructure(newStructure)
                localStorage.setItem("folderStructure", JSON.stringify(newStructure))
                setDraggedPdfId(null)
                setDragOverFolderId(null)
              }
            }}
          >
            {getRootPdfs().map((pdf) => (
              <div
                key={pdf.id}
                ref={(el) => {
                  if (el) dragElementRef.current = el
                }}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, pdf.id)}
                onDragEnd={handleDragEnd}
                onMouseDown={(e) => handlePdfMouseDown(e, pdf.id, e.currentTarget as HTMLDivElement)}
                onMouseUp={handlePdfMouseUp}
                onMouseLeave={handlePdfMouseLeave}
                onClick={(e) => handlePdfClick(e, pdf.id)}
                className={cn(
                  "flex items-center justify-between p-2 hover:bg-[#2a2a2a] rounded-md group transition-all duration-200",
                  draggedPdfId === pdf.id && isDragging && "opacity-50 scale-95 bg-[#2a2a2a]"
                )}
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab',
                  touchAction: 'none'
                }}
              >
                <div className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-300 truncate">{pdf.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePdf(pdf.id);
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {/* 文件夹列表 */}
            {folders.map((folder) => (
              <div 
                key={folder.id}
                className={cn(
                  "rounded-md mb-2 transition-all duration-200",
                  dragOverFolderId === folder.id && draggedPdfId && 
                  "border-2 border-dashed border-purple-500 bg-gray-800/20 shadow-lg"
                )}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={(e) => handleDragLeave(e, folder.id)}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                {/* 文件夹标题 */}
                <div 
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md group transition-all duration-200 relative",
                    !draggedPdfId && "hover:bg-[#2a2a2a]",
                    dragOverFolderId === folder.id && draggedPdfId && "bg-gray-800/40"
                  )}
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
                        <FolderIcon 
                          size={16} 
                          className={cn(
                            "text-gray-400 transition-colors",
                            dragOverFolderId === folder.id && draggedPdfId && "text-gray-300"
                          )} 
                        />
                        <span className={cn(
                          "transition-colors",
                          dragOverFolderId === folder.id && draggedPdfId && "text-gray-300"
                        )}>
                          {folder.name}
                        </span>
                        {dragOverFolderId === folder.id && draggedPdfId && (
                          <span className="text-xs text-gray-400 ml-auto">放置到这里</span>
                        )}
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

                {/* 文件夹内容 */}
                <div 
                  className="ml-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {getFolderPdfs(folder.id).length === 0 ? (
                    <div className={cn(
                      "p-3 mb-2 text-center text-sm rounded-md transition-all duration-200",
                      draggedPdfId && dragOverFolderId !== folder.id && "border-2 border-dashed border-gray-600 bg-gray-800/50 text-gray-400",
                      draggedPdfId && dragOverFolderId === folder.id && "hidden",
                      !draggedPdfId && "text-gray-500"
                    )}>
                      {draggedPdfId ? (
                        <span className="text-gray-400">将 PDF 文件拖放到这里</span>
                      ) : (
                        <span>将 PDF 文件拖放到这里</span>
                      )}
                    </div>
                  ) : (
                    getFolderPdfs(folder.id).map((pdf) => (
                      <div
                        key={pdf.id}
                        ref={(el) => {
                          if (el) dragElementRef.current = el
                        }}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, pdf.id)}
                        onDragEnd={handleDragEnd}
                        onMouseDown={(e) => handlePdfMouseDown(e, pdf.id, e.currentTarget as HTMLDivElement)}
                        onMouseUp={handlePdfMouseUp}
                        onMouseLeave={handlePdfMouseLeave}
                        onClick={(e) => handlePdfClick(e, pdf.id)}
                        className={cn(
                          "flex items-center justify-between p-2 mb-1 hover:bg-[#2a2a2a] rounded-md group transition-all duration-200",
                          draggedPdfId === pdf.id && isDragging && "opacity-50 scale-95 bg-[#2a2a2a]"
                        )}
                        style={{
                          cursor: isDragging ? 'grabbing' : 'grab',
                          touchAction: 'none'
                        }}
                      >
                        <div className="flex items-center flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                            </div>
                            <span className="text-gray-300 truncate">{pdf.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePdf(pdf.id);
                            }}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* 登录弹窗 */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold mb-4">请先登录</h2>
          <p className="mb-4 text-gray-700">登录后才能新建文件夹和管理PDF。</p>
          <SidebarSignIn />
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-600">删除PDF文件</DialogTitle>
            <DialogDescription className="text-gray-700 mt-2">
              确定要删除「{deletingPdf?.name}」吗？
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              ⚠️ 删除后将无法恢复该PDF文件及其相关的聊天记录。
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteModal(false)}
              className="border-gray-300 hover:bg-gray-100 text-gray-700"
            >
              取消
            </Button>
            <Button 
              onClick={confirmDeletePdf}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 侧边栏最底部：登录+语言选择器 */}
      <div className="mt-auto">
        {isLoggedIn ? (
          <SidebarUserInfo />
        ) : (
          <div className="flex flex-col items-center gap-4 pb-6">
            <SidebarSignIn />
            <LanguageSelector />
          </div>
        )}
      </div>
    </div>
  )
}
