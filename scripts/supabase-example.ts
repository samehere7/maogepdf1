import { supabase } from '../lib/supabase/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

/**
 * Supabase基础操作示例
 * 演示如何:
 * 1. 检查连接
 * 2. 查询数据
 * 3. 插入数据
 * 4. 更新数据
 * 5. 删除数据
 */
async function runSupabaseExample() {
  console.log('启动Supabase示例...');

  try {
    // 检查Supabase连接
    const { data: connectionTest, error: connectionError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('Supabase连接错误:', connectionError.message);
      console.log('请确保你的Supabase URL和匿名密钥在.env.local中正确配置');
      return;
    }
    
    console.log('Supabase连接成功!');

    // 示例：查询数据
    console.log('\n1. 查询数据示例:');
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .limit(5);
    
    if (selectError) {
      console.error('查询错误:', selectError.message);
    } else {
      console.log('查询结果:', profiles);
    }

    // 示例：插入数据
    console.log('\n2. 插入数据示例:');
    const newProfile = {
      username: `test_user_${Date.now()}`,
      full_name: '测试用户',
      avatar_url: null,
      website: 'https://example.com'
    };
    
    const { data: insertedProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();
    
    if (insertError) {
      console.error('插入错误:', insertError.message);
    } else {
      console.log('新插入的配置文件:', insertedProfile);
      
      // 记录ID用于后续更新和删除操作
      const profileId = insertedProfile.id;
      
      // 示例：更新数据
      console.log('\n3. 更新数据示例:');
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: '已更新的测试用户' })
        .eq('id', profileId)
        .select()
        .single();
      
      if (updateError) {
        console.error('更新错误:', updateError.message);
      } else {
        console.log('更新后的配置文件:', updatedProfile);
      }
      
      // 示例：删除数据
      console.log('\n4. 删除数据示例:');
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);
      
      if (deleteError) {
        console.error('删除错误:', deleteError.message);
      } else {
        console.log(`成功删除ID为 ${profileId} 的配置文件`);
      }
    }

    // 示例：使用过滤器进行高级查询
    console.log('\n5. 高级查询示例:');
    const { data: filteredProfiles, error: filterError } = await supabase
      .from('profiles')
      .select('username, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (filterError) {
      console.error('过滤查询错误:', filterError.message);
    } else {
      console.log('最近创建的3个配置文件:', filteredProfiles);
    }

  } catch (error) {
    console.error('运行过程中发生错误:', error);
  } finally {
    console.log('\nSupabase示例完成。');
  }
}

// 执行示例
runSupabaseExample().catch(console.error);

/**
 * 要运行此示例:
 * 1. 确保已安装Supabase客户端: npm install @supabase/supabase-js dotenv
 * 2. 在.env.local中配置你的Supabase URL和匿名密钥
 * 3. 确保你的Supabase项目中有名为'profiles'的表
 * 4. 运行: npx ts-node scripts/supabase-example.ts
 * 
 * 注意: 此示例假设有一个包含以下字段的'profiles'表:
 * - id (UUID, 主键)
 * - username (文本)
 * - full_name (文本)
 * - avatar_url (文本, 可为null)
 * - website (文本, 可为null)
 * - created_at (时间戳, 默认为now())
 */ 