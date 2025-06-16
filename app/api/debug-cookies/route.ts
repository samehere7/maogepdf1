import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    
    console.log('[Debug Cookies] 检查所有cookies...')
    
    const cookieData = allCookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      hasValue: !!cookie.value,
      length: cookie.value?.length || 0,
      startsWithSb: cookie.name.startsWith('sb-'),
      isSupabaseAuth: cookie.name.includes('auth-token') || cookie.name.includes('session'),
      isCustom: cookie.name === 'sb-access-token' || cookie.name === 'sb-refresh-token'
    }))
    
    // 寻找Supabase相关的cookies
    const supabaseCookies = cookieData.filter(c => 
      c.startsWithSb || c.isSupabaseAuth || c.name.includes('supabase')
    )
    
    console.log('[Debug Cookies] Supabase相关cookies:', supabaseCookies)
    
    return NextResponse.json({
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.length,
      cookies: cookieData,
      supabaseRelated: supabaseCookies
    })
    
  } catch (error) {
    console.error('[Debug Cookies] 检查失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}