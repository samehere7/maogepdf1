/**
 * 统一的PDF.js管理器
 * 解决多个组件同时加载PDF.js导致的模块初始化冲突
 */

let pdfjsLib: any = null
let pdfjsLoaded = false
let loadingPromise: Promise<any> | null = null
let workerConfigured = false

export async function getPDFJS() {
  // 确保在客户端环境中运行
  if (typeof window === 'undefined') {
    throw new Error('[PDF Manager] PDF.js 只能在客户端环境中使用')
  }
  
  console.log('[PDF Manager] 请求PDF.js实例，当前状态:', { pdfjsLoaded, workerConfigured })
  
  // 如果已经加载完成，直接返回
  if (pdfjsLib && pdfjsLoaded) {
    console.log('[PDF Manager] 返回已缓存的PDF.js实例')
    return pdfjsLib
  }
  
  // 如果正在加载，等待完成
  if (loadingPromise) {
    console.log('[PDF Manager] 等待正在进行的PDF.js加载')
    return loadingPromise
  }
  
  // 开始新的加载过程
  console.log('[PDF Manager] 开始加载PDF.js')
  loadingPromise = (async () => {
    try {
      const pdfjs = await import('pdfjs-dist')
      console.log('[PDF Manager] PDF.js模块加载成功，版本:', pdfjs.version)
      
      // 只配置一次Worker，避免重复配置导致冲突
      if (!workerConfigured) {
        try {
          // 尝试多种worker源，提高兼容性
          const workerSources = [
            `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
            `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
            // 备用固定版本
            'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
          ]
          
          const workerSrc = workerSources[0] // 优先使用jsdelivr CDN
          
          // 添加worker加载验证
          console.log('[PDF Manager] 开始配置Worker:', workerSrc)
          
          // 设置GlobalWorkerOptions，包含错误处理
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
          
          // 测试worker是否可以正常工作
          const testDoc = await pdfjs.getDocument({ data: new Uint8Array([]) }).promise
            .catch((error) => {
              console.warn('[PDF Manager] Worker测试失败，尝试备用源:', error.message)
              // 如果第一个源失败，尝试第二个
              pdfjs.GlobalWorkerOptions.workerSrc = workerSources[1]
              console.log('[PDF Manager] 切换到备用Worker源:', workerSources[1])
              return null
            })
          
          workerConfigured = true
          console.log('[PDF Manager] Worker配置完成:', workerSrc)
          console.log('[PDF Manager] 备用worker源:', workerSources.slice(1))
        } catch (workerError) {
          console.error('[PDF Manager] Worker配置失败:', workerError)
          // 仍然标记为已配置，避免重复尝试
          workerConfigured = true
        }
      } else {
        console.log('[PDF Manager] Worker已配置，跳过重复配置')
      }
      
      pdfjsLib = pdfjs
      pdfjsLoaded = true
      console.log('[PDF Manager] PDF.js初始化完成')
      
      return pdfjs
    } catch (error) {
      console.error('[PDF Manager] PDF.js加载失败:', error)
      // 重置状态，允许重试
      loadingPromise = null
      throw error
    }
  })()
  
  return loadingPromise
}

/**
 * 重置PDF.js状态（用于错误恢复）
 */
export function resetPDFJS() {
  console.log('[PDF Manager] 重置PDF.js状态')
  pdfjsLib = null
  pdfjsLoaded = false
  loadingPromise = null
  workerConfigured = false
}

/**
 * 检查PDF.js是否已就绪
 */
export function isPDFJSReady(): boolean {
  return pdfjsLoaded && pdfjsLib !== null
}

/**
 * 获取PDF.js状态信息
 */
export function getPDFJSStatus() {
  return {
    loaded: pdfjsLoaded,
    workerConfigured,
    instance: pdfjsLib !== null,
    loading: loadingPromise !== null
  }
}