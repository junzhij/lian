<script setup lang="ts">
/** 仅在 mock 模式渲染：切换模拟场景，方便验收 PRD 里的每种状态 */
import { computed } from 'vue'
import { USE_MOCK } from '@/config'
import { SCENARIOS, scenario, setScenario } from '@/mock/scenario'

const props = withDefaults(defineProps<{ bottom?: number }>(), { bottom: 40 })
const emit = defineEmits<{ change: [] }>()

const short = computed(() => SCENARIOS.find((s) => s.key === scenario.value)?.label.split('（')[0])

function open() {
  uni.showActionSheet({
    itemList: SCENARIOS.map((s) => (s.key === scenario.value ? '✓ ' : '') + s.label),
    success: ({ tapIndex }) => {
      setScenario(SCENARIOS[tapIndex].key)
      emit('change')
    },
  })
}
</script>

<template>
  <view v-if="USE_MOCK" class="mock" :style="{ bottom: props.bottom + 'px' }" hover-class="tap-active" @tap="open">
    <text class="tag">MOCK</text>
    <text class="label">{{ short }}</text>
  </view>
</template>

<style lang="scss" scoped>
.mock {
  position: fixed;
  left: 24rpx;
  z-index: 99;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 10rpx 22rpx 10rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(31, 30, 27, 0.9);
  color: #fff;
  font-size: 22rpx;
  box-shadow: $shadow-lg;
}
.tag {
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
  background: #fff;
  color: $ink;
  font-weight: 800;
  letter-spacing: 1rpx;
  font-size: 20rpx;
}
</style>
