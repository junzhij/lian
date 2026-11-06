import { computed, ref, type Ref } from 'vue'
import type { Route } from '@/types'

/**
 * 首页置顶线路。
 *
 * - 用户手动置顶：存在本机（uni storage），不需要登录，首页和线路详情页共用
 * - 没置顶 / 置顶的线路已停运或下线：退回到第一条运营中的线路，并标记为“默认”
 */
const KEY = 'home:pinnedRouteId'
const pinnedId = ref<string | null>((uni.getStorageSync(KEY) as string) || null)

export function pinRoute(id: string) {
  pinnedId.value = id
  uni.setStorageSync(KEY, id)
}

export function unpinRoute() {
  pinnedId.value = null
  uni.removeStorageSync(KEY)
}

export function usePinnedRoute(routes: Ref<Route[]>) {
  const active = computed(() => routes.value.filter((r) => r.status === 'active'))

  const pinned = computed(() => active.value.find((r) => r.id === pinnedId.value) ?? null)

  /** 首页顶部展示的线路 */
  const featured = computed(() => pinned.value ?? active.value[0] ?? null)

  /** true = 用户手动置顶；false = 默认（未置顶或置顶失效） */
  const isManual = computed(() => !!pinned.value)

  return { pinnedId, pinned, featured, isManual, active }
}

export const isPinned = (id: string | undefined) => !!id && pinnedId.value === id
export { pinnedId }
