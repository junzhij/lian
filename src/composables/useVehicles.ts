import { computed, ref, watch } from 'vue'
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { api } from '@/services/api'
import type { DataState, VehicleSnapshot } from '@/types'
import { classifyVehicle, overallState, type VehicleView } from '@/utils/status'

/**
 * 页面可见时轮询车辆位置，隐藏时停止；从后台回来立刻重新拉取。
 *
 * 规则（PRD 06）：
 * - 请求失败 → “服务异常”，同时清空车辆，绝不把旧位置当实时位置
 * - 超过 60 秒没新位置 → 每秒重新判断，到点自动变成“数据已过期”
 * - 设备离线 → 隐藏车辆，“位置暂不可用”
 */
export function useVehicles(getRouteId: () => string | undefined, intervalMs: number) {
  const snapshot = ref<VehicleSnapshot | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const lastFetchOk = ref(0)

  // 收到快照时的本地时间，用来把 serverTime 往前推，得到“现在的服务器时间”
  let receivedAtLocal = 0
  const tick = ref(Date.now())

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let tickTimer: ReturnType<typeof setInterval> | null = null
  let generation = 0
  let inflight = false

  const serverNow = computed(() => {
    if (!snapshot.value) return tick.value
    return snapshot.value.serverTime + (tick.value - receivedAtLocal)
  })

  const views = computed<VehicleView[]>(() => {
    const s = snapshot.value
    // 快照必须属于当前线路：切换线路时绝不显示上一条线路的车
    if (!s || !s.operating || s.routeId !== getRouteId()) return []
    return s.vehicles.map((v) => classifyVehicle(v, serverNow.value)).filter((v): v is VehicleView => !!v)
  })

  const state = computed<DataState>(() => {
    if (error.value) return 'error'
    if (!snapshot.value || snapshot.value.routeId !== getRouteId()) return 'loading'
    if (!snapshot.value.operating) return 'offhours'
    return overallState(views.value)
  })

  async function refresh() {
    const id = getRouteId()
    if (!id || inflight) return
    inflight = true
    loading.value = true
    const gen = generation
    try {
      const snap = await api.getVehicles(id)
      if (gen !== generation) return
      snapshot.value = snap
      receivedAtLocal = Date.now()
      tick.value = receivedAtLocal
      error.value = null
      lastFetchOk.value = receivedAtLocal
    } catch (e: any) {
      if (gen !== generation) return
      snapshot.value = null
      error.value = e?.message || '服务暂不可用'
    } finally {
      inflight = false
      loading.value = false
    }
  }

  function start() {
    stop()
    generation++
    refresh()
    pollTimer = setInterval(refresh, intervalMs)
    tickTimer = setInterval(() => (tick.value = Date.now()), 1000)
  }

  function stop() {
    generation++
    inflight = false
    if (pollTimer) clearInterval(pollTimer)
    if (tickTimer) clearInterval(tickTimer)
    pollTimer = tickTimer = null
  }

  const onNet = (res: { isConnected: boolean }) => {
    if (!res.isConnected) {
      snapshot.value = null
      error.value = '网络已断开'
    } else if (pollTimer) {
      refresh()
    }
  }

  // 线路变了（例如首页换了置顶）：清掉旧数据，作废在途请求，立即拉新线路
  watch(getRouteId, (id, old) => {
    if (id === old) return
    snapshot.value = null
    error.value = null
    if (pollTimer) start()
  })

  onShow(() => {
    uni.onNetworkStatusChange(onNet)
    start()
  })
  onHide(() => {
    uni.offNetworkStatusChange(onNet)
    stop()
  })
  onUnload(() => {
    uni.offNetworkStatusChange(onNet)
    stop()
  })

  return { snapshot, views, state, error, loading, serverNow, refresh, start, stop }
}
