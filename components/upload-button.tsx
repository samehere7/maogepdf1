import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { uploadPDF } from '@/lib/pdf-service';
import { useRouter } from 'next/navigation';

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.email) return;

    try {
      setIsUploading(true);
      
      // 上传PDF文件
      const pdf = await uploadPDF(file, session.user.email);
      
      // 上传成功后跳转到分析页面
      if (pdf?.id) {
        router.push(`/analysis/${pdf.id}`);
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('文件上传失败，请重试');
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
              <span className="animate-pulse">上传中...</span>
              <div className="absolute inset-0 bg-white/20 rounded-lg" />
            </>
          ) : (
            '上传PDF'
          )}
        </Button>
      </label>
    </div>
  );
} 