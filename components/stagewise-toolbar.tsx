'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// 动态导入Stagewise组件，确保它只在客户端渲染
// 使用空组件作为备用，避免导入错误
const StagewiseToolbar = dynamic(
  () => import('@stagewise/toolbar-next').then((mod) => mod.StagewiseToolbar).catch(() => () => null),
  { 
    ssr: false,
    loading: () => null
  }
);

export default function StagewiseToolbarWrapper() {
  // 简化配置，避免类型错误
  return <StagewiseToolbar />
} 