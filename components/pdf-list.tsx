import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getUserPDFs, deletePDF } from '@/lib/pdf-service';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FileText, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations();

  useEffect(() => {
    async function loadPDFs() {
      if (!session?.user?.email) return;
      
      try {
        setIsLoading(true);
        const userPdfs = await getUserPDFs(session.user.email);
        setPdfs(userPdfs);
      } catch (error) {
        console.error(t('pdf.loadPdfListFailed'), error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPDFs();
  }, [session]);

  const handleDelete = async (pdfId: string) => {
    if (!session?.user?.email) return;
    
    if (confirm(t('pdf.deleteConfirm'))) {
      try {
        await deletePDF(pdfId, session.user.email);
        setPdfs(pdfs.filter(pdf => pdf.id !== pdfId));
      } catch (error) {
        console.error(t('pdf.deleteError'), error);
        alert(t('pdf.deleteFailed'));
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
        {t('pdf.noUploaded')}
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
                {t('pdf.uploadedOn')} {new Date(pdf.uploadDate).toLocaleString()}
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