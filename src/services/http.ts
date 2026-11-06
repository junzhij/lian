import { API_BASE, REQUEST_TIMEOUT_MS } from '@/config'

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
  }
}

/** 约定后端返回 { code: 0, data, message } */
export function request<T>(method: 'GET' | 'POST', path: string, data?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: API_BASE + path,
      method,
      data: data as any,
      timeout: REQUEST_TIMEOUT_MS,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        const body = res.data as { code?: number; data?: T; message?: string }
        if (res.statusCode >= 200 && res.statusCode < 300 && body && body.code === 0) {
          resolve(body.data as T)
        } else {
          reject(new ApiError(body?.message || `请求失败（${res.statusCode}）`, res.statusCode))
        }
      },
      fail: (err) => reject(new ApiError(err.errMsg?.includes('timeout') ? '网络超时' : '网络连接失败')),
    })
  })
}

export function upload(path: string, filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: API_BASE + path,
      filePath,
      name: 'file',
      success: (res) => {
        try {
          const body = JSON.parse(res.data)
          if (body.code === 0) return resolve(body.data.url)
          reject(new ApiError(body.message || '上传失败'))
        } catch {
          reject(new ApiError('上传失败'))
        }
      },
      fail: () => reject(new ApiError('上传失败')),
    })
  })
}
