// 根路径重定向到默认语言
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/en');
}