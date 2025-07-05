/**
 * 简化版PDF.js管理器 - 用于解决TT函数错误
 * 使用更保守的配置策略
 */

let pdfjsLib: any = null
let pdfjsLoaded = false
let loadingPromise: Promise<any> | null = null

export async function getSimplePDFJS() {
  console.log('[Simple PDF Manager] 请求简化版PDF.js实例')
  
  // 确保在客户端环境中运行
  if (typeof window === 'undefined') {
    throw new Error('[Simple PDF Manager] PDF.js 只能在客户端环境中使用')
  }
  
  // 如果已经加载完成，直接返回
  if (pdfjsLib && pdfjsLoaded) {
    console.log('[Simple PDF Manager] 返回已缓存的PDF.js实例')
    return pdfjsLib
  }
  
  // 如果正在加载，等待完成
  if (loadingPromise) {
    console.log('[Simple PDF Manager] 等待正在进行的PDF.js加载')
    return loadingPromise
  }
  
  // 开始新的加载过程
  console.log('[Simple PDF Manager] 开始加载简化版PDF.js')
  loadingPromise = (async () => {
    try {
      const pdfjs = await import('pdfjs-dist')
      console.log('[Simple PDF Manager] PDF.js模块加载成功，版本:', pdfjs.version)
      
      // 使用最简单的配置 - 不使用worker，在主线程中运行
      console.log('[Simple PDF Manager] 配置为主线程模式（无Worker）')
      pdfjs.GlobalWorkerOptions.workerSrc = ''
      
      // 或者使用内联worker代码
      const inlineWorkerCode = `
        // 简化的PDF.js worker代码
        self.onmessage = function(e) {
          // 基本的worker响应
          self.postMessage({
            type: 'ready'
          });
        };
      `
      
      try {
        const workerBlob = new Blob([inlineWorkerCode], { type: 'application/javascript' })
        const workerUrl = URL.createObjectURL(workerBlob)
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
        console.log('[Simple PDF Manager] 使用内联Worker代码')
      } catch (inlineError) {
        console.warn('[Simple PDF Manager] 内联Worker失败，使用主线程模式:', inlineError)
        pdfjs.GlobalWorkerOptions.workerSrc = ''
      }
      
      pdfjsLib = pdfjs
      pdfjsLoaded = true
      console.log('[Simple PDF Manager] 简化版PDF.js初始化完成')
      
      return pdfjs
    } catch (error) {
      console.error('[Simple PDF Manager] PDF.js加载失败:', error)
      // 重置状态，允许重试
      loadingPromise = null
      throw error
    }
  })()
  
  return loadingPromise
}

/**
 * 重置简化版PDF.js状态
 */
export function resetSimplePDFJS() {
  console.log('[Simple PDF Manager] 重置简化版PDF.js状态')
  pdfjsLib = null
  pdfjsLoaded = false
  loadingPromise = null
}

/**
 * 获取简化版PDF.js状态
 */
export function getSimplePDFJSStatus() {
  return {
    loaded: pdfjsLoaded,
    instance: pdfjsLib !== null,
    loading: loadingPromise !== null,
    version: pdfjsLib?.version || 'unknown',
    workerSrc: pdfjsLib?.GlobalWorkerOptions?.workerSrc || 'unknown',
    mode: 'simple'
  }
}