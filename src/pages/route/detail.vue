<script setup lang="ts">
import { computed, getCurrentInstance, ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import StatusPill from '@/components/StatusPill.vue'
import MockSwitch from '@/components/MockSwitch.vue'
import { useNavLayout } from '@/composables/useNavLayout'
import { useVehicles } from '@/composables/useVehicles'
import { DETAIL_POLL_MS, MAP_CENTER, MAP_SCALE, STALE_AFTER_MS } from '@/config'
import { api } from '@/services/api'
import type { Route } from '@/types'
import { describeNear, nearestStop } from '@/utils/geo'
import { formatAgo, formatHMS } from '@/utils/time'

const nav = useNavLayout()
const instance = getCurrentInstance()

const routeId = ref<string>()
const route = ref<Route | null>(null)
const routeError = ref<string | null>(null)

const { views, state, error, loading, refresh, snapshot } = useVehicles(() => routeId.value, DETAIL_POLL_MS)

async function loadRoute() {
  if (!routeId.value) return
  try {
    route.value = await api.getRoute(routeId.value)
    routeError.value = null
  } catch (e: any) {
    routeError.value = e?.message || '加载失败'
  }
}

onLoad((q) => {
  routeId.value = (q?.id as string) || 'r1'
  loadRoute()
})

onShareAppMessage(() => ({
  title: route.value ? `${route.value.name} · 摆渡车实时位置` : '校园摆渡车实时位置',
  path: `/pages/route/detail?id=${routeId.value}`,
}))

/* ---------- 布局 ---------- */
const sheetHeight = Math.round(nav.windowHeight * 0.52)
const mapHeight = nav.windowHeight - sheetHeight + 28

/* ---------- 地图 ---------- */
// 打开时的视野固定在学校（.env 的 VITE_MAP_CENTER / VITE_MAP_SCALE）；“⤢”按钮可缩放到整条线路
const center = MAP_CENTER

const lead = computed(() => views.value[0])
const nearId = computed(() => (lead.value && route.value ? nearestStop(lead.value.vehicle, route.value.stops)?.stop.id : undefined))

const polyline = computed(() =>
  route.value
    ? [{ points: route.value.path, color: route.value.color + 'E6', width: 6, borderColor: '#FFFFFF', borderWidth: 2 }]
    : [],
)

const markers = computed(() => {
  const r = route.value
  if (!r) return []
  const stops = r.stops.map((s, i) => ({
    id: i + 1,
    latitude: s.latitude,
    longitude: s.longitude,
    width: 16,
    height: 16,
    anchor: { x: 0.5, y: 0.5 },
    iconPath: s.id === nearId.value ? '/static/markers/stop-near.png' : '/static/markers/stop.png',
    callout: { content: s.name, display: 'BYCLICK', padding: 8, borderRadius: 10, fontSize: 12, color: '#0B1F1C', bgColor: '#FFFFFF' },
  }))
  // 只有“正常”和“已过期”才画车；过期置灰
  const buses = views.value.map((v, i) => ({
    id: 1000 + i,
    latitude: v.vehicle.latitude,
    longitude: v.vehicle.longitude,
    width: 40,
    height: 40,
    anchor: { x: 0.5, y: 0.5 },
    zIndex: 10,
    iconPath: v.state === 'stale' ? '/static/markers/bus-stale.png' : '/static/markers/bus-live.png',
    callout: {
      content: v.state === 'stale' ? `${v.vehicle.vehicleId} · 已过期` : v.vehicle.vehicleId,
      display: 'ALWAYS',
      padding: 8,
      borderRadius: 12,
      fontSize: 12,
      color: '#FFFFFF',
      bgColor: v.state === 'stale' ? '#64748BEE' : '#0B1F1CEE',
    },
  }))
  return [...stops, ...buses]
})

function mapCtx() {
  return uni.createMapContext('map', instance?.proxy)
}

function focus(lat: number, lng: number) {
  mapCtx().moveToLocation({ latitude: lat, longitude: lng })
}

function fitRoute() {
  if (!route.value) return
  mapCtx().includePoints({ points: route.value.path, padding: [60, 40, 40, 40] })
}

function locateBus() {
  if (lead.value) focus(lead.value.vehicle.latitude, lead.value.vehicle.longitude)
  else fitRoute()
}

/* ---------- 状态面板文案 ---------- */
const nearText = computed(() => (lead.value && route.value ? describeNear(lead.value.vehicle, route.value.stops) : ''))
const freshness = computed(() => (lead.value ? Math.min(1, lead.value.ageMs / STALE_AFTER_MS) : 0))
const hoursText = computed(() => route.value?.serviceWindows.map((w) => `${w.start}–${w.end}`).join('  ·  ') ?? '')

function onRefresh() {
  if (routeError.value) loadRoute()
  refresh()
}

function back() {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}

const goFeedback = () => uni.navigateTo({ url: `/pages/feedback/index?routeId=${routeId.value}` })
</script>

<template>
  <view class="page">
    <!-- 地图：只在线路加载成功后显示，线路站点在各状态下都照常展示 -->
    <map
      v-if="route"
      id="map"
      class="map"
      :style="{ height: mapHeight + 'px' }"
      :latitude="center.latitude"
      :longitude="center.longitude"
      :scale="MAP_SCALE"
      :markers="markers"
      :polyline="polyline"
      :show-location="false"
      :enable-poi="false"
      :show-compass="false"
    />
    <view v-else class="map map--blank" :style="{ height: mapHeight + 'px' }" />

    <!-- 顶部悬浮导航 -->
    <view class="topbar" :style="{ top: nav.statusBar + 'px', height: nav.navHeight + 'px', paddingRight: nav.capsuleWidth + 8 + 'px' }">
      <view class="fab fab--back" hover-class="tap-active" @tap="back"><text>‹</text></view>
      <view v-if="route" class="title-chip">
        <view class="code" :style="{ background: route.color }"><text>{{ route.code }}</text></view>
        <text class="title-txt">{{ route.name }}</text>
      </view>
    </view>

    <!-- 地图右侧按钮 -->
    <view class="map-tools" :style="{ bottom: sheetHeight + 16 + 'px' }">
      <view class="fab" hover-class="tap-active" @tap="fitRoute"><text class="ico">⤢</text></view>
      <view :class="['fab', { 'fab--dim': !lead }]" hover-class="tap-active" @tap="locateBus"><text class="ico">◎</text></view>
    </view>

    <!-- 底部面板 -->
    <view class="sheet" :style="{ height: sheetHeight + 'px' }">
      <view class="grabber" />
      <scroll-view scroll-y class="sheet-scroll" :style="{ height: sheetHeight - 20 + 'px' }">
        <view class="sheet-inner" :style="{ paddingBottom: nav.safeBottom + 24 + 'px' }">
          <!-- 线路本身加载失败 -->
          <view v-if="routeError" class="status status--error">
            <StatusPill state="error" />
            <text class="st-title">服务异常</text>
            <text class="st-desc">{{ routeError }}，暂时无法获取线路信息。</text>
            <view class="btn btn--dark" hover-class="tap-active" @tap="onRefresh"><text>重试</text></view>
          </view>

          <template v-else>
            <!-- 正常 -->
            <view v-if="state === 'normal' && lead" class="status status--normal">
              <view class="st-row">
                <StatusPill state="normal" />
                <text class="st-ago num">{{ formatAgo(lead.ageMs) }}更新</text>
              </view>
              <view class="st-bus">
                <text class="bus-id num">{{ lead.vehicle.vehicleId }}</text>
                <text class="bus-near">{{ nearText }}</text>
              </view>
              <view class="fresh">
                <view class="fresh-bar"><view class="fresh-fill" :style="{ width: (1 - freshness) * 100 + '%' }" /></view>
                <text class="fresh-txt">超过 60 秒未更新将标为过期</text>
              </view>
            </view>

            <!-- 数据已过期 -->
            <view v-else-if="state === 'stale' && lead" class="status status--stale">
              <StatusPill state="stale" />
              <text class="st-title">数据已过期</text>
              <text class="st-desc num">最后更新于 {{ formatHMS(lead.vehicle.collectedAt) }}，当时{{ nearText }}。车辆可能已经离开，请以现场为准。</text>
            </view>

            <!-- 位置暂不可用 -->
            <view v-else-if="state === 'unavailable'" class="status status--off">
              <StatusPill state="unavailable" />
              <text class="st-title">位置暂不可用</text>
              <text class="st-desc">定位设备暂时离线，我们已收到提醒。线路和站点照常显示，车辆位置恢复后会自动更新。</text>
            </view>

            <!-- 服务异常 -->
            <view v-else-if="state === 'error'" class="status status--error">
              <StatusPill state="error" />
              <text class="st-title">服务异常</text>
              <text class="st-desc">{{ error }}，现在无法获取车辆位置。为避免误导，我们不会显示之前的旧位置。</text>
              <view class="btn btn--dark" hover-class="tap-active" @tap="onRefresh">
                <text>{{ loading ? '正在重试…' : '重试' }}</text>
              </view>
            </view>

            <!-- 非运营时段 -->
            <view v-else-if="state === 'offhours'" class="status status--off">
              <StatusPill state="offhours" />
              <text class="st-title">当前非运营时段</text>
              <text class="st-desc">
                {{ snapshot?.nextServiceAt ? `下一班次 ${snapshot.nextServiceAt} 开始。` : '' }}服务时段：{{ hoursText }}
              </text>
            </view>

            <!-- 首次加载 -->
            <view v-else class="status status--loading">
              <view class="sk sk--a" />
              <view class="sk sk--b" />
            </view>

            <!-- 刷新条 -->
            <view class="actions">
              <view class="refresh" hover-class="tap-active" @tap="onRefresh">
                <text :class="['spin', { 'spin--on': loading }]">↻</text>
                <text>刷新</text>
              </view>
              <text class="auto">停留时每 {{ DETAIL_POLL_MS / 1000 }} 秒自动刷新</text>
              <text class="report" @tap="goFeedback">反馈问题</text>
            </view>

            <!-- 站点 -->
            <view v-if="route" class="stops">
              <view class="stops-head">
                <text class="stops-title">站点</text>
                <text class="stops-meta">{{ route.stops.length }} 站 · 单向环线</text>
              </view>
              <view
                v-for="(s, i) in route.stops"
                :key="s.id"
                :class="['stop', { 'stop--near': s.id === nearId, 'stop--stale': state === 'stale' }]"
                hover-class="stop-hover"
                @tap="focus(s.latitude, s.longitude)"
              >
                <view class="rail">
                  <view class="rail-line" :class="{ 'rail-line--first': i === 0, 'rail-line--last': i === route.stops.length - 1 }" :style="{ background: route.color }" />
                  <view class="rail-dot" :style="{ borderColor: route.color }" />
                </view>
                <view class="stop-body">
                  <text class="stop-name">{{ s.name }}</text>
                  <text class="stop-hint">{{ s.hint }}</text>
                </view>
                <text v-if="s.id === nearId" class="here">{{ state === 'stale' ? '最后位置' : '车在附近' }}</text>
              </view>
            </view>
          </template>
        </view>
      </scroll-view>
    </view>

    <MockSwitch :bottom="sheetHeight + 16" @change="onRefresh" />
  </view>
</template>

<style lang="scss" scoped>
.page {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: $bg;
}
.map { width: 100%; }
.map--blank { background: linear-gradient(180deg, #dfe9e5, #eef3f1); }

/* ---------- 顶部 ---------- */
.topbar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-left: 24rpx;
}
.fab {
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: $shadow;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $ink;
}
.fab--back { font-size: 52rpx; line-height: 1; padding-bottom: 6rpx; }
.fab--dim { opacity: 0.5; }
.ico { font-size: 34rpx; font-weight: 700; }
.title-chip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 76rpx;
  padding: 0 28rpx 0 10rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: $shadow;
}
.code {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  color: #fff;
  font-weight: 800;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.title-txt { font-size: 28rpx; font-weight: 700; }

.map-tools {
  position: fixed;
  right: 24rpx;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* ---------- 底部面板 ---------- */
.sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  background: $bg;
  border-radius: 48rpx 48rpx 0 0;
  box-shadow: 0 -12rpx 48rpx rgba(11, 31, 28, 0.12);
}
.grabber {
  width: 72rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #cdd7d4;
  margin: 16rpx auto 0;
}
.sheet-inner { padding: 20rpx 28rpx 0; }

.status {
  border-radius: $radius-lg;
  padding: 32rpx;
  background: $surface;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12rpx;
  box-shadow: $shadow;
}
.status--normal {
  background: $ink;
  color: #fff;
  gap: 0;
}
.status--stale { background: #fff8ef; border: 2rpx solid #f6d9b4; box-shadow: none; .st-title { color: $stale; } }
.status--error { background: #fff5f5; border: 2rpx solid #f5c2c2; box-shadow: none; .st-title { color: $err; } }
.status--off .st-title { color: $off; }

.st-row { width: 100%; display: flex; align-items: center; justify-content: space-between; }
.status--normal :deep(.pill) { background: rgba(200, 241, 105, 0.16); color: $lime; }
.st-ago { font-size: 26rpx; color: rgba(255, 255, 255, 0.72); }

.st-bus { margin-top: 28rpx; display: flex; flex-direction: column; gap: 4rpx; }
.bus-id { font-size: 72rpx; font-weight: 800; line-height: 1.05; letter-spacing: -1rpx; }
.bus-near { font-size: 30rpx; color: $lime; font-weight: 600; }

.fresh { width: 100%; margin-top: 28rpx; display: flex; flex-direction: column; gap: 10rpx; }
.fresh-bar { height: 8rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.12); overflow: hidden; }
.fresh-fill { height: 100%; border-radius: 999rpx; background: linear-gradient(90deg, #13a88f, $lime); transition: width 1s linear; }
.fresh-txt { font-size: 22rpx; color: rgba(255, 255, 255, 0.56); }

.st-title { margin-top: 8rpx; font-size: 40rpx; font-weight: 800; letter-spacing: -0.5rpx; }
.st-desc { font-size: 26rpx; color: $ink-2; line-height: 1.6; }

.status--loading { gap: 20rpx; }
.sk { width: 100%; border-radius: 16rpx; background: linear-gradient(90deg, #edf1ef, #f6f8f7, #edf1ef); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
.sk--a { height: 44rpx; width: 40%; }
.sk--b { height: 120rpx; }
@keyframes shimmer { to { background-position: -200% 0; } }

.btn {
  margin-top: 12rpx;
  align-self: stretch;
  height: 84rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.btn--dark { background: $ink; color: #fff; }

.actions {
  margin: 24rpx 4rpx 0;
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 24rpx;
}
.refresh {
  display: flex;
  align-items: center;
  gap: 8rpx;
  height: 60rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: $surface;
  font-weight: 700;
  box-shadow: $shadow;
}
.spin { font-size: 28rpx; display: inline-block; }
.spin--on { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.auto { flex: 1; color: $ink-3; }
.report { color: $brand; font-weight: 700; }

/* ---------- 站点 ---------- */
.stops {
  margin-top: 28rpx;
  border-radius: $radius-lg;
  background: $surface;
  padding: 28rpx 28rpx 12rpx;
}
.stops-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12rpx; }
.stops-title { font-size: 30rpx; font-weight: 800; }
.stops-meta { font-size: 22rpx; color: $ink-3; }

.stop {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-height: 104rpx;
  border-radius: $radius-sm;
}
.stop-hover { background: $bg; }
.rail { position: relative; width: 36rpx; align-self: stretch; display: flex; align-items: center; justify-content: center; }
.rail-line { position: absolute; left: 15rpx; width: 6rpx; top: 0; bottom: 0; opacity: 0.25; }
.rail-line--first { top: 50%; }
.rail-line--last { bottom: 50%; }
.rail-dot { position: relative; width: 24rpx; height: 24rpx; border-radius: 50%; background: #fff; border: 6rpx solid; }

.stop-body { flex: 1; display: flex; flex-direction: column; }
.stop-name { font-size: 28rpx; font-weight: 600; }
.stop-hint { font-size: 22rpx; color: $ink-3; }

.stop--near {
  .rail-dot { background: $lime; border-color: $ink !important; transform: scale(1.25); }
  .stop-name { font-weight: 800; }
}
.here {
  font-size: 22rpx;
  font-weight: 700;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: $ink;
  color: $lime;
}
.stop--stale .here { background: $off-soft; color: $off; }
</style>
