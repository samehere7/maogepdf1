import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { useTranslations } from 'next-intl'

export default function NotFound() {
  const t = useTranslations('error')
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md p-6">
        <div className="text-gray-400 text-8xl mb-4">404</div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">{t('pageNotFound')}</h1>
        <p className="text-gray-600 mb-6">
          {t('pageNotFoundDescription')}
        </p>
        
        <div className="space-y-3">
          <Button asChild className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed]">
            <Link href="/">{t('returnHome')}</Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            className="w-full"
          >
            <Link href="/auth/login">{t('loginAccount')}</Link>
          </Button>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">💡 {t('shareLinkIssue')}</h3>
          <p className="text-sm text-blue-700" style={{ whiteSpace: 'pre-line' }}>
            {t('shareLinkHelp')}
          </p>
        </div>
      </div>
    </div>
  )
}