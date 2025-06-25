import { NextResponse } from 'next/server'

export async function GET() {
  const instructions = {
    timestamp: new Date().toISOString(),
    problem: "RLS (Row Level Security) 策略阻止 service_role 访问表数据",
    
    solution: {
      title: "手动修复 Supabase RLS 策略",
      steps: [
        {
          step: 1,
          action: "打开 Supabase 控制台",
          url: "https://supabase.com/dashboard/project/pwlvfmywfzllopuiisxg",
          description: "登录到你的 Supabase 项目控制台"
        },
        {
          step: 2,
          action: "进入 SQL Editor",
          path: "左侧菜单 → SQL Editor",
          description: "点击左侧菜单的 SQL Editor"
        },
        {
          step: 3,
          action: "执行修复 SQL",
          description: "复制并执行以下 SQL 语句",
          sql: `-- 修复 user_profiles 表的 RLS 策略
CREATE POLICY IF NOT EXISTS "service_role_access_user_profiles" 
ON public.user_profiles FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 修复 user_daily_quota 表的 RLS 策略  
CREATE POLICY IF NOT EXISTS "service_role_access_user_daily_quota" 
ON public.user_daily_quota FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 修复 pdfs 表的 RLS 策略
CREATE POLICY IF NOT EXISTS "service_role_access_pdfs" 
ON public.pdfs FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 修复 plus 表的 RLS 策略
CREATE POLICY IF NOT EXISTS "service_role_access_plus" 
ON public.plus FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 验证策略是否创建成功
SELECT schemaname, tablename, policyname, roles 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_daily_quota', 'pdfs', 'plus')
AND policyname LIKE '%service_role%';`
        },
        {
          step: 4,
          action: "验证修复",
          description: "执行 SQL 后，访问以下验证 API",
          verifyUrl: "https://www.maogepdf.com/api/verify-service-role-fix"
        }
      ]
    },

    alternativeSolution: {
      title: "或者：临时禁用 RLS",
      warning: "⚠️ 这会降低安全性，仅用于测试",
      sql: `-- 临时禁用 RLS (仅用于测试)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quota DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.pdfs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus DISABLE ROW LEVEL SECURITY;`
    },

    explanation: {
      title: "问题解释",
      details: [
        "Supabase 默认启用 RLS (Row Level Security) 来保护数据",
        "service_role 是管理员角色，但需要明确的策略才能访问表",
        "匿名用户 (anon) 有基本的读取策略，所以匿名客户端工作正常",
        "service_role 缺少访问策略，所以显示 'Invalid API key' 错误",
        "修复后，所有数据库操作都会恢复正常"
      ]
    },

    nextSteps: [
      "1. 在 Supabase 控制台执行修复 SQL",
      "2. 访问验证 API 确认修复成功",
      "3. 重新测试网站的支付功能",
      "4. 检查超级诊断页面确认所有测试通过"
    ]
  }

  return NextResponse.json(instructions, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}