-- 创建User表
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "image" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建PDF表
CREATE TABLE IF NOT EXISTS "PDF" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "uploadDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastViewed" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "embeddings" TEXT,
  "userId" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- 设置RLS策略
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PDF" ENABLE ROW LEVEL SECURITY;

-- 创建用户访问策略
CREATE POLICY "用户可以访问自己的记录" ON "User"
  FOR ALL USING (auth.uid()::text = id);

-- 创建PDF访问策略
CREATE POLICY "用户可以访问自己的PDF" ON "PDF"
  FOR ALL USING (auth.uid()::text = "userId"); 