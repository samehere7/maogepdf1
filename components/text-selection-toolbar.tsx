import React from 'react';
import { Button } from "@/components/ui/button";
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
  if (!position) return null;

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-2"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(0, 10px)',
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
              className="hover:bg-blue-50 dark:hover:bg-blue-900"
            >
              <Wand2 className="h-4 w-4 mr-1" />
              解释
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>对选中文本进行解释</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRewrite}
              disabled={isLoading}
              className="hover:bg-green-50 dark:hover:bg-green-900"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              改写
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>用不同方式改写选中文本</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSummarize}
              disabled={isLoading}
              className="hover:bg-purple-50 dark:hover:bg-purple-900"
            >
              <FileText className="h-4 w-4 mr-1" />
              总结
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>总结选中文本的要点</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
} 