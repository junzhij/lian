<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onShareAppMessage } from '@dcloudio/uni-app'
import StatusPill from '@/components/StatusPill.vue'
import MockSwitch from '@/components/MockSwitch.vue'
import { useNavLayout } from '@/composables/useNavLayout'
import { pinRoute, unpinRoute, usePinnedRoute } from '@/composables/usePinnedRoute'
import { useVehicles } from '@/composables/useVehicles'
import { HOME_POLL_MS } from '@/config'
import { api } from '@/services/api'
import type { Route } from '@/types'
import { describeNear } from '@/utils/geo'
import { formatAgo, formatHM, formatHMS } from '@/utils/time'

const nav = useNavLayout()

const routes = ref<Route[]>([])
const routesError = ref<string | null>(null)
const routesLoading = ref(true)

const { featured, isManual, pinnedId, active } = usePinnedRoute(routes)

const { views, state, serverNow, snapshot, refresh: refreshVehicles } = useVehicles(() => featured.value?.id, HOME_POLL_MS)

async function loadRoutes() {
  routesLoading.value = true
  try {
    routes.value = await api.getRoutes()
    routesError.value = null
    refreshVehicles()
  } catch (e: any) {
    routesError.value = e?.message || '加载失败'
  } finally {
    routesLoading.value = false
  }
}

onLoad(loadRoutes)
onPullDownRefresh(async () => {
  await loadRoutes()
  uni.stopPullDownRefresh()
})
onShareAppMessage(() => ({ title: '校园摆渡车实时位置', path: '/pages/index/index' }))

/* ---------- 问候 ---------- */
const greeting = computed(() => {
  const h = new Date(serverNow.value).getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 13) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const subline = computed(() => {
  const t = `现在 ${formatHM(serverNow.value)}`
  if (state.value === 'offhours') return `${t} · 非运营时段`
  if (state.value === 'normal' || state.value === 'stale' || state.value === 'unavailable') return `${t} · 运营中`
  return t
})

/* ---------- 置顶卡片 ---------- */
const lead = computed(() => views.value[0])

const headline = computed(() => {
  const r = featured.value
  switch (state.value) {
    case 'normal':
    case 'stale':
      return lead.value && r ? describeNear(lead.value.vehicle, r.stops) : ''
    case 'unavailable':
      return '位置暂不可用'
    case 'offhours':
      return '当前非运营时段'
    case 'error':
      return '暂时无法获取车辆信息'
    default:
      return '正在获取车辆位置…'
  }
})

const detail = computed(() => {
  switch (state.value) {
    case 'normal':
      return lead.value ? `${lead.value.vehicle.vehicleId} · ${formatAgo(lead.value.ageMs)}更新` : ''
    case 'stale':
      return lead.value ? `${lead.value.vehicle.vehicleId} · 数据已过期，最后更新于 ${formatHMS(lead.value.vehicle.collectedAt)}` : ''
    case 'unavailable':
      return '定位设备暂时离线，线路和站点照常可看'
    case 'offhours':
      return snapshot.value?.nextServiceAt ? `下一班次 ${snapshot.value.nextServiceAt} 开始` : '请留意服务时段'
    case 'error':
      return '轻点重试，或稍后再来看看'
    default:
      return ''
  }
})

/* ---------- 置顶操作 ---------- */
function togglePin(r: Route) {
  if (pinnedId.value === r.id) {
    unpinRoute()
    uni.showToast({ title: '已取消置顶', icon: 'none' })
  } else {
    pinRoute(r.id)
    uni.showToast({ title: `已置顶 ${r.code}`, icon: 'none' })
  }
}

function changePin() {
  const options = active.value.slice(0, isManual.value ? 5 : 6)
  const items = options.map((r) => `${r.id === featured.value?.id ? '✓ ' : ''}${r.code} · ${r.name}`)
  if (isManual.value) items.push('取消置顶')
  uni.showActionSheet({
    itemList: items,
    success: ({ tapIndex }) => {
      if (tapIndex < options.length) pinRoute(options[tapIndex].id)
      else unpinRoute()
    },
  })
}

/* ---------- 导航 ---------- */
function openRoute(r: Route) {
  if (r.status !== 'active') return uni.showToast({ title: '该线路还未开通', icon: 'none' })
  uni.navigateTo({ url: `/pages/route/detail?id=${r.id}` })
}

function onFeaturedTap() {
  if (routesError.value) return loadRoutes()
  if (state.value === 'error') return refreshVehicles()
  if (featured.value) openRoute(featured.value)
}

const go = (url: string) => uni.navigateTo({ url })
const hours = (r: Route) => r.serviceWindows.map((w) => `${w.start}–${w.end}`).join(' · ')
</script>

<template>
  <view class="page" :style="{ paddingTop: nav.statusBar + 'px' }">
    <view class="nav" :style="{ height: nav.navHeight + 'px', paddingRight: nav.capsuleWidth + 'px' }">
      <text class="wordmark">智汇黎安<text class="plus">+</text></text>
    </view>

    <view class="greet">
      <text class="greet-title">{{ greeting }}</text>
      <text class="greet-sub num">{{ subline }}</text>
    </view>

    <!-- 置顶 -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">{{ isManual ? '置顶线路' : '默认线路' }}</text>
        <text v-if="active.length > 1" class="section-action" hover-class="tap-active" @tap="changePin">更换</text>
      </view>

      <view v-if="routesError" class="card featured" hover-class="card-hover" @tap="loadRoutes">
        <StatusPill state="error" size="sm" />
        <text class="headline headline--err">服务异常</text>
        <text class="detail">{{ routesError }}，暂时无法获取线路信息。轻点重试。</text>
      </view>

      <view v-else-if="featured" class="card featured" hover-class="card-hover" @tap="onFeaturedTap">
        <view class="featured-top">
          <view class="code" :style="{ background: featured.color }"><text>{{ featured.code }}</text></view>
          <text class="featured-name">{{ featured.name }}</text>
          <StatusPill :state="state" size="sm" />
        </view>
        <text :class="['headline', `headline--${state}`]">{{ headline }}</text>
        <text class="detail num">{{ detail }}</text>
        <view class="featured-foot">
          <text>{{ state === 'error' ? '重试' : '查看地图与站点' }}</text>
          <text class="arrow">→</text>
        </view>
      </view>

      <view v-else-if="routesLoading" class="card featured">
        <view class="sk sk--a" />
        <view class="sk sk--b" />
        <view class="sk sk--c" />
      </view>

      <text v-if="featured && !isManual && active.length > 1" class="pin-hint">点线路右侧的 ☆ 可以把常坐的线路置顶</text>
    </view>

    <!-- 全部线路 -->
    <view v-if="routes.length" class="section">
      <view class="section-head"><text class="section-title">全部线路</text></view>
      <view class="card list">
        <view
          v-for="r in routes"
          :key="r.id"
          :class="['row', { 'row--planned': r.status !== 'active' }]"
          hover-class="row-hover"
          @tap="openRoute(r)"
        >
          <view class="code" :style="{ background: r.status === 'active' ? r.color : '#c9c4b8' }"><text>{{ r.code }}</text></view>
          <view class="row-body">
            <view class="row-top">
              <text class="row-name">{{ r.name }}</text>
              <text v-if="r.status !== 'active'" class="tag">即将开通</text>
            </view>
            <text class="row-sum">{{ r.summary }}</text>
            <text v-if="r.status === 'active'" class="row-hours num">{{ hours(r) }}</text>
          </view>
          <view
            v-if="r.status === 'active'"
            :class="['pin', { 'pin--on': pinnedId === r.id }]"
            hover-class="tap-active"
            :aria-label="pinnedId === r.id ? '取消置顶' : '置顶'"
            @tap.stop="togglePin(r)"
          >
            <text>{{ pinnedId === r.id ? '★' : '☆' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 服务 -->
    <view class="section">
      <view class="section-head"><text class="section-title">服务</text></view>
      <view class="card list">
        <view class="row row--link" hover-class="row-hover" @tap="go('/pages/feedback/index')">
          <view class="row-body">
            <text class="row-name">意见反馈</text>
            <text class="row-sum">位置不准、页面打不开，告诉我们</text>
          </view>
          <text class="chev">›</text>
        </view>
        <view class="row row--link" hover-class="row-hover" @tap="go('/pages/about/index')">
          <view class="row-body">
            <text class="row-name">服务说明</text>
            <text class="row-sum">服务时段、数据状态与隐私</text>
          </view>
          <text class="chev">›</text>
        </view>
      </view>
    </view>

    <view class="note">
      <text>位置超过 60 秒未更新会标为「数据已过期」</text>
      <text>查车不会获取你的位置</text>
    </view>

    <MockSwitch :bottom="24 + nav.safeBottom" @change="loadRoutes" />
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding-left: 32rpx;
  padding-right: 32rpx;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.nav { display: flex; align-items: center; }
.wordmark { font-family: $serif; font-size: 34rpx; font-weight: 700; letter-spacing: 1rpx; }
.plus { color: $brand; }

.greet { padding: 48rpx 0 16rpx; display: flex; flex-direction: column; gap: 8rpx; }
.greet-title { font-family: $serif; font-size: 64rpx; font-weight: 600; line-height: 1.2; letter-spacing: 1rpx; }
.greet-sub { font-size: 26rpx; color: $ink-3; }

/* ---------- section ---------- */
.section { margin-top: 48rpx; }
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 8rpx 16rpx;
}
.section-title { font-size: 24rpx; font-weight: 600; color: $ink-3; letter-spacing: 2rpx; }
.section-action { font-size: 26rpx; font-weight: 600; color: $brand; padding: 8rpx 0 8rpx 24rpx; }

.card {
  background: $surface;
  border: $hairline;
  border-radius: $radius-lg;
  box-shadow: $shadow;
}
.card-hover { background: #f8f6f1; }

/* ---------- 置顶卡片 ---------- */
.featured { padding: 32rpx; display: flex; flex-direction: column; align-items: flex-start; }
.featured-top { width: 100%; display: flex; align-items: center; gap: 16rpx; }
.featured-name { flex: 1; font-size: 28rpx; font-weight: 600; color: $ink-2; }

.code {
  min-width: 60rpx;
  height: 60rpx;
  padding: 0 12rpx;
  border-radius: 16rpx;
  color: #fff;
  font-weight: 700;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.headline {
  margin-top: 36rpx;
  font-family: $serif;
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.35;
}
.headline--stale { color: $stale; }
.headline--err, .headline--error { color: $err; }
.headline--unavailable, .headline--offhours, .headline--loading { color: $off; }
.detail { margin-top: 12rpx; font-size: 26rpx; color: $ink-3; line-height: 1.6; }

.featured-foot {
  width: 100%;
  margin-top: 32rpx;
  padding-top: 24rpx;
  border-top: $hairline;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 26rpx;
  font-weight: 600;
  color: $brand;
}
.arrow { font-size: 30rpx; }

.pin-hint { display: block; margin-top: 16rpx; padding: 0 8rpx; font-size: 22rpx; color: $ink-3; }

.sk { border-radius: 12rpx; background: linear-gradient(90deg, $sunken, #f5f2ec, $sunken); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
.featured .sk + .sk { margin-top: 20rpx; }
.sk--a { height: 60rpx; width: 50%; }
.sk--b { height: 56rpx; width: 85%; }
.sk--c { height: 32rpx; width: 40%; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* ---------- 列表 ---------- */
.list { padding: 0 28rpx; overflow: hidden; }
.row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx 0;
  border-bottom: $hairline;
}
.row:last-child { border-bottom: none; }
.row-hover { opacity: 0.7; }
.row--planned .row-name { color: $ink-3; }
.row-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4rpx; }
.row-top { display: flex; align-items: center; gap: 12rpx; }
.row-name { font-size: 30rpx; font-weight: 600; }
.row-sum { font-size: 24rpx; color: $ink-3; }
.row-hours { font-size: 22rpx; color: $ink-2; margin-top: 4rpx; }
.tag { font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 999rpx; background: $sunken; color: $ink-2; }

.pin {
  width: 72rpx;
  height: 72rpx;
  margin-right: -12rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #a8a295;
}
.pin--on { color: $brand; }
.chev { font-size: 40rpx; color: #b3ada1; }

.note {
  margin-top: 56rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  font-size: 22rpx;
  color: $ink-3;
}
</style>
