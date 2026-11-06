<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import StatusPill from '@/components/StatusPill.vue'
import MockSwitch from '@/components/MockSwitch.vue'
import { useNavLayout } from '@/composables/useNavLayout'
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

const primary = computed(() => routes.value.find((r) => r.status === 'active'))

const { views, state, serverNow, snapshot, refresh: refreshVehicles } = useVehicles(() => primary.value?.id, HOME_POLL_MS)

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

const greeting = computed(() => {
  const h = new Date(serverNow.value).getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 13) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const clock = computed(() => formatHM(serverNow.value))

const lead = computed(() => views.value[0])

const liveLine = computed(() => {
  const r = primary.value
  switch (state.value) {
    case 'normal':
    case 'stale':
      return lead.value && r ? `${lead.value.vehicle.vehicleId} · ${describeNear(lead.value.vehicle, r.stops)}` : ''
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

const liveSub = computed(() => {
  switch (state.value) {
    case 'normal':
      return lead.value ? `${formatAgo(lead.value.ageMs)}更新` : ''
    case 'stale':
      return lead.value ? `最后更新于 ${formatHMS(lead.value.vehicle.collectedAt)}` : ''
    case 'unavailable':
      return '定位设备暂时离线，线路和站点照常可看'
    case 'offhours':
      return snapshot.value?.nextServiceAt ? `下一班次 ${snapshot.value.nextServiceAt} 开始` : '请留意服务时段'
    case 'error':
      return '点此重试，或稍后再来看看'
    default:
      return ''
  }
})

const serviceText = computed(() => {
  if (state.value === 'offhours') return '非运营时段'
  if (state.value === 'loading' || state.value === 'error') return '服务时段'
  return '运营中'
})

function openRoute(r: Route) {
  if (r.status !== 'active') {
    uni.showToast({ title: '该线路还未开通', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/route/detail?id=${r.id}` })
}

function onLiveTap() {
  if (state.value === 'error') {
    if (routesError.value) loadRoutes()
    else refreshVehicles()
    return
  }
  if (primary.value) openRoute(primary.value)
}

const go = (url: string) => uni.navigateTo({ url })
</script>

<template>
  <view class="page">
    <!-- Hero -->
    <view class="hero" :style="{ paddingTop: nav.statusBar + 'px' }">
      <view class="glow glow--a" />
      <view class="glow glow--b" />
      <view class="nav" :style="{ height: nav.navHeight + 'px', paddingRight: nav.capsuleWidth + 'px' }">
        <view class="brand">
          <view class="mark"><text>黎</text></view>
          <text class="brand-name">智汇黎安<text class="plus">+</text></text>
        </view>
      </view>

      <view class="hero-body">
        <text class="eyebrow">{{ greeting }} · 校园摆渡车</text>
        <text class="headline">车在哪，\n出门前就知道。</text>
        <view class="clock-row">
          <text class="clock num">{{ clock }}</text>
          <view class="svc">
            <view :class="['svc-dot', state === 'offhours' ? 'svc-dot--off' : '']" />
            <text>{{ serviceText }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 实时卡片 -->
    <view class="content">
      <view v-if="routesError" class="card err-card">
        <text class="err-title">服务异常</text>
        <text class="err-desc">{{ routesError }}，暂时无法获取线路信息。</text>
        <view class="btn btn--dark" hover-class="tap-active" @tap="loadRoutes"><text>重新加载</text></view>
      </view>

      <view v-else-if="primary" class="card live tap" hover-class="tap-active" @tap="onLiveTap">
        <view class="live-head">
          <view class="code" :style="{ background: primary.color }"><text>{{ primary.code }}</text></view>
          <view class="live-title">
            <text class="live-name">{{ primary.name }}</text>
            <text class="live-meta">{{ primary.stops.length }} 站 · 约 {{ primary.loopMinutes }} 分钟一圈</text>
          </view>
          <StatusPill :state="state" size="sm" />
        </view>

        <view :class="['live-main', `live-main--${state}`]">
          <text class="live-line">{{ liveLine }}</text>
          <text class="live-sub num">{{ liveSub }}</text>
        </view>

        <view class="live-foot">
          <text class="hint">{{ state === 'error' ? '轻点重试' : '查看地图与站点' }}</text>
          <view class="arrow"><text>→</text></view>
        </view>
      </view>

      <view v-else-if="routesLoading" class="card live skeleton">
        <view class="sk sk--a" />
        <view class="sk sk--b" />
        <view class="sk sk--c" />
      </view>

      <!-- 全部线路 -->
      <view v-if="routes.length" class="section">
        <text class="section-title">全部线路</text>
        <view
          v-for="r in routes"
          :key="r.id"
          :class="['card', 'route', { 'route--planned': r.status !== 'active' }]"
          hover-class="tap-active"
          @tap="openRoute(r)"
        >
          <view class="code code--lg" :style="{ background: r.status === 'active' ? r.color : '#c9d3d0' }">
            <text>{{ r.code }}</text>
          </view>
          <view class="route-body">
            <view class="route-top">
              <text class="route-name">{{ r.name }}</text>
              <text v-if="r.status !== 'active'" class="tag-soon">即将开通</text>
            </view>
            <text class="route-sum">{{ r.summary }}</text>
            <text v-if="r.status === 'active'" class="route-hours num">
              {{ r.serviceWindows.map((w) => `${w.start}–${w.end}`).join('  ·  ') }}
            </text>
          </view>
          <text v-if="r.status === 'active'" class="chev">›</text>
        </view>
      </view>

      <!-- 服务入口 -->
      <view class="section">
        <text class="section-title">服务</text>
        <view class="tiles">
          <view class="tile tile--mint" hover-class="tap-active" @tap="go('/pages/feedback/index')">
            <view class="tile-icon"><text>✎</text></view>
            <text class="tile-name">意见反馈</text>
            <text class="tile-desc">位置不准、页面问题，告诉我们</text>
          </view>
          <view class="tile tile--ink" hover-class="tap-active" @tap="go('/pages/about/index')">
            <view class="tile-icon tile-icon--light"><text>i</text></view>
            <text class="tile-name">服务说明</text>
            <text class="tile-desc">服务时段、数据与隐私</text>
          </view>
        </view>
      </view>

      <view class="note">
        <text>位置超过 60 秒未更新会标为「数据已过期」</text>
        <text>查车不会获取你的位置</text>
      </view>
    </view>

    <MockSwitch :bottom="24 + nav.safeBottom" @change="loadRoutes" />
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

/* ---------- hero ---------- */
.hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #0b1f1c 0%, #0d332c 55%, #0e5246 100%);
  color: #fff;
  padding-bottom: 120rpx;
}
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.55;
}
.glow--a { width: 520rpx; height: 520rpx; right: -180rpx; top: -120rpx; background: #13a88f; }
.glow--b { width: 360rpx; height: 360rpx; left: -140rpx; bottom: -120rpx; background: #c8f169; opacity: 0.18; }

.nav {
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 32rpx;
}
.brand { display: flex; align-items: center; gap: 14rpx; }
.mark {
  width: 52rpx;
  height: 52rpx;
  border-radius: 16rpx;
  background: $lime;
  color: $ink;
  font-weight: 900;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-name { font-size: 32rpx; font-weight: 800; letter-spacing: 1rpx; }
.plus { color: $lime; }

.hero-body {
  position: relative;
  padding: 40rpx 40rpx 0;
  display: flex;
  flex-direction: column;
}
.eyebrow {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.64);
  letter-spacing: 2rpx;
}
.headline {
  margin-top: 16rpx;
  font-size: 60rpx;
  line-height: 1.22;
  font-weight: 800;
  letter-spacing: -1rpx;
  white-space: pre-line;
}
.clock-row {
  margin-top: 36rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.clock { font-size: 44rpx; font-weight: 700; }
.svc {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
}
.svc-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: $lime; }
.svc-dot--off { background: #94a3b8; }

/* ---------- content ---------- */
.content {
  position: relative;
  margin-top: -84rpx;
  padding: 0 28rpx;
}
.card {
  background: $surface;
  border-radius: $radius-lg;
  box-shadow: $shadow;
}

.live { padding: 32rpx; box-shadow: $shadow-lg; }
.live-head { display: flex; align-items: center; gap: 20rpx; }
.code {
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
  color: #fff;
  font-weight: 800;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.code--lg { width: 84rpx; height: 84rpx; border-radius: 26rpx; font-size: 36rpx; }
.live-title { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.live-name { font-size: 32rpx; font-weight: 700; }
.live-meta { font-size: 22rpx; color: $ink-3; }

.live-main {
  margin-top: 28rpx;
  padding: 28rpx;
  border-radius: $radius;
  background: $bg;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.live-line { font-size: 38rpx; font-weight: 800; letter-spacing: -0.5rpx; }
.live-sub { font-size: 24rpx; color: $ink-2; }
.live-main--normal { background: linear-gradient(135deg, #e7f6ec, #f2faf5); }
.live-main--stale { background: $stale-soft; .live-line { color: $stale; } }
.live-main--error { background: $err-soft; .live-line { color: $err; } }
.live-main--unavailable, .live-main--offhours { .live-line { color: $off; } }

.live-foot {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hint { font-size: 24rpx; color: $ink-3; }
.arrow {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: $ink;
  color: $lime;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skeleton { display: flex; flex-direction: column; gap: 20rpx; }
.sk { border-radius: 16rpx; background: linear-gradient(90deg, #edf1ef, #f6f8f7, #edf1ef); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
.sk--a { height: 64rpx; width: 60%; }
.sk--b { height: 150rpx; }
.sk--c { height: 40rpx; width: 40%; }
@keyframes shimmer { to { background-position: -200% 0; } }

.err-card { padding: 40rpx 32rpx; display: flex; flex-direction: column; gap: 12rpx; box-shadow: $shadow-lg; }
.err-title { font-size: 34rpx; font-weight: 800; color: $err; }
.err-desc { font-size: 26rpx; color: $ink-2; }

.btn {
  margin-top: 16rpx;
  height: 84rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 28rpx;
}
.btn--dark { background: $ink; color: #fff; }

/* ---------- sections ---------- */
.section { margin-top: 48rpx; }
.section-title {
  display: block;
  padding: 0 8rpx 20rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: $ink-3;
  letter-spacing: 2rpx;
}

.route {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}
.route--planned { box-shadow: none; background: rgba(255, 255, 255, 0.6); }
.route-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4rpx; }
.route-top { display: flex; align-items: center; gap: 12rpx; }
.route-name { font-size: 30rpx; font-weight: 700; }
.route--planned .route-name { color: $ink-3; }
.route-sum { font-size: 24rpx; color: $ink-3; }
.route-hours { font-size: 22rpx; color: $brand; font-weight: 600; margin-top: 4rpx; }
.tag-soon {
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
  background: #ece8fb;
  color: #5b3fc4;
  font-weight: 600;
}
.chev { font-size: 44rpx; color: #b6c2bf; }

.tiles { display: flex; gap: 20rpx; }
.tile {
  flex: 1;
  padding: 28rpx;
  border-radius: $radius-lg;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-height: 240rpx;
}
.tile--mint { background: $brand-soft; }
.tile--ink { background: $ink; color: #fff; .tile-desc { color: rgba(255, 255, 255, 0.64); } }
.tile-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 20rpx;
  background: $brand;
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
}
.tile-icon--light { background: $lime; color: $ink; font-style: italic; font-family: Georgia, serif; }
.tile-name { font-size: 30rpx; font-weight: 700; }
.tile-desc { font-size: 22rpx; color: $ink-2; }

.note {
  margin-top: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  font-size: 22rpx;
  color: $ink-3;
}
</style>
