import React from 'react';
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Wand2, RefreshCw, FileText } from "lucide-react";

interface TextSelectionToolbarProps {
  position: { x: number; y: number } | null;
  onExplain: () => void;
  onRewrite: () => void;
  onSummarize: () => void;
  isLoading?: boolean;
}

export default function TextSelectionToolbar({
  position,
  onExplain,
  onRewrite,
  onSummarize,
  isLoading = false
}: TextSelectionToolbarProps) {
  const t = useTranslations('textSelectionToolbar');
  
  if (!position) return null;

  return (
    <div
      className="text-selection-toolbar fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex gap-1"
      style={{
        left: `${Math.max(10, Math.min(position.x - 100, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 220))}px`,
        top: `${Math.max(10, position.y - 60)}px`,
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onExplain}
              disabled={isLoading}
              className="hover:bg-blue-50 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              ) : (
                <Wand2 className="h-4 w-4 mr-1" />
              )}
              {t('explain')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('explainTooltip')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRewrite}
              disabled={isLoading}
              className="hover:bg-green-50 dark:hover:bg-green-900 text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              {t('rewrite')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('rewriteTooltip')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSummarize}
              disabled={isLoading}
              className="hover:bg-purple-50 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              ) : (
                <FileText className="h-4 w-4 mr-1" />
              )}
              {t('summarize')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('summarizeTooltip')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
} 