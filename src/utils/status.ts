import { STALE_AFTER_MS } from '@/config'
import type { DataState, VehiclePosition } from '@/types'

export interface VehicleView {
  vehicle: VehiclePosition
  state: 'normal' | 'stale'
  ageMs: number
}

/**
 * 判断单辆车该怎么展示。
 * - 设备离线：不展示（返回 null），由页面显示“位置暂不可用”
 * - 超过 60 秒没新位置：过期，置灰
 * - 否则：正常
 */
export function classifyVehicle(v: VehiclePosition, nowServerMs: number): VehicleView | null {
  if (v.deviceStatus === 'offline') return null
  const ageMs = Math.max(0, nowServerMs - v.collectedAt)
  return { vehicle: v, ageMs, state: ageMs > STALE_AFTER_MS ? 'stale' : 'normal' }
}

/** 整条线路的综合状态：有一辆正常就算正常；全过期算过期；一辆都没有算不可用 */
export function overallState(views: VehicleView[]): DataState {
  if (views.some((v) => v.state === 'normal')) return 'normal'
  if (views.length > 0) return 'stale'
  return 'unavailable'
}

export const STATE_META: Record<DataState, { label: string; tone: string }> = {
  loading: { label: '加载中', tone: 'off' },
  normal: { label: '正常', tone: 'ok' },
  stale: { label: '数据已过期', tone: 'stale' },
  unavailable: { label: '位置暂不可用', tone: 'off' },
  error: { label: '服务异常', tone: 'err' },
  offhours: { label: '非运营时段', tone: 'off' },
}
