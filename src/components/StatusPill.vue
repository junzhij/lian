<script setup lang="ts">
import { computed } from 'vue'
import type { DataState } from '@/types'
import { STATE_META } from '@/utils/status'

const props = withDefaults(defineProps<{ state: DataState; label?: string; size?: 'sm' | 'md'; dark?: boolean }>(), {
  size: 'md',
})
const meta = computed(() => STATE_META[props.state])
</script>

<template>
  <view :class="['pill', `pill--${meta.tone}`, `pill--${size}`, { 'pill--dark': dark }]">
    <view :class="['dot', { 'dot--live': state === 'normal' }]" />
    <text class="txt">{{ label || meta.label }}</text>
  </view>
</template>

<style lang="scss" scoped>
.pill {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  border-radius: 999rpx;
  font-weight: 600;
  white-space: nowrap;
}
.pill--md { padding: 8rpx 20rpx; font-size: 24rpx; }
.pill--sm { padding: 4rpx 14rpx; font-size: 22rpx; }

.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: currentColor;
  position: relative;
}
.dot--live::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: currentColor;
  animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes ping {
  75%, 100% { transform: scale(2.6); opacity: 0; }
}

.pill--ok { color: $ok; background: $ok-soft; }
.pill--stale { color: $stale; background: $stale-soft; }
.pill--off { color: $off; background: $off-soft; }
.pill--err { color: $err; background: $err-soft; }

.pill--dark {
  background: rgba(255, 255, 255, 0.12);
  &.pill--ok { color: #86efac; }
  &.pill--stale { color: #fbbf77; }
  &.pill--off { color: #cbd5e1; }
  &.pill--err { color: #fca5a5; }
}
</style>
