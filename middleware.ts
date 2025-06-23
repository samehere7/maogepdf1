import createIntlMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';
import { NextRequest } from 'next/server';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const localeFromPath = pathname.split('/')[1];
  
  console.log('🔍 Middleware - Request URL:', request.url);
  console.log('🔍 Middleware - Pathname:', pathname);
  console.log('🔍 Middleware - Detected locale from path:', localeFromPath);
  console.log('🔍 Middleware - Is valid locale:', locales.includes(localeFromPath as any));
  
  const response = intlMiddleware(request);
  
  if (response) {
    console.log('🔍 Middleware - Response status:', response.status);
    console.log('🔍 Middleware - Redirecting to:', response.headers.get('location') || 'No redirect');
  } else {
    console.log('🔍 Middleware - No response, continuing...');
  }
  
  return response;
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(de|en|es|fr|it|ja|ko|pt-BR|ru|zh|nl|sv|da|no|fi|pl|tr|hi|bn|pa|kn|th|vi|id|ms)/:path*',
    
    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    // Exclude API routes, _next, _vercel, and files with extensions
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ],
}