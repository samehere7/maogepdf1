"use client"

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      // 检查认证状态
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      // 测试API调用
      const headers: any = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/debug-user-status', {
        headers
      });
      const apiResult = await response.json();
      
      setResult({
        userLoggedIn: !!user,
        userEmail: user?.email || 'N/A',
        hasAccessToken: !!session?.access_token,
        apiStatus: response.status,
        apiResult: apiResult
      });
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>认证状态调试页面</h1>
      
      <button 
        onClick={testAuth} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '检查中...' : '检查认证状态'}
      </button>
      
      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <h3>检查结果：</h3>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            fontSize: '14px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <h3>说明：</h3>
        <ul>
          <li><strong>userLoggedIn:</strong> 前端是否认为用户已登录</li>
          <li><strong>hasAccessToken:</strong> 是否有访问令牌</li>
          <li><strong>apiResult.authenticated:</strong> 后端是否认为用户已登录</li>
        </ul>
      </div>
    </div>
  );
}