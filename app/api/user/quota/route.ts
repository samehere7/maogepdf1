import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service-client'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取用户的 JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 使用普通客户端验证用户身份
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 使用 service role 客户端查询用户今日配额
    const { data: userQuota, error: quotaError } = await supabaseService
      .from('user_daily_quota')
      .select('id, pdf_count, chat_count, quota_date')
      .eq('id', user.id)
      .eq('quota_date', new Date().toISOString().split('T')[0]) // 今日日期
      .single()

    let finalQuota
    
    if (quotaError || !userQuota) {
      // 如果没有今日配额记录，返回默认值
      finalQuota = {
        id: user.id,
        pdf_count: 0,
        chat_count: 0,
        quota_date: new Date().toISOString().split('T')[0]
      }
    } else {
      finalQuota = {
        id: userQuota.id,
        pdf_count: userQuota.pdf_count || 0,
        chat_count: userQuota.chat_count || 0,
        quota_date: userQuota.quota_date
      }
    }

    return NextResponse.json({ quota: finalQuota })

  } catch (error) {
    console.error('Error fetching user quota:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}