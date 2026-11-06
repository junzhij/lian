/** 正式构建时替代 src/mock/index.ts（见 vite.config.ts），不包含任何模拟数据 */
const off = () => Promise.reject(new Error('mock 已关闭'))

export const mockApi = {
  getRoutes: off,
  getRoute: off,
  getVehicles: off,
  uploadImage: off,
  submitFeedback: off,
}
