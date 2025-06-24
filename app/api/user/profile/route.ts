import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service-client'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取用户的 JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 使用普通客户端验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 使用 service role 客户端查询用户配置文件
    const { data: userProfile, error: profileError } = await supabaseService
      .from('user_profiles')
      .select('id, email, name, avatar_url, plus, is_active, expire_at')
      .eq('id', user.id)
      .single()

    let finalProfile
    
    if (profileError || !userProfile) {
      // 如果数据库中没有用户配置文件，创建基本配置文件
      finalProfile = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url,
        plus: false,
        is_active: true
      }
    } else {
      // 检查Plus会员是否过期
      const isExpired = userProfile.expire_at && new Date(userProfile.expire_at) < new Date()
      
      finalProfile = {
        id: userProfile.id,
        email: userProfile.email || user.email || '',
        name: userProfile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: userProfile.avatar_url || user.user_metadata?.avatar_url,
        plus: userProfile.plus && !isExpired,
        is_active: userProfile.is_active && !isExpired,
        expire_at: userProfile.expire_at
      }
    }

    return NextResponse.json({ profile: finalProfile })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}