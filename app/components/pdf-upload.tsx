import { useState } from 'react';
import { Upload } from 'lucide-react';

interface PDFUploadProps {
  onFileUpload: (file: { id: string; name: string; path: string; folderId: string }) => void;
}

export function PDFUpload({ onFileUpload }: PDFUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const id = Date.now().toString();
      onFileUpload({
        id,
        name: file.name,
        path: URL.createObjectURL(file),
        folderId: 'default'
      });
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-[#27272a] border-gray-600 hover:bg-[#3f3f46]">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-4 text-gray-400" />
          <p className="mb-2 text-sm text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">PDF files only</p>
        </div>
        <input
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
} 