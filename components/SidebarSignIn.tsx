"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { LoginModal } from "@/components/login-modal"
import { useTranslations } from 'next-intl'

export default function SidebarSignIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const t = useTranslations('auth')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  if (isLoggedIn) return null

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexShrink: 0,
        margin: "40px 0",
      }}
    >
      <Image
        src="/signin-chats.svg"
        alt=""
        width={212}
        height={102}
        style={{ maxWidth: "90%", marginBottom: 16 }}
      />
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          textAlign: "center",
          marginTop: 8,
          maxWidth: 180,
          lineHeight: "22px",
          color: "#fff",
        }}
      >
        {t('loginFreeDescription')}
      </span>
      <LoginModal>
        <Button
          className="button-primary"
          style={{
            marginTop: 16,
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            lineHeight: "17.85px",
            textAlign: "center",
            color: "#fff",
            padding: "10px 12px",
            background: "#a026ff",
            borderRadius: 8,
            cursor: "pointer",
            display: "inline-block",
          }}
        >
          {t('login')}
        </Button>
      </LoginModal>
    </div>
  )
} 