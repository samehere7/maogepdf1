"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, AlertTriangle, RefreshCw, Bug, Zap, Database, Shield, FileText, MessageSquare } from 'lucide-react';

interface DebugStep {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  timestamp: string;
}

export default function DebugPage() {
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documentId, setDocumentId] = useState('debug-test-' + Date.now());
  const [testContent, setTestContent] = useState('调试测试消息');

  useEffect(() => {
    // 页面加载时自动运行系统检查
    runSystemCheck();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  const runSystemCheck = async () => {
    setIsLoading(true);
    setDebugSteps([]);
    
    try {
      const response = await fetch('/api/debug/chat-messages');
      const result = await response.json();
      setDebugSteps(result.debugSteps || []);
    } catch (error) {
      setDebugSteps([{
        step: 'network',
        status: 'error',
        message: '系统检查网络请求失败',
        data: { error: String(error) },
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const runChatTest = async () => {
    setIsLoading(true);
    setDebugSteps([]);
    
    try {
      const response = await fetch('/api/debug/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: documentId,
          content: testContent,
          isUser: true
        })
      });
      
      const result = await response.json();
      setDebugSteps(result.debugSteps || []);
    } catch (error) {
      setDebugSteps([{
        step: 'network',
        status: 'error',
        message: '聊天测试网络请求失败',
        data: { error: String(error) },
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const testPdfQA = async () => {
    setIsLoading(true);
    setDebugSteps([]);
    
    try {
      const response = await fetch('/api/debug/pdf-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfId: documentId,
          question: testContent,
          mode: 'fast'
        })
      });
      
      const result = await response.json();
      setDebugSteps(result.debugSteps || []);
    } catch (error) {
      setDebugSteps([{
        step: 'network',
        status: 'error',
        message: 'PDF QA调试请求失败',
        data: { error: String(error) },
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const testLocaleDebug = async () => {
    setIsLoading(true);
    setDebugSteps([]);
    
    try {
      const response = await fetch('/api/debug/locale-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfId: documentId,
          question: testContent,
          mode: 'fast',
          locale: 'ja' // 测试日语
        })
      });
      
      const result = await response.json();
      setDebugSteps(result.debugSteps || []);
    } catch (error) {
      setDebugSteps([{
        step: 'network',
        status: 'error',
        message: 'Locale调试请求失败',
        data: { error: String(error) },
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const testChatAPILocale = async () => {
    setIsLoading(true);
    setDebugSteps([]);
    
    const steps: DebugStep[] = [];
    const addStep = (step: string, status: 'success' | 'error' | 'warning', message: string, data?: any) => {
      steps.push({
        step,
        status,
        message,
        data,
        timestamp: new Date().toISOString()
      });
      setDebugSteps([...steps]);
    };

    try {
      addStep('start', 'success', '开始测试多语言聊天功能（使用专用调试API）');

      // 测试不同locale值
      const locales = ['zh', 'ja', 'ko', 'en'];
      
      for (const locale of locales) {
        addStep(`locale-${locale}`, 'success', `测试locale: ${locale}`);
        
        const requestPayload = {
          question: testContent,
          locale: locale,
          mode: 'fast'
        };
        
        addStep(`payload-${locale}`, 'success', `请求载荷 (${locale})`, requestPayload);

        try {
          const response = await fetch('/api/debug/chat-locale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
          });

          const responseText = await response.text();
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (e) {
            result = { rawResponse: responseText };
          }

          addStep(`response-${locale}`, response.ok ? 'success' : 'error', 
            `${locale}语言API响应 (${response.status})`, {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: result
          });
          
          // 如果回答成功，检查语言是否正确
          if (response.ok && result.success && result.data?.answer) {
            const answer = result.data.answer;
            let isCorrectLanguage = false;
            let languageDetection = '';
            
            // 简单的语言检测
            switch (locale) {
              case 'zh':
                isCorrectLanguage = /[\u4e00-\u9fa5]/.test(answer);
                languageDetection = isCorrectLanguage ? '✅ 检测到中文' : '❌ 未检测到中文';
                break;
              case 'ja':
                isCorrectLanguage = /[\u3040-\u309f\u30a0-\u30ff]/.test(answer) || answer.includes('です') || answer.includes('ます');
                languageDetection = isCorrectLanguage ? '✅ 检测到日语' : '❌ 未检测到日语';
                break;
              case 'ko':
                isCorrectLanguage = /[\uac00-\ud7af]/.test(answer);
                languageDetection = isCorrectLanguage ? '✅ 检测到韩语' : '❌ 未检测到韩语';
                break;
              case 'en':
                isCorrectLanguage = /^[a-zA-Z0-9\s\.,!?'"()-]+$/.test(answer.replace(/[【】]/g, ''));
                languageDetection = isCorrectLanguage ? '✅ 检测到英语' : '❌ 未检测到英语';
                break;
            }
            
            addStep(`lang-check-${locale}`, isCorrectLanguage ? 'success' : 'error', 
              `${locale}语言检测结果: ${languageDetection}`, {
              expectedLanguage: locale,
              detectedCorrect: isCorrectLanguage,
              answerPreview: answer.substring(0, 100) + '...',
              fullAnswer: answer
            });
          }
          
          // 短暂延迟避免请求过快
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (apiError) {
          addStep(`error-${locale}`, 'error', `${locale}语言API请求失败`, { error: String(apiError) });
        }
      }

    } catch (error) {
      addStep('api-error', 'error', '多语言聊天API测试失败', { error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const testOriginalAPI = async () => {
    setIsLoading(true);
    setDebugSteps([]);
    
    const steps: DebugStep[] = [];
    const addStep = (step: string, status: 'success' | 'error' | 'warning', message: string, data?: any) => {
      steps.push({
        step,
        status,
        message,
        data,
        timestamp: new Date().toISOString()
      });
      setDebugSteps([...steps]);
    };

    try {
      addStep('start', 'success', '开始测试原始聊天API');

      // 测试原始API
      const response = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: documentId,
          content: testContent,
          isUser: true
        })
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { rawResponse: responseText };
      }

      addStep('api-response', response.ok ? 'success' : 'error', 
        `原始API响应 (${response.status})`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: result
      });

    } catch (error) {
      addStep('api-error', 'error', '原始API请求失败', { error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Bug className="h-8 w-8 text-purple-600" />
              聊天功能调试控制台
            </CardTitle>
            <p className="text-gray-600">
              诊断生产环境聊天功能问题 - 详细的步骤追踪和错误分析
            </p>
          </CardHeader>
        </Card>

        {/* 测试配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              测试配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">文档ID</label>
              <Input
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="输入测试文档ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">测试消息内容</label>
              <Input
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                placeholder="输入测试消息内容"
              />
            </div>
          </CardContent>
        </Card>

        {/* 测试按钮 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              诊断工具
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={runSystemCheck} 
                disabled={isLoading}
                className="flex items-center gap-2 h-16"
                variant="outline"
              >
                {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5" />}
                <div className="text-left">
                  <div className="font-medium">系统检查</div>
                  <div className="text-sm text-gray-500">环境变量、数据库连接</div>
                </div>
              </Button>

              <Button 
                onClick={testChatAPILocale} 
                disabled={isLoading}
                className="flex items-center gap-2 h-16"
                variant="default"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              >
                {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Bug className="h-5 w-5" />}
                <div className="text-left">
                  <div className="font-medium">🔥 多语言聊天API</div>
                  <div className="text-sm text-white">测试zh/ja/ko/en四种语言</div>
                </div>
              </Button>

              <Button 
                onClick={testOriginalAPI} 
                disabled={isLoading}
                className="flex items-center gap-2 h-16"
                variant="outline"
              >
                {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                <div className="text-left">
                  <div className="font-medium">原始API测试</div>
                  <div className="text-sm text-gray-500">测试生产API响应</div>
                </div>
              </Button>
            </div>
            
            {/* 第二行：其他测试 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Button 
                onClick={runChatTest} 
                disabled={isLoading}
                className="flex items-center gap-2 h-16"
                variant="outline"
              >
                {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
                <div className="text-left">
                  <div className="font-medium">聊天测试</div>
                  <div className="text-sm text-gray-500">完整的聊天流程测试</div>
                </div>
              </Button>

              <Button 
                onClick={testPdfQA} 
                disabled={isLoading}
                className="flex items-center gap-2 h-16"
                variant="outline"
              >
                {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Bug className="h-5 w-5" />}
                <div className="text-left">
                  <div className="font-medium">PDF QA测试</div>
                  <div className="text-sm text-gray-500">测试AI回复生成</div>
                </div>
              </Button>

              <Button 
                onClick={testLocaleDebug} 
                disabled={isLoading}
                className="flex items-center gap-2 h-16"
                variant="outline"
              >
                {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                <div className="text-left">
                  <div className="font-medium">Locale参数测试</div>
                  <div className="text-sm text-gray-500">测试locale参数传递</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 调试结果 */}
        {debugSteps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                调试结果 ({debugSteps.length} 步骤)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debugSteps.map((step, index) => (
                  <div key={index} className={`p-4 rounded-lg ${getStatusColor(step.status)}`}>
                    <div className="flex items-start gap-3">
                      {getStatusIcon(step.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono">
                            {step.step}
                          </Badge>
                          <span className="font-medium">{step.message}</span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          {new Date(step.timestamp).toLocaleString('zh-CN')}
                        </div>
                        
                        {step.data && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                              查看详细数据 ▼
                            </summary>
                            <pre className="mt-2 p-3 bg-white bg-opacity-70 rounded border text-xs overflow-auto max-h-60">
                              {JSON.stringify(step.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div><strong>系统检查:</strong> 验证环境变量、数据库连接和用户认证状态</div>
            <div><strong>聊天测试:</strong> 完整测试聊天消息保存流程，包括PDF文档创建和消息验证</div>
            <div><strong>原始API测试:</strong> 直接测试生产环境的聊天API，查看原始响应</div>
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <strong>提示:</strong> 如果测试失败，请仔细查看失败步骤的详细数据，这将帮助我们定位具体问题。
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}