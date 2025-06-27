"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bug, RefreshCw, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface DebugStep {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  timestamp: string;
}

interface DebugPanelProps {
  documentId: string;
  onDebugComplete?: (success: boolean) => void;
}

export function DebugPanel({ documentId, onDebugComplete }: DebugPanelProps) {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleStepExpansion = (step: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(step)) {
      newExpanded.delete(step);
    } else {
      newExpanded.add(step);
    }
    setExpandedSteps(newExpanded);
  };

  const runSystemCheck = async () => {
    setIsDebugging(true);
    setDebugSteps([]);
    
    try {
      const response = await fetch('/api/debug/chat-messages');
      const result = await response.json();
      
      setDebugSteps(result.debugSteps || []);
      
      if (response.ok) {
        onDebugComplete?.(true);
      } else {
        onDebugComplete?.(false);
      }
    } catch (error) {
      setDebugSteps([{
        step: 'network',
        status: 'error',
        message: '网络请求失败',
        data: { error: String(error) },
        timestamp: new Date().toISOString()
      }]);
      onDebugComplete?.(false);
    } finally {
      setIsDebugging(false);
    }
  };

  const runChatTest = async () => {
    setIsDebugging(true);
    setDebugSteps([]);
    
    try {
      const response = await fetch('/api/debug/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: documentId,
          content: '调试测试消息 - ' + new Date().toISOString(),
          isUser: true
        })
      });
      
      const result = await response.json();
      setDebugSteps(result.debugSteps || []);
      
      if (response.ok && result.success) {
        onDebugComplete?.(true);
      } else {
        onDebugComplete?.(false);
      }
    } catch (error) {
      setDebugSteps([{
        step: 'network',
        status: 'error',
        message: '聊天测试网络请求失败',
        data: { error: String(error) },
        timestamp: new Date().toISOString()
      }]);
      onDebugComplete?.(false);
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          聊天功能调试工具
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            onClick={runSystemCheck} 
            disabled={isDebugging}
            variant="outline"
            size="sm"
          >
            {isDebugging ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            系统检查
          </Button>
          <Button 
            onClick={runChatTest} 
            disabled={isDebugging}
            variant="outline"
            size="sm"
          >
            {isDebugging ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
            聊天测试
          </Button>
        </div>
      </CardHeader>
      
      {debugSteps.length > 0 && (
        <CardContent>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>调试步骤 ({debugSteps.length})</span>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 mt-2">
                {debugSteps.map((step, index) => (
                  <div key={index} className={`border rounded-lg p-3 ${getStatusColor(step.status)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(step.status)}
                        <Badge variant="outline">{step.step}</Badge>
                        <span className="font-medium">{step.message}</span>
                      </div>
                      {step.data && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStepExpansion(`${index}-${step.step}`)}
                        >
                          {expandedSteps.has(`${index}-${step.step}`) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(step.timestamp).toLocaleString()}
                    </div>
                    
                    {step.data && expandedSteps.has(`${index}-${step.step}`) && (
                      <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border">
                        <pre className="text-xs overflow-auto max-h-40">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
    </Card>
  );
}