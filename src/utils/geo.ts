import type { LatLng, Stop } from '@/types'

const R = 6371000

/** 两点间距离（米） */
export function distance(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function nearestStop(p: LatLng, stops: Stop[]): { stop: Stop; meters: number } | null {
  let best: { stop: Stop; meters: number } | null = null
  for (const stop of stops) {
    const meters = distance(p, stop)
    if (!best || meters < best.meters) best = { stop, meters }
  }
  return best
}

/** “靠近 图书馆” / “图书馆 附近 300 米” */
export function describeNear(p: LatLng, stops: Stop[]): string {
  const near = nearestStop(p, stops)
  if (!near) return ''
  if (near.meters < 80) return `已到 ${near.stop.name}`
  if (near.meters < 400) return `靠近 ${near.stop.name}`
  return `距 ${near.stop.name} 约 ${Math.round(near.meters / 50) * 50} 米`
}
