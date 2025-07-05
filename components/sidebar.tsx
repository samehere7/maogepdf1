"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Pencil, Trash2, FolderIcon, Share, Brain } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import SidebarSignIn from "@/components/SidebarSignIn"
import { LanguageSelector } from "@/components/language-selector"
import { supabase } from "@/lib/supabase/client"
import SidebarUserInfo from "@/components/SidebarUserInfo"
import ShareChatModal from "@/components/share-chat-modal"
import { useUser } from "@/components/UserProvider"
import { useTranslations } from 'next-intl'

interface SidebarProps {
  className?: string
  pdfFlashcardCounts?: {[pdfId: string]: number}
  onFlashcardClick?: (pdfId: string, pdfName: string) => void
}

export function Sidebar({ className, pdfFlashcardCounts = {}, onFlashcardClick }: SidebarProps) {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('pdf')
  const tc = useTranslations('common')
  const tu = useTranslations('upload')
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderName, setFolderName] = useState("")
  
  // 初始化文件夹名称
  useEffect(() => {
    setFolderName(t('myFolder'))
  }, [t])
  const [folders, setFolders] = useState<any[]>([])
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState("")
  const [pdfs, setPdfs] = useState<any[]>([])
  const [draggedPdfId, setDraggedPdfId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [folderStructure, setFolderStructure] = useState<{[key: string]: string[]}>({})
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingPdf, setDeletingPdf] = useState<{id: string, name: string} | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const dragElementRef = useRef<HTMLDivElement | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharePdfId, setSharePdfId] = useState<string>('')
  const [sharePdfName, setSharePdfName] = useState<string>('')
  const [pdfFlashcards, setPdfFlashcards] = useState<{[pdfId: string]: number}>({}) // 存储每个PDF的闪卡数量
  
  // 更新PDF闪卡计数 - 避免无限循环
  useEffect(() => {
    // 只有当计数真正发生变化时才更新
    const hasChanged = Object.keys(pdfFlashcardCounts).some(
      key => pdfFlashcards[key] !== pdfFlashcardCounts[key]
    ) || Object.keys(pdfFlashcards).length !== Object.keys(pdfFlashcardCounts).length;
    
    if (hasChanged) {
      setPdfFlashcards(pdfFlashcardCounts);
    }
  }, [pdfFlashcardCounts, pdfFlashcards])
  const { profile } = useUser()
  const isLoggedIn = !!profile

  // 安全的localStorage操作辅助函数
  const safeLocalStorage = {
    getItem: (key: string, defaultValue: string = '') => {
      if (typeof window === 'undefined') return defaultValue
      return localStorage.getItem(key) || defaultValue
    },
    setItem: (key: string, value: string) => {
      if (typeof window === 'undefined') return
      localStorage.setItem(key, value)
    },
    removeItem: (key: string) => {
      if (typeof window === 'undefined') return
      localStorage.removeItem(key)
    }
  }

  useEffect(() => {
    // 确保在客户端环境中运行
    if (typeof window === 'undefined') return
    
    // 如果用户已登录，从API获取PDF列表
    if (isLoggedIn) {
      loadPDFsFromAPI()
    }
    
    // 加载本地文件夹数据（这些可以继续使用localStorage，因为它们是组织结构）
    setFolders(JSON.parse(safeLocalStorage.getItem("uploadedFolders", "[]")))
    setFolderStructure(JSON.parse(safeLocalStorage.getItem("folderStructure", "{}")))
    
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
      console.log('[Sidebar] Loading PDF list from API...')
      
      // 获取用户 session 以获取 access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('[Sidebar] No access token available');
        return;
      }
      
      const response = await fetch('/api/pdfs', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Sidebar] Loaded PDFs count:', data.pdfs.length)
        setPdfs(data.pdfs || [])
      } else {
        console.error('[Sidebar] ' + t('loadPdfListFailed') + ':', response.status)
      }
    } catch (error) {
      console.error('[Sidebar] Error loading PDF list:', error)
    }
  }

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!file.type.includes("pdf")) {
        alert(t('onlyPdfAllowed'))
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
          console.log('[Sidebar] Upload successful:', result)
          
          // 重新加载PDF列表
          await loadPDFsFromAPI()
          
          // 跳转到分析页面
          router.push(`/${locale}/analysis/${result.pdf.id}`)
        } else {
          const error = await response.json()
          alert(`${t('uploadError')}: ${error.error || tc('error')}`)
        }
      } catch (error) {
        console.error('[Sidebar] Upload failed:', error)
        alert(t('uploadFailedRetry'))
      }
    }
  }

  const handleCreateFolder = () => {
    if (!folderName.trim()) return
    const newFolder = { id: Date.now().toString(), name: folderName.trim() }
    const newFolders = [...folders, newFolder]
    setFolders(newFolders)
    safeLocalStorage.setItem("uploadedFolders", JSON.stringify(newFolders))
    
    // Initialize empty folder in structure
    const newStructure = { ...folderStructure, [newFolder.id]: [] }
    setFolderStructure(newStructure)
    safeLocalStorage.setItem("folderStructure", JSON.stringify(newStructure))
    
    setShowFolderModal(false)
    setFolderName(t('myFolder'))
  }

  const handleRenameFolder = (id: string) => {
    if (!editFolderName.trim()) return
    const newFolders = folders.map(f => f.id === id ? { ...f, name: editFolderName.trim() } : f)
    setFolders(newFolders)
    safeLocalStorage.setItem("uploadedFolders", JSON.stringify(newFolders))
    setEditingFolderId(null)
    setEditFolderName("")
  }

  const handleDeleteFolder = (id: string) => {
    const newFolders = folders.filter(f => f.id !== id)
    setFolders(newFolders)
    safeLocalStorage.setItem("uploadedFolders", JSON.stringify(newFolders))
    
    // Remove folder from structure and move PDFs back to root
    const { [id]: removedPdfs, ...newStructure } = folderStructure
    setFolderStructure(newStructure)
    safeLocalStorage.setItem("folderStructure", JSON.stringify(newStructure))
  }

  const handleDeletePdf = (id: string) => {
    // 找到PDF名称用于更友好的确认提示
    const pdfToDelete = pdfs.find(pdf => pdf.id === id);
    const pdfName = pdfToDelete?.name || t('pdfFile');
    
    setDeletingPdf({ id, name: pdfName });
    setShowDeleteModal(true);
  }

  // 删除闪卡功能
  const handleDeleteFlashcards = (pdfId: string) => {
    const pdfToDelete = pdfs.find(pdf => pdf.id === pdfId);
    const pdfName = pdfToDelete?.name || t('pdfFile');
    const flashcardCount = pdfFlashcards[pdfId] || 0;
    
    if (confirm(t('deleteFlashcardsConfirm', { name: pdfName, count: flashcardCount }))) {
      try {
        // 从本地存储删除闪卡数据
        const storageKey = `flashcards_${pdfId}`;
        safeLocalStorage.removeItem(storageKey);
        console.log('[Sidebar] 闪卡已从本地存储删除:', storageKey);
        
        // 更新状态，移除该PDF的闪卡计数
        setPdfFlashcards(prev => {
          const newCounts = { ...prev };
          delete newCounts[pdfId];
          return newCounts;
        });
        
        // 触发存储事件，通知其他页面更新
        window.dispatchEvent(new StorageEvent('storage', {
          key: storageKey,
          newValue: null,
          storageArea: localStorage
        }));
        
        console.log('[Sidebar] 闪卡删除成功');
      } catch (error) {
        console.error('[Sidebar] 删除闪卡失败:', error);
        alert(t('deleteFlashcardsFailed'));
      }
    }
  }

  const confirmDeletePdf = async () => {
    if (!deletingPdf) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/pdfs/${deletingPdf.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const deleteResult = await response.json();
        console.log('[Sidebar] PDF deleted successfully, result:', deleteResult)
        
        // 发送删除事件，通知父组件处理页面跳转
        window.dispatchEvent(new CustomEvent('pdf-deleted', { 
          detail: { 
            deletedId: deletingPdf.id, 
            nextPdfId: deleteResult.nextPdfId 
          } 
        }));
        
        // 重新加载PDF列表
        await loadPDFsFromAPI()
        
        // Remove PDF from folder structure
        const newStructure = { ...folderStructure }
        Object.keys(newStructure).forEach(folderId => {
          newStructure[folderId] = newStructure[folderId].filter(pdfId => pdfId !== deletingPdf.id)
        })
        setFolderStructure(newStructure)
        safeLocalStorage.setItem("folderStructure", JSON.stringify(newStructure))
      } else {
        const error = await response.json()
        alert(`${t('deleteFailed')}: ${error.error || tc('error')}`)
      }
    } catch (error) {
      console.error('[Sidebar] Delete PDF failed:', error)
      alert(t('deleteFailed'))
    } finally {
      setIsDeleting(false);
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
      console.log('PDF ID not found')
      return
    }

    console.log(`Moving PDF ${pdfId} to folder ${folderId}`)

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
    
    console.log('New folder structure:', newStructure)
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
    
    router.push(`/${locale}/analysis/${pdfId}`)
  }

  // 处理分享按钮点击
  const handleSharePdf = (e: React.MouseEvent, pdfId: string, pdfName: string) => {
    e.stopPropagation()
    setSharePdfId(pdfId)
    setSharePdfName(pdfName)
    setShowShareModal(true)
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
    <div className={cn("flex flex-col h-screen bg-[#18181b] text-white w-full", className)}>
      {/* 顶部标题 */}
      <div 
        className="flex items-center gap-2 p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => router.push(`/${locale}`)}
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
          {tu('uploadPdf')}
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
          {t('createFolder')}
        </button>
      </div>

      {/* 拖拽提示 */}
      {draggedPdfId && !isDragging && (
        <div className="mx-3 mb-2 p-2 bg-purple-900/50 border border-purple-400 rounded-md text-sm text-purple-200 text-center">
          📁 {t('dragToFolderToOrganize')}
        </div>
      )}

      {/* PDF 文件列表 */}
      {isLoggedIn && (
        <div className="flex-1 min-h-0 overflow-auto p-3">
          {/* 当没有PDF和文件夹时显示拖拽提示 */}
          {pdfs.length === 0 && folders.length === 0 && (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center text-gray-500 text-sm">
              {t('dragDropPdfHere')}
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
                safeLocalStorage.setItem("folderStructure", JSON.stringify(newStructure))
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
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleSharePdf(e, pdf.id, pdf.name)}
                    className="p-1 hover:bg-gray-700 rounded flex items-center justify-center"
                    title={t('sharePdf')}
                  >
                    <Share size={14} className="text-gray-400 hover:text-gray-300" />
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Add rename functionality
                        console.log('Rename PDF:', pdf.id);
                      }}
                      className="p-1 hover:bg-gray-700 rounded"
                      title={t('renamePdf')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePdf(pdf.id);
                      }}
                      className="p-1 hover:bg-gray-700 rounded"
                      title={tc('delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-gray-300 truncate" title={pdf.name}>
                      {pdf.name}
                    </span>
                    {pdfFlashcards[pdf.id] && (
                      <div className="flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded-full text-xs flex-shrink-0">
                        <Brain size={12} />
                        <span>{pdfFlashcards[pdf.id]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* 闪卡分组 */}
            {pdfs.some(pdf => pdfFlashcards[pdf.id] > 0) && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                  {t('flashcardCollection')}
                </h3>
                {pdfs
                  .filter(pdf => pdfFlashcards[pdf.id] > 0)
                  .map((pdf) => (
                    <div
                      key={`flashcard-${pdf.id}`}
                      className="group flex items-center justify-between p-2 rounded-md hover:bg-[#2a2a2a] transition-all duration-200"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => onFlashcardClick?.(pdf.id, pdf.name)}>
                        <Brain size={16} className="text-purple-400 flex-shrink-0" />
                        <span className="text-gray-300 truncate" title={`${pdf.name} ${t('flashcardCollection')}`}>
                          {pdf.name}
                        </span>
                        <div className="flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded-full text-xs flex-shrink-0">
                          <span>{pdfFlashcards[pdf.id]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFlashcards(pdf.id);
                          }}
                          className="p-1 hover:bg-gray-700 rounded"
                          title={t('deleteFlashcards')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

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
                          <span className="text-xs text-gray-400 ml-auto">{t('dropHere')}</span>
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
                        <span className="text-gray-400">{t('dragDropPdfHere')}</span>
                      ) : (
                        <span>{t('dragDropPdfHere')}</span>
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
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => handleSharePdf(e, pdf.id, pdf.name)}
                            className="p-1 hover:bg-gray-700 rounded flex items-center justify-center"
                            title={t('sharePdf')}
                          >
                            <Share size={14} className="text-gray-400 hover:text-gray-300" />
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Add rename functionality
                                console.log('Rename PDF:', pdf.id);
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title={t('renamePdf')}
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePdf(pdf.id);
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title={tc('delete')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-300 truncate" title={pdf.name}>
                              {pdf.name}
                            </span>
                            {pdfFlashcards[pdf.id] && (
                              <div className="flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded-full text-xs flex-shrink-0">
                                <Brain size={12} />
                                <span>{pdfFlashcards[pdf.id]}</span>
                              </div>
                            )}
                          </div>
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
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold mb-4">{t('createFolder')}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t('enterFolderName')}
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
              {tc('cancel')}
            </Button>
            <Button 
              onClick={handleCreateFolder}
              className="bg-purple-500 hover:bg-purple-600 text-white shadow"
            >
              {tc('create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 登录弹窗 */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold mb-4">{t('pleaseLogin')}</DialogTitle>
          </DialogHeader>
          <p className="mb-4 text-gray-700">{t('loginToManageFolders')}</p>
          <SidebarSignIn />
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-600">{tc('delete')} PDF</DialogTitle>
            <DialogDescription className="text-gray-700 mt-2">
              {t('deletePdfConfirm', { name: deletingPdf?.name || '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              ⚠️ {tc('deleteWarning')}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteModal(false)}
              className="border-gray-300 hover:bg-gray-100 text-gray-700"
              disabled={isDeleting}
            >
              {tc('cancel')}
            </Button>
            <Button 
              onClick={confirmDeletePdf}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {tc('loading')}
                </div>
              ) : (
                tc('delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分享PDF弹窗 */}
      {showShareModal && (
        <ShareChatModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          pdfId={sharePdfId}
          pdfName={sharePdfName}
        />
      )}

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
