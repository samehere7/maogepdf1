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
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 如果URL是相对路径，或者以baseUrl开头，允许重定向
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // 如果URL以baseUrl开头，允许重定向
      else if (new URL(url).origin === baseUrl) return url
      // 否则重定向到首页
      return baseUrl
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
