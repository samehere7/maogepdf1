"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, MessageCircle, Lightbulb, Settings, Rocket, Scale, FileText } from "lucide-react";
import { useTranslations } from 'next-intl';

interface GeneratedQuestion {
  id: string;
  text: string;
  icon: string;
  category: 'summary' | 'concept' | 'process' | 'comparison' | 'application';
}

interface WelcomeQuestionsProps {
  pdfName: string;
  questions: GeneratedQuestion[];
  onQuestionClick: (question: string) => void;
  onClose?: () => void;
}

export function WelcomeQuestions({ 
  pdfName, 
  questions, 
  onQuestionClick, 
  onClose 
}: WelcomeQuestionsProps) {
  const t = useTranslations('welcome');
  const [isVisible, setIsVisible] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // 延迟显示动画，确保组件已挂载
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleQuestionClick = (questionKey: string) => {
    // 获取翻译后的文本
    const translatedText = t(questionKey);
    onQuestionClick(translatedText);
    // 点击问题后隐藏欢迎界面
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const getIconComponent = (category: GeneratedQuestion['category']) => {
    const iconMap = {
      summary: FileText,
      concept: Lightbulb,
      process: Settings,
      comparison: Scale,
      application: Rocket
    };
    
    const IconComponent = iconMap[category] || MessageCircle;
    return <IconComponent className="w-4 h-4" />;
  };

  const getButtonStyle = (category: GeneratedQuestion['category']) => {
    const styleMap = {
      summary: "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 text-blue-700",
      concept: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200 hover:border-yellow-300 text-yellow-700",
      process: "bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-300 text-purple-700",
      comparison: "bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300 text-green-700",
      application: "bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-300 text-orange-700"
    };
    
    return styleMap[category] || "bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300 text-gray-700";
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`
      welcome-questions-container 
      transition-all duration-500 ease-out
      ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      {/* 欢迎消息 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t('welcomeTitle')}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('welcomeAnalyzed', { fileName: pdfName })}
            </p>
          </div>
        </div>
      </div>

      {/* 推荐问题按钮 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-gray-500" />
          {t('smartRecommendations')}
        </h4>
        
        <TooltipProvider>
          <div className="grid gap-3">
            {questions.map((question, index) => (
              <Tooltip key={question.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={`
                      w-full text-left p-4 h-auto justify-start
                      transition-all duration-200 
                      hover:scale-[1.02] hover:shadow-md
                      ${getButtonStyle(question.category)}
                      animate-fade-in-up
                    `}
                    style={{
                      animationDelay: `${index * 150}ms`,
                      animationFillMode: 'both'
                    }}
                    onClick={() => handleQuestionClick(question.text)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <span className="text-lg">{question.icon}</span>
                        {getIconComponent(question.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-relaxed">
                          {t(question.text)}
                        </p>
                      </div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">
                    {t('clickToAsk')}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>

      {/* 提示信息 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          {t('freeAskTip')}
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

// 简化版欢迎组件，用于加载状态
export function WelcomeQuestionsLoading({ pdfName }: { pdfName: string }) {
  const t = useTranslations('welcome');
  return (
    <div className="welcome-questions-loading">
      {/* 欢迎消息 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t('welcomeTitle')}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('analyzingPdf', { fileName: pdfName })}
            </p>
          </div>
        </div>
      </div>

      {/* 加载中的问题按钮骨架 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-gray-500" />
          {t('generatingQuestions')}
        </h4>
        
        <div className="grid gap-3">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 提示信息 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          {t('afterGenerationTip')}
        </p>
      </div>
    </div>
  );
}