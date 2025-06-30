const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUserToPlus() {
  try {
    console.log('正在将用户设置为Plus用户...');
    console.log('邮箱:', 'a123110010@gmail.com');
    
    // 1. 首先查找用户
    const { data: users, error: findError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'a123110010@gmail.com');
    
    if (findError) {
      console.error('查找用户失败:', findError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('未找到该邮箱的用户，尝试创建用户记录...');
      
      // 如果用户不存在，先创建用户记录
      const { data: newUser, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          email: 'a123110010@gmail.com',
          name: 'Test User',
          plus: true,
          is_active: true,
          expire_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1年后过期
        })
        .select()
        .single();
      
      if (createError) {
        console.error('创建用户失败:', createError);
        return;
      }
      
      console.log('用户创建成功:', newUser);
      return;
    }
    
    console.log('找到用户:', users[0]);
    
    // 2. 更新用户为Plus
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        plus: true,
        is_active: true,
        expire_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1年后过期
      })
      .eq('email', 'a123110010@gmail.com')
      .select()
      .single();
    
    if (updateError) {
      console.error('更新用户失败:', updateError);
      return;
    }
    
    console.log('✅ 用户已成功设置为Plus!');
    console.log('更新后的用户信息:', {
      id: updatedUser.id,
      email: updatedUser.email,
      plus: updatedUser.plus,
      is_active: updatedUser.is_active,
      expire_at: updatedUser.expire_at
    });
    
    // 3. 验证更新
    const { data: verifyUser, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'a123110010@gmail.com')
      .single();
    
    if (verifyError) {
      console.error('验证失败:', verifyError);
      return;
    }
    
    console.log('🔍 验证结果:');
    console.log('- Plus状态:', verifyUser.plus);
    console.log('- 激活状态:', verifyUser.is_active);
    console.log('- 过期时间:', verifyUser.expire_at);
    
  } catch (error) {
    console.error('操作失败:', error);
  }
}

updateUserToPlus().then(() => {
  console.log('\n操作完成！现在你可以尝试上传大文件了。');
  process.exit(0);
});