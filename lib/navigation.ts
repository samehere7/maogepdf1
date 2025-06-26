import { useLocale } from 'next-intl';
import { useRouter as useNextRouter } from 'next/navigation';

/**
 * 统一的本地化导航工具函数
 * 自动处理locale前缀，防止硬编码路径错误
 */
export const useLocalizedNavigation = () => {
  const locale = useLocale();
  const router = useNextRouter();

  /**
   * 带locale前缀的路由跳转
   * @param path - 路径，可以以"/"开头或不开头
   * @param options - 可选的路由选项
   */
  const push = (path: string, options?: { replace?: boolean }) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const localizedPath = `/${locale}${cleanPath}`;
    
    if (options?.replace) {
      router.replace(localizedPath);
    } else {
      router.push(localizedPath);
    }
  };

  /**
   * 带locale前缀的路由替换
   * @param path - 路径，可以以"/"开头或不开头
   */
  const replace = (path: string) => {
    push(path, { replace: true });
  };

  /**
   * 生成带locale前缀的路径（不执行跳转）
   * @param path - 路径，可以以"/"开头或不开头
   * @returns 完整的本地化路径
   */
  const href = (path: string): string => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${cleanPath}`;
  };

  /**
   * 生成外部完整URL（包含域名）
   * @param path - 路径，可以以"/"开头或不开头
   * @returns 完整的URL
   */
  const absoluteUrl = (path: string): string => {
    if (typeof window === 'undefined') return href(path);
    return `${window.location.origin}${href(path)}`;
  };

  return {
    push,
    replace,
    href,
    absoluteUrl,
    locale,
    // 暴露原始router以备特殊需要
    router
  };
};

/**
 * 验证locale是否有效
 * @param locale - 要验证的locale
 * @returns 是否为有效的locale
 */
export const isValidLocale = (locale: string): boolean => {
  const validLocales = [
    'en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt-BR', 'ru', 'it', 
    'nl', 'sv', 'da', 'no', 'fi', 'pl', 'tr', 'hi', 'bn', 'pa', 
    'kn', 'th', 'vi', 'id', 'ms'
  ];
  return validLocales.includes(locale);
};

/**
 * 从路径中提取locale
 * @param pathname - 当前路径
 * @returns locale或null
 */
export const extractLocaleFromPath = (pathname: string): string | null => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  return isValidLocale(firstSegment) ? firstSegment : null;
};

/**
 * 重定向到包含locale前缀的路径（仅在客户端）
 * @param targetLocale - 目标locale
 * @param currentPath - 当前路径（可选，默认使用window.location.pathname）
 */
export const redirectToLocalizedPath = (targetLocale: string, currentPath?: string) => {
  if (typeof window === 'undefined') return;
  
  const pathname = currentPath || window.location.pathname;
  const currentLocale = extractLocaleFromPath(pathname);
  
  // 如果已经有正确的locale前缀，不需要重定向
  if (currentLocale === targetLocale) return;
  
  // 移除现有的locale前缀（如果有）
  let pathWithoutLocale = pathname;
  if (currentLocale) {
    pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
  }
  
  // 添加新的locale前缀
  const newPath = `/${targetLocale}${pathWithoutLocale}`;
  
  console.log(`[导航工具] 重定向: ${pathname} -> ${newPath}`);
  window.location.href = newPath;
};