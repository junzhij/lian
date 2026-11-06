/** 是否使用内置 mock 数据（.env.development / .env.mock 中开启） */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const API_BASE = import.meta.env.VITE_API_BASE || ''

/** 超过这个时间没有新位置，就标为“数据已过期”（PRD：60 秒） */
export const STALE_AFTER_MS = 60 * 1000

/** 线路详情页停留时自动刷新的间隔。PRD Q6 待实车验证后再定 */
export const DETAIL_POLL_MS = 5 * 1000

/** 首页刷新车辆概况的间隔 */
export const HOME_POLL_MS = 15 * 1000

export const REQUEST_TIMEOUT_MS = 8 * 1000
