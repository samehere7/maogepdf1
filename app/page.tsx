import { redirect } from 'next/navigation'

export default function RootPage() {
  // 直接重定向到应用主页
  redirect('/en')
}