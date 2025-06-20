import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// ChatPDF对标的26种语言
export const locales = [
  'en',    // English 🇺🇸
  'zh',    // 中文 🇨🇳  
  'zh-TW', // 中文（台灣） 🇹🇼
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

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});