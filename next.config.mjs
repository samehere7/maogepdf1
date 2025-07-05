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
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'pwlvfmywfzllopuiisxg.supabase.co'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // 处理 pdfjs-dist 依赖 canvas 的问题
    config.resolve.alias.canvas = false;
    
    // 优化包大小
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    // 在服务器端忽略某些包，但middleware需要 @supabase/ssr
    if (isServer) {
      config.externals = config.externals || [];
      // 只外部化 @supabase/supabase-js，保留 @supabase/ssr 给 middleware 使用
      config.externals.push('@supabase/supabase-js');
      
      // 确保 tailwind-merge 不被外部化
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(external => 
          typeof external === 'string' ? external !== 'tailwind-merge' : true
        );
      }
    }
    
    return config;
  },
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: [
      'pdf-parse', 
      '@supabase/supabase-js', 
      '@supabase/ssr',
      '@formatjs/intl-localematcher',
      '@formatjs/ecma402-abstract'
    ],
    optimizePackageImports: ['lucide-react'],
  },
  // 生产环境优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 重定向配置 - 暂时禁用以避免循环
  async redirects() {
    return [];
  },
  // Headers配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  }
}

export default createNextIntlPlugin(nextConfig)
