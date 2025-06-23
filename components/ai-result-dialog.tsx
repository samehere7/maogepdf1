import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useTranslations } from 'next-intl';

interface AIResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string | null;
  isLoading: boolean;
}

export default function AIResultDialog({
  isOpen,
  onClose,
  title,
  content,
  isLoading
}: AIResultDialogProps) {
  const t = useTranslations('aiResultDialog');
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">{t('processing')}</span>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              {content ? (
                <div dangerouslySetInnerHTML={{ 
                  __html: content.replace(/\n/g, '<br />') 
                }} />
              ) : (
                <p className="text-red-500">{t('processingError')}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 