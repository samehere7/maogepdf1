const jwt = require('jsonwebtoken')

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5Nzg5NSwiZXhwIjoyMDY0NzczODk1fQ.CkPzDehpjCsiH7ZpLPtu8LUZzr5q1w4iTHp-Z_bobLk'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTc4OTUsImV4cCI6MjA2NDc3Mzg5NX0.g-xSF9yegK1lp9emJx4YOlJjw4BoAJZ1yz38t-r2mWc'

console.log('验证JWT令牌...\n')

try {
  console.log('1. Service Role Key:')
  const serviceDecoded = jwt.decode(serviceKey)
  console.log('  解码结果:', JSON.stringify(serviceDecoded, null, 2))
  
  console.log('\n2. Anon Key:')
  const anonDecoded = jwt.decode(anonKey)
  console.log('  解码结果:', JSON.stringify(anonDecoded, null, 2))

  // 检查过期时间
  const now = Math.floor(Date.now() / 1000)
  console.log('\n3. 过期检查:')
  console.log('  当前时间戳:', now)
  console.log('  Service Key过期时间:', serviceDecoded.exp)
  console.log('  Service Key是否过期:', now > serviceDecoded.exp)
  console.log('  Anon Key过期时间:', anonDecoded.exp)
  console.log('  Anon Key是否过期:', now > anonDecoded.exp)

  // 检查项目引用
  console.log('\n4. 项目引用检查:')
  console.log('  Service Key项目:', serviceDecoded.ref)
  console.log('  Anon Key项目:', anonDecoded.ref)
  console.log('  项目是否匹配:', serviceDecoded.ref === anonDecoded.ref)

} catch (error) {
  console.error('JWT解码失败:', error)
}