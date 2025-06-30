// 简单的JWT解码（不验证签名）
function decodeJWT(token) {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format')
  }
  
  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
  
  return { header, payload }
}

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5Nzg5NSwiZXhwIjoyMDY0NzczODk1fQ.CkPzDehpjCsiH7ZpLPtu8LUZzr5q1w4iTHp-Z_bobLk'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTc4OTUsImV4cCI6MjA2NDc3Mzg5NX0.g-xSF9yegK1lp9emJx4YOlJjw4BoAJZ1yz38t-r2mWc'

console.log('JWT令牌分析:\n')

try {
  console.log('1. Service Role Key:')
  const serviceDecoded = decodeJWT(serviceKey)
  console.log('  Header:', JSON.stringify(serviceDecoded.header, null, 2))
  console.log('  Payload:', JSON.stringify(serviceDecoded.payload, null, 2))
  
  console.log('\n2. Anon Key:')
  const anonDecoded = decodeJWT(anonKey)
  console.log('  Header:', JSON.stringify(anonDecoded.header, null, 2))
  console.log('  Payload:', JSON.stringify(anonDecoded.payload, null, 2))

  // 检查过期时间
  const now = Math.floor(Date.now() / 1000)
  console.log('\n3. 过期检查:')
  console.log('  当前时间戳:', now)
  console.log('  当前时间:', new Date().toISOString())
  console.log('  Service Key过期时间:', serviceDecoded.payload.exp)
  console.log('  Service Key过期日期:', new Date(serviceDecoded.payload.exp * 1000).toISOString())
  console.log('  Service Key是否过期:', now > serviceDecoded.payload.exp ? '是' : '否')
  console.log('  Anon Key过期时间:', anonDecoded.payload.exp)
  console.log('  Anon Key过期日期:', new Date(anonDecoded.payload.exp * 1000).toISOString())
  console.log('  Anon Key是否过期:', now > anonDecoded.payload.exp ? '是' : '否')

  // 检查项目引用
  console.log('\n4. 项目引用检查:')
  console.log('  Service Key项目:', serviceDecoded.payload.ref)
  console.log('  Anon Key项目:', anonDecoded.payload.ref)
  console.log('  项目是否匹配:', serviceDecoded.payload.ref === anonDecoded.payload.ref ? '是' : '否')

  // 检查角色
  console.log('\n5. 角色检查:')
  console.log('  Service Key角色:', serviceDecoded.payload.role)
  console.log('  Anon Key角色:', anonDecoded.payload.role)

} catch (error) {
  console.error('JWT解码失败:', error)
}