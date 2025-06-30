const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing database connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // 测试基本连接
    console.log('\n1. Testing basic connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth test result:', authError ? 'Error: ' + authError.message : 'No error (expected for service role)');
    
    // 测试数据库访问
    console.log('\n2. Testing database access...');
    const { data: tables, error: tablesError } = await supabase
      .from('pdfs')
      .select('id')
      .limit(1);
    
    if (tablesError) {
      console.error('Database access error:', tablesError);
    } else {
      console.log('Database access successful. Sample data:', tables);
    }
    
    // 测试存储访问
    console.log('\n3. Testing storage access...');
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets();
    
    if (storageError) {
      console.error('Storage access error:', storageError);
    } else {
      console.log('Storage access successful. Buckets:', buckets?.map(b => b.name));
    }
    
    // 测试用户profiles表
    console.log('\n4. Testing user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error('User profiles access error:', profilesError);
    } else {
      console.log('User profiles access successful. Sample data:', profiles);
    }
    
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection().then(() => {
  console.log('\nConnection test completed.');
  process.exit(0);
});