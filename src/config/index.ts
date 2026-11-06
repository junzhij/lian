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

/* ---------- 地图初始视野（.env 中的 VITE_MAP_CENTER / VITE_MAP_SCALE） ---------- */

const FALLBACK_CENTER = { latitude: 18.4145, longitude: 110.0457 }

function parseCenter(raw: string | undefined) {
  const [lng, lat] = (raw || '').split(/[,，\s]+/).map(Number)
  const ok = Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  if (!ok) {
    console.warn(`[config] VITE_MAP_CENTER="${raw}" 格式不对，应为“经度,纬度”，已使用默认值`)
    return FALLBACK_CENTER
  }
  return { latitude: lat, longitude: lng }
}

function parseScale(raw: string | undefined) {
  const n = Number(raw)
  return Number.isFinite(n) && n >= 3 && n <= 20 ? n : 16
}

/** 地图打开时的中心点（学校） */
export const MAP_CENTER = parseCenter(import.meta.env.VITE_MAP_CENTER)

/** 地图打开时的缩放级别 */
export const MAP_SCALE = parseScale(import.meta.env.VITE_MAP_SCALE)
