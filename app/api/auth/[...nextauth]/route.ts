import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"

// You must set these in your .env.local file
// GOOGLE_CLIENT_ID=your-google-client-id
// GOOGLE_CLIENT_SECRET=your-google-client-secret

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/en/auth/login',
    error: '/en/auth/error',
  },
  // 强制使用生产域名，忽略错误的环境变量
  url: process.env.NODE_ENV === 'production' ? 'https://www.maogepdf.com' : process.env.NEXTAUTH_URL,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 在生产环境强制使用正确的 baseUrl
      const productionBaseUrl = process.env.NODE_ENV === 'production' ? 'https://www.maogepdf.com' : baseUrl;
      
      console.log('NextAuth redirect:', { url, baseUrl, productionBaseUrl, env: process.env.NODE_ENV });
      
      // 如果URL包含localhost，强制重定向到生产域名
      if (url.includes('localhost')) {
        console.log('Detected localhost redirect, forcing to production domain');
        return `${productionBaseUrl}/en`;
      }
      
      // 如果URL是相对路径，使用生产baseUrl
      if (url.startsWith("/")) return `${productionBaseUrl}${url}`;
      
      // 如果URL是完整URL且是我们的域名，允许重定向
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === productionBaseUrl) return url;
      } catch (e) {
        console.error('Invalid URL in redirect:', url, e);
      }
      
      // 默认重定向到首页
      return `${productionBaseUrl}/en`;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.email = profile.email
        token.name = profile.name
        token.picture = (profile as any).picture
        // 使用email作为唯一标识符生成一致的ID
        token.id = Buffer.from(profile.email || '').toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        email: token.email,
        name: token.name,
        image: token.picture,
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
