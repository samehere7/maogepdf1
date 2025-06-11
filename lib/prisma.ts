import { PrismaClient } from './generated/prisma';

// 定义全局类型
declare global {
  var prisma: PrismaClient | undefined;
}

// 使用单例模式
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export { prisma }; 