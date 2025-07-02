/**
 * 统一的PDF.js管理器
 * 解决多个组件同时加载PDF.js导致的模块初始化冲突
 */

let pdfjsLib: any = null
let pdfjsLoaded = false
let loadingPromise: Promise<any> | null = null
let workerConfigured = false

export async function getPDFJS() {
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
        const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
        workerConfigured = true
        console.log('[PDF Manager] Worker配置完成:', workerSrc)
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