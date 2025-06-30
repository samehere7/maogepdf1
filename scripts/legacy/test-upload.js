const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  try {
    console.log('Testing PDF upload process...');
    
    // 检查测试PDF文件是否存在
    const testPdfPath = path.join(__dirname, 'public', 'sample.pdf');
    if (!fs.existsSync(testPdfPath)) {
      console.error('Test PDF file not found at:', testPdfPath);
      return;
    }
    
    const testUserId = '819fde1e-0fe0-46e7-86f9-32fbdfdb8ad8'; // 从之前的测试中看到的用户ID
    const fileName = 'test-upload.pdf';
    const uniqueFileName = `test_${Date.now()}.pdf`;
    
    // 读取文件
    const fileBuffer = fs.readFileSync(testPdfPath);
    const file = new Blob([fileBuffer], { type: 'application/pdf' });
    
    console.log('File size:', file.size);
    
    // 1. 测试存储上传
    console.log('\n1. Testing storage upload...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(uniqueFileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Storage upload failed:', uploadError);
      return;
    }
    
    console.log('Storage upload successful:', uploadData);
    
    // 2. 获取公共URL
    const { data: { publicUrl } } = supabase.storage
      .from('pdfs')
      .getPublicUrl(uniqueFileName);
    
    console.log('Public URL:', publicUrl);
    
    // 3. 测试数据库插入
    console.log('\n2. Testing database insert...');
    const { data: pdfRecord, error: dbError } = await supabase
      .from('pdfs')
      .insert({
        name: fileName,
        url: publicUrl,
        size: file.size,
        user_id: testUserId,
        summary: fileName
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database insert failed:', dbError);
      
      // 清理上传的文件
      await supabase.storage.from('pdfs').remove([uniqueFileName]);
      return;
    }
    
    console.log('Database insert successful:', pdfRecord);
    
    // 4. 清理测试数据
    console.log('\n3. Cleaning up test data...');
    
    // 删除数据库记录
    const { error: deleteDbError } = await supabase
      .from('pdfs')
      .delete()
      .eq('id', pdfRecord.id);
    
    if (deleteDbError) {
      console.error('Failed to delete DB record:', deleteDbError);
    } else {
      console.log('DB record deleted successfully');
    }
    
    // 删除存储文件
    const { error: deleteStorageError } = await supabase.storage
      .from('pdfs')
      .remove([uniqueFileName]);
    
    if (deleteStorageError) {
      console.error('Failed to delete storage file:', deleteStorageError);
    } else {
      console.log('Storage file deleted successfully');
    }
    
    console.log('\nUpload test completed successfully!');
    
  } catch (error) {
    console.error('Upload test failed:', error);
  }
}

testUpload().then(() => {
  process.exit(0);
});