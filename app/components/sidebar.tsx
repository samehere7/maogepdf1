import { useState } from 'react';
import { FileText, Folder, Pencil, Trash2 } from 'lucide-react';

interface PDFFile {
  id: string;
  name: string;
  path: string;
  folderId?: string;
}

interface Folder {
  id: string;
  name: string;
}

interface SidebarProps {
  files: PDFFile[];
  onFilesChange: (files: PDFFile[]) => void;
}

export function Sidebar({ files, onFilesChange }: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'default', name: '默认文件夹' }
  ]);

  const handleRename = (id: string) => {
    setEditingId(id);
    const file = files.find(f => f.id === id);
    if (file) setNewName(file.name);
  };

  const handleDelete = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
  };

  const handleSaveRename = (id: string) => {
    onFilesChange(files.map(f => 
      f.id === id ? { ...f, name: newName } : f
    ));
    setEditingId(null);
  };

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData('fileId', fileId);
  };

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData('fileId');
    onFilesChange(files.map(f => 
      f.id === fileId ? { ...f, folderId } : f
    ));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-[300px] bg-[#18181b] flex flex-col px-4 pt-4 pb-2 z-30">
      <div className="mb-8">
        <h2 className="text-white text-lg font-semibold mb-4">PDF Files</h2>
        {folders.map(folder => (
          <div key={folder.id} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-gray-400" />
              <span className="text-white">{folder.name}</span>
            </div>
            <div 
              className="space-y-2"
              onDrop={(e) => handleDrop(e, folder.id)}
              onDragOver={handleDragOver}
            >
              {files
                .filter(f => f.folderId === folder.id)
                .map(file => (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, file.id)}
                    className="flex items-center justify-between p-2 bg-[#27272a] rounded-lg cursor-move"
                  >
                    {editingId === file.id ? (
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={() => handleSaveRename(file.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(file.id)}
                        className="bg-[#3f3f46] text-white px-2 py-1 rounded"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{file.name}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRename(file.id)}
                        className="p-1 hover:bg-[#3f3f46] rounded"
                      >
                        <Pencil className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1 hover:bg-[#3f3f46] rounded"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
} 