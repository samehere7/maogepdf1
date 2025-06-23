import {getRequestConfig} from 'next-intl/server';

// ChatPDF对标的25种语言
export const locales = [
  'en',    // English 🇺🇸
  'zh',    // 中文 🇨🇳  
  'ja',    // 日本語 🇯🇵
  'ko',    // 한국어 🇰🇷
  'es',    // Español 🇪🇸
  'fr',    // Français 🇫🇷
  'de',    // Deutsch 🇩🇪
  'pt-BR', // Português (Brasil) 🇧🇷
  'ru',    // Русский 🇷🇺
  'it',    // Italiano 🇮🇹
  'nl',    // Nederlands 🇳🇱
  'sv',    // Svenska 🇸🇪
  'da',    // Dansk 🇩🇰
  'no',    // Norsk bokmål 🇳🇴
  'fi',    // Suomi 🇫🇮
  'pl',    // Polski 🇵🇱
  'tr',    // Türkçe 🇹🇷
  'hi',    // हिन्दी 🇮🇳
  'bn',    // বাংলা 🇧🇩
  'pa',    // ਪੰਜਾਬੀ 🇮🇳
  'kn',    // ಕನ್ನಡ 🇮🇳
  'th',    // ไทย 🇹🇭
  'vi',    // Tiếng Việt 🇻🇳
  'id',    // Bahasa Indonesia 🇮🇩
  'ms'     // Bahasa Melayu 🇲🇾
] as const;

export type Locale = typeof locales[number];

export const defaultLocale = 'en';

export default getRequestConfig(async ({locale}) => {
  console.log('🔍 i18n getRequestConfig - Requested locale:', locale);
  console.log('🔍 i18n getRequestConfig - Locale type:', typeof locale);
  
  // Validate that the incoming `locale` parameter is valid
  // If not valid, fall back to default locale instead of using notFound()
  const validLocale = locales.includes(locale as Locale) ? locale : defaultLocale;
  console.log('🔍 i18n getRequestConfig - Fallback applied?', locale !== validLocale);
  
  console.log('🔍 i18n getRequestConfig - Valid locale:', validLocale);
  console.log('🔍 i18n getRequestConfig - Loading messages for:', validLocale);

  try {
    const messages = (await import(`./messages/${validLocale}.json`)).default;
    console.log('🔍 i18n getRequestConfig - Messages loaded successfully for:', validLocale);
    
    return {
      locale: validLocale,
      messages
    };
  } catch (error) {
    console.error('🔍 i18n getRequestConfig - Error loading messages for:', validLocale, error);
    
    // Fallback to default locale messages
    const fallbackMessages = (await import(`./messages/${defaultLocale}.json`)).default;
    return {
      locale: defaultLocale,
      messages: fallbackMessages
    };
  }
});