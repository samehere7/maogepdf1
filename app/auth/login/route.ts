import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error(error)
    return NextResponse.redirect('/error')
  }

  if (data.url) {
    return NextResponse.redirect(data.url)
  }

  return NextResponse.redirect('/error')
} 