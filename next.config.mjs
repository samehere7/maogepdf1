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
    domains: ['lh3.googleusercontent.com'],
  },
  webpack: (config) => {
    // 处理 pdfjs-dist 依赖 canvas 的问题
    config.resolve.alias.canvas = false;
    
    return config;
  },
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  serverRuntimeConfig: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  }
}

export default nextConfig
