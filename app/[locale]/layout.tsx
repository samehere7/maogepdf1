import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { Providers } from "@/components/providers"
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';
import {locales} from '@/i18n';
import GlobalErrorHandler from '@/components/GlobalErrorHandler';
import { DebugErrorBoundary } from '@/components/DebugErrorBoundary';
import DebugHelper from '@/components/DebugHelper';

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata({
  params: {locale}
}: {
  params: {locale: string};
}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'metadata'});
  
  return {
    title: t('title'),
    description: t('description'),
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  console.log('🔍 LocaleLayout - Received locale:', locale);
  console.log('🔍 LocaleLayout - Available locales:', locales);
  
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({locale});
  
  console.log('🔍 LocaleLayout - Messages loaded for:', locale, 'Keys:', Object.keys(messages).length);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <DebugErrorBoundary>
          <NextIntlClientProvider messages={messages}>
            <Providers>
              <GlobalErrorHandler />
              {children}
              <DebugHelper />
            </Providers>
          </NextIntlClientProvider>
        </DebugErrorBoundary>
      </body>
    </html>
  )
}