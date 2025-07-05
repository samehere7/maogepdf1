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
          // 使用更稳定的worker配置策略
          console.log('[PDF Manager] 开始配置Worker...')
          
          // 方案1：尝试使用本地worker（通过import）
          try {
            // 动态导入worker
            const workerBlob = new Blob([`
              importScripts('https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js');
            `], { type: 'application/javascript' })
            
            const workerUrl = URL.createObjectURL(workerBlob)
            pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
            console.log('[PDF Manager] 使用Blob Worker URL配置完成')
          } catch (blobError) {
            console.warn('[PDF Manager] Blob Worker配置失败，使用直接CDN:', blobError)
            
            // 方案2：使用固定版本的稳定CDN
            const stableWorkerSources = [
              // 使用固定的稳定版本，避免版本不匹配
              'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
              'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
              // Mozilla官方CDN
              'https://mozilla.github.io/pdf.js/build/pdf.worker.js'
            ]
            
            const workerSrc = stableWorkerSources[0]
            pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
            console.log('[PDF Manager] 使用稳定版本Worker:', workerSrc)
            console.log('[PDF Manager] 备用源:', stableWorkerSources.slice(1))
          }
          
          workerConfigured = true
          console.log('[PDF Manager] Worker配置完成，当前源:', pdfjs.GlobalWorkerOptions.workerSrc)
        } catch (workerError) {
          console.error('[PDF Manager] Worker配置失败:', workerError)
          
          // 最后的备用方案：禁用worker，使用主线程
          try {
            pdfjs.GlobalWorkerOptions.workerSrc = ''
            console.warn('[PDF Manager] 禁用Worker，使用主线程模式')
          } catch (fallbackError) {
            console.error('[PDF Manager] 备用方案也失败:', fallbackError)
          }
          
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
    loading: loadingPromise !== null,
    version: pdfjsLib?.version || 'unknown',
    workerSrc: pdfjsLib?.GlobalWorkerOptions?.workerSrc || 'unknown'
  }
}

// 将状态函数暴露到全局对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).getPDFJSStatus = getPDFJSStatus
  console.log('🔧 [PDF Manager] 调试函数已暴露到 window.getPDFJSStatus()')
}