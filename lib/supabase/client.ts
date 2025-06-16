'use client'

import { createBrowserClient } from '@supabase/ssr'

// 创建支持SSR的Supabase客户端实例，这样session会保存在cookies中
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) 