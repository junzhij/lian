import { USE_MOCK } from '@/config'
import { mockApi } from '@/mock'
import type { FeedbackPayload, Route, VehicleSnapshot } from '@/types'
import { request, upload } from './http'

/**
 * 小程序用到的全部接口。dev 模式走 mockApi，正式环境走后端。
 * 接口路径是占位约定，以后端技术方案文档为准。
 */
const realApi = {
  getRoutes: () => request<Route[]>('GET', '/v1/routes'),
  getRoute: (id: string) => request<Route>('GET', `/v1/routes/${id}`),
  getVehicles: (routeId: string) => request<VehicleSnapshot>('GET', `/v1/routes/${routeId}/vehicles`),
  uploadImage: (filePath: string) => upload('/v1/feedback/images', filePath),
  submitFeedback: (payload: FeedbackPayload) => request<{ id: string }>('POST', '/v1/feedback', payload),
}

export const api: typeof realApi = USE_MOCK ? mockApi : realApi
