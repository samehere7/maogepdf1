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
  webpack: (config) => {
    // 处理 pdfjs-dist 依赖 canvas 的问题
    config.resolve.alias.canvas = false;
    
    return config;
  },
}

export default nextConfig
