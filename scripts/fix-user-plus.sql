-- 添加plus字段到User表
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plus" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "expire_at" TIMESTAMP WITH TIME ZONE;

-- 创建或更新user_with_plus视图
DROP VIEW IF EXISTS "user_with_plus";
CREATE VIEW "user_with_plus" AS
SELECT 
  "id",
  "email",
  "name",
  "image",
  "createdAt",
  "updatedAt",
  "plus",
  "is_active",
  "expire_at"
FROM "User";

-- 更新所有现有用户为非Plus用户
UPDATE "User" SET "plus" = false, "is_active" = true WHERE "plus" IS NULL; 