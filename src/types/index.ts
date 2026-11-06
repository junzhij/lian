export interface LatLng {
  latitude: number
  longitude: number
}

export interface Stop extends LatLng {
  id: string
  name: string
  /** 站点说明，如“北门岗亭旁” */
  hint?: string
}

export interface ServiceWindow {
  /** HH:mm */
  start: string
  /** HH:mm */
  end: string
}

export interface Route {
  id: string
  name: string
  /** 卡片上的短标签，如 “1” */
  code: string
  color: string
  /** active：运营中的线路；planned：规划中，只展示不能进入 */
  status: 'active' | 'planned'
  summary: string
  /** 跑完一圈大约多少分钟 */
  loopMinutes?: number
  serviceWindows: ServiceWindow[]
  stops: Stop[]
  /** 线路走向（地图折线） */
  path: LatLng[]
}

/** 设备上报的四个字段：匿名编号、坐标、采集时间、设备状态（PRD 08） */
export interface VehiclePosition extends LatLng {
  vehicleId: string
  /** 采集时间，毫秒时间戳 */
  collectedAt: number
  deviceStatus: 'online' | 'offline'
}

export interface VehicleSnapshot {
  routeId: string
  /** 服务端当前时间，用于计算“X 秒前”，避免手机时钟不准 */
  serverTime: number
  /** 当前是否处于运营时段 */
  operating: boolean
  /** 非运营时段时，下一次开始运营的时间 HH:mm */
  nextServiceAt?: string
  vehicles: VehiclePosition[]
}

export type FeedbackType = 'position' | 'stale' | 'broken' | 'route' | 'suggest' | 'other'

export interface FeedbackPayload {
  type: FeedbackType
  content: string
  images: string[]
  contact?: string
  routeId?: string
}

/**
 * 页面上展示的数据状态（PRD 06 的四种状态 + 非运营时段 + 首次加载）
 */
export type DataState = 'loading' | 'normal' | 'stale' | 'unavailable' | 'error' | 'offhours'
