import type { FeedbackPayload, LatLng, Route, VehicleSnapshot } from '@/types'
import { distance } from '@/utils/geo'
import { hmToMinutes } from '@/utils/time'
import { MOCK_ROUTES } from './data'
import { scenario, scenarioSince } from './scenario'

const REPORT_EVERY_MS = 5000 // 设备每 5 秒上报一次
const PIPELINE_DELAY_MS = 1800 // 采集 → 后端 → 缓存 的模拟延迟

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
const latency = () => sleep(220 + Math.random() * 380)

/** 按时间计算车辆在环线上的位置 */
function positionAt(path: LatLng[], loopMs: number, t: number): LatLng {
  const segs: number[] = []
  let total = 0
  for (let i = 0; i < path.length - 1; i++) {
    const d = distance(path[i], path[i + 1])
    segs.push(d)
    total += d
  }
  let target = ((t % loopMs) / loopMs) * total
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) {
      const k = segs[i] === 0 ? 0 : target / segs[i]
      // 每站附近“停靠”一小会儿，看起来更真实
      const eased = k < 0.12 ? 0 : (k - 0.12) / 0.88
      return {
        latitude: path[i].latitude + (path[i + 1].latitude - path[i].latitude) * eased,
        longitude: path[i].longitude + (path[i + 1].longitude - path[i].longitude) * eased,
      }
    }
    target -= segs[i]
  }
  return path[path.length - 1]
}

function inService(route: Route, now: Date) {
  const m = now.getHours() * 60 + now.getMinutes()
  return route.serviceWindows.some((w) => m >= hmToMinutes(w.start) && m < hmToMinutes(w.end))
}

function nextService(route: Route, now: Date): string | undefined {
  const m = now.getHours() * 60 + now.getMinutes()
  const next = route.serviceWindows.find((w) => hmToMinutes(w.start) > m)
  return (next ?? route.serviceWindows[0])?.start
}

function findRoute(id: string): Route {
  const r = MOCK_ROUTES.find((x) => x.id === id)
  if (!r) throw new Error('线路不存在')
  return r
}

export const mockApi = {
  async getRoutes(): Promise<Route[]> {
    await latency()
    if (scenario.value === 'error') throw new Error('服务暂不可用')
    return JSON.parse(JSON.stringify(MOCK_ROUTES))
  },

  async getRoute(id: string): Promise<Route> {
    await latency()
    if (scenario.value === 'error') throw new Error('服务暂不可用')
    return JSON.parse(JSON.stringify(findRoute(id)))
  },

  async getVehicles(routeId: string): Promise<VehicleSnapshot> {
    await latency()
    const s = scenario.value
    if (s === 'error') throw new Error('服务暂不可用')

    const route = findRoute(routeId)
    const now = Date.now()
    const base: VehicleSnapshot = { routeId, serverTime: now, operating: true, vehicles: [] }

    if (route.status !== 'active') return { ...base, operating: false }

    const operating = s === 'offhours' ? false : s === 'clock' ? inService(route, new Date(now)) : true
    if (!operating) {
      // 非运营时段后端不返回车辆，也不返回轨迹
      return { ...base, operating: false, nextServiceAt: nextService(route, new Date(now)) }
    }

    const loopMs = (route.loopMinutes ?? 18) * 60 * 1000
    let collectedAt = Math.floor((now - PIPELINE_DELAY_MS) / REPORT_EVERY_MS) * REPORT_EVERY_MS
    if (s === 'stale') collectedAt = scenarioSince.value - 62 * 1000

    return {
      ...base,
      vehicles: [
        {
          vehicleId: 'LA-01',
          ...positionAt(route.path, loopMs, collectedAt),
          collectedAt,
          deviceStatus: s === 'unavailable' ? 'offline' : 'online',
        },
      ],
    }
  },

  async uploadImage(filePath: string): Promise<string> {
    await sleep(300)
    return filePath
  },

  async submitFeedback(payload: FeedbackPayload): Promise<{ id: string }> {
    await sleep(600)
    if (scenario.value === 'error') throw new Error('服务暂不可用')
    console.info('[mock] 收到反馈', payload)
    return { id: 'FB' + Date.now().toString(36).toUpperCase() }
  },
}
