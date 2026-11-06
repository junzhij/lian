<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { USE_MOCK } from '@/config'

onLaunch(() => {
  if (USE_MOCK) console.info('[智汇黎安+] 运行在 mock 模式，所有数据为内置模拟数据')
})
</script>

<style lang="scss">
page {
  background: $bg;
  color: $ink;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'HarmonyOS Sans SC', 'MiSans', 'Helvetica Neue', sans-serif;
  font-size: 28rpx;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

view, text, button, input, textarea {
  box-sizing: border-box;
}

button {
  margin: 0;
  padding: 0;
  line-height: inherit;
  background: transparent;
  border-radius: 0;
  font-size: inherit;
  color: inherit;
  &::after { border: none; }
}

.num {
  font-variant-numeric: tabular-nums;
  font-family: 'DIN Alternate', 'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif;
}

.tap {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.tap-active {
  transform: scale(0.97);
  opacity: 0.85;
}
</style>
