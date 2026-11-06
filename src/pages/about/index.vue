<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import StatusPill from '@/components/StatusPill.vue'
import { api } from '@/services/api'
import type { DataState, Route } from '@/types'

const routes = ref<Route[]>([])
onLoad(async () => {
  try {
    routes.value = (await api.getRoutes()).filter((r) => r.status === 'active')
  } catch {
    routes.value = []
  }
})

const STATES: { state: DataState; when: string; see: string }[] = [
  { state: 'normal', when: '最近一次定位在 60 秒内', see: '车辆正常显示，标注“X 秒前更新”' },
  { state: 'stale', when: '超过 60 秒没有新位置', see: '车辆置灰，显示最后更新时间' },
  { state: 'unavailable', when: '定位设备离线', see: '隐藏车辆，线路和站点照常显示' },
  { state: 'error', when: '服务暂时不可用', see: '提示重试，不显示旧位置' },
]

const PRIVACY = [
  { t: '不获取你的位置', d: '查车不需要定位授权，我们也不会请求。' },
  { t: '车辆匿名编号', d: '车辆用 A1-01 这样的匿名编号显示，不公开司机身份。' },
  { t: '只在运营时段采集', d: '非运营时段不展示车辆，也不公开轨迹。' },
  { t: '反馈只用于改进', d: '你填写的反馈和联系方式只用于处理问题。' },
]
</script>

<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">ABOUT</text>
      <text class="h1">智汇黎安<text class="plus">+</text></text>
      <text class="lead">校园摆渡车实时位置查询。用户看到的每个位置都是真实、新鲜的；数据不新鲜时，直接告诉你。</text>
    </view>

    <view class="section">
      <text class="section-title">服务时段</text>
      <view class="card">
        <view v-if="!routes.length" class="row"><text class="muted">暂时无法获取，请稍后再看</text></view>
        <view v-for="r in routes" :key="r.id" class="row row--hours">
          <view class="code" :style="{ background: r.color }"><text>{{ r.code }}</text></view>
          <view class="col">
            <text class="name">{{ r.name }}</text>
            <text class="hours num">{{ r.serviceWindows.map((w) => `${w.start}–${w.end}`).join('  ·  ') }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">数据状态说明</text>
      <view class="card">
        <view v-for="s in STATES" :key="s.state" class="row row--state">
          <StatusPill :state="s.state" size="sm" />
          <view class="col">
            <text class="when">{{ s.when }}</text>
            <text class="see">{{ s.see }}</text>
          </view>
        </view>
      </view>
      <text class="foot">定位数据从车载设备采集，经后端校验和过滤后展示，正常网络下延迟一般在 30 秒内。偏离线路的异常坐标会被过滤。</text>
    </view>

    <view class="section">
      <text class="section-title">隐私</text>
      <view class="grid">
        <view v-for="p in PRIVACY" :key="p.t" class="tile">
          <text class="tile-t">{{ p.t }}</text>
          <text class="tile-d">{{ p.d }}</text>
        </view>
      </view>
    </view>

    <view class="credit">
      <text>以太编辑 AethEdit · V0.1.1</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 0 28rpx calc(60rpx + env(safe-area-inset-bottom)); }

.hero {
  margin-top: 16rpx;
  padding: 48rpx 36rpx;
  border-radius: $radius-lg;
  background: $surface;
  border: $hairline;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.eyebrow { font-size: 22rpx; letter-spacing: 6rpx; color: $brand; font-weight: 700; }
.h1 { font-family: $serif; font-size: 56rpx; font-weight: 600; }
.plus { color: $brand; }
.lead { font-size: 26rpx; line-height: 1.7; color: $ink-2; }

.section { margin-top: 44rpx; }
.section-title { display: block; padding: 0 8rpx 18rpx; font-size: 26rpx; font-weight: 700; color: $ink-3; letter-spacing: 2rpx; }
.card { background: $surface; border: $hairline; border-radius: $radius-lg; padding: 8rpx 28rpx; }
.row { display: flex; align-items: center; gap: 20rpx; padding: 24rpx 0; border-bottom: 1rpx solid $line; }
.row:last-child { border-bottom: none; }
.row--state { align-items: flex-start; .col { padding-top: 2rpx; } }
.row--state :deep(.pill) { width: 200rpx; justify-content: flex-start; }
.col { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.code { width: 60rpx; height: 60rpx; border-radius: 18rpx; color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.name { font-size: 28rpx; font-weight: 700; }
.hours { font-size: 26rpx; color: $brand; font-weight: 600; }
.when { font-size: 26rpx; font-weight: 600; }
.see { font-size: 24rpx; color: $ink-3; }
.muted { color: $ink-3; font-size: 26rpx; }
.foot { display: block; margin-top: 16rpx; padding: 0 8rpx; font-size: 22rpx; color: $ink-3; line-height: 1.7; }

.grid { display: flex; flex-wrap: wrap; gap: 20rpx; }
.tile {
  width: calc(50% - 10rpx);
  padding: 28rpx;
  border-radius: $radius-lg;
  background: $surface;
  border: $hairline;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.tile-t { font-size: 28rpx; font-weight: 700; }
.tile-d { font-size: 22rpx; color: $ink-3; line-height: 1.6; }

.credit { margin-top: 56rpx; text-align: center; font-size: 22rpx; color: $ink-3; }
</style>
