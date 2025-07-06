export default function TestSimplePage() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>简单测试页面</h1>
      <p>如果你能看到这个页面，说明基础路由是正常的</p>
      <p>当前时间: {new Date().toLocaleString()}</p>
    </div>
  )
}