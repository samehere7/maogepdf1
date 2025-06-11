import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getUserPDFs, deletePDF } from '@/lib/pdf-service';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FileText, Trash2 } from 'lucide-react';

interface PDF {
  id: string;
  name: string;
  url: string;
  uploadDate: Date;
  lastViewed: Date;
}

export function PDFList() {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    async function loadPDFs() {
      if (!session?.user?.email) return;
      
      try {
        setIsLoading(true);
        const userPdfs = await getUserPDFs(session.user.email);
        setPdfs(userPdfs);
      } catch (error) {
        console.error('加载PDF列表失败:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPDFs();
  }, [session]);

  const handleDelete = async (pdfId: string) => {
    if (!session?.user?.email) return;
    
    if (confirm('确定要删除这个PDF吗？')) {
      try {
        await deletePDF(pdfId, session.user.email);
        setPdfs(pdfs.filter(pdf => pdf.id !== pdfId));
      } catch (error) {
        console.error('删除PDF失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (pdfs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        还没有上传过PDF文件
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pdfs.map((pdf) => (
        <div
          key={pdf.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push(`/analysis/${pdf.id}`)}
          >
            <FileText className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="font-medium">{pdf.name}</h3>
              <p className="text-sm text-gray-500">
                上传于 {new Date(pdf.uploadDate).toLocaleString()}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700"
            onClick={() => handleDelete(pdf.id)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      ))}
    </div>
  );
} 