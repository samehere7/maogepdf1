import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { uploadPDF } from '@/lib/pdf-service';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.email) return;

    try {
      setIsUploading(true);
      
      // Upload PDF file
      const pdf = await uploadPDF(file, session.user.email);
      
      // Redirect to analysis page after successful upload
      if (pdf?.id) {
        router.push(`/analysis/${pdf.id}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(t('upload.uploadFailedRetry'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        id="pdf-upload"
      />
      <label htmlFor="pdf-upload">
        <Button
          disabled={isUploading || !session}
          className="relative"
        >
          {isUploading ? (
            <>
              <span className="animate-pulse">{t('upload.uploading')}</span>
              <div className="absolute inset-0 bg-white/20 rounded-lg" />
            </>
          ) : (
            t('upload.uploadPdf')
          )}
        </Button>
      </label>
    </div>
  );
} 