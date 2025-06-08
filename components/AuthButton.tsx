"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from '@supabase/supabase-js'

export default function AuthButton() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return <div className="w-[86px] h-[40px] bg-gray-200 rounded-md animate-pulse"></div>
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.name} />
          <AvatarFallback>{user.user_metadata.name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.user_metadata.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 