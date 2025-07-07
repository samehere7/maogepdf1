import withNextIntl from 'next-intl/plugin';
const createNextIntlPlugin = withNextIntl('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 最简化的webpack配置
  webpack: (config, { isServer }) => {
    // 只保留必要的PDF.js配置
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },
  // 禁用strict mode进行测试
  reactStrictMode: false,
  // 使用简单的minify
  swcMinify: false,
  // 移除所有experimental配置
  experimental: {},
  // 移除compiler配置
  // 移除headers和redirects配置
}

export default createNextIntlPlugin(nextConfig)