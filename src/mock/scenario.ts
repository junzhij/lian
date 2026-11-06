import { ref } from 'vue'

/**
 * 开发模式下可切换的模拟场景，对应 PRD 06 的各种状态。
 * 切换入口：页面右下角的 “MOCK” 按钮。
 */
export type MockScenario = 'normal' | 'stale' | 'unavailable' | 'error' | 'offhours' | 'clock'

export const SCENARIOS: { key: MockScenario; label: string }[] = [
  { key: 'normal', label: '正常运行' },
  { key: 'stale', label: '数据已过期（>60 秒未更新）' },
  { key: 'unavailable', label: '位置暂不可用（设备离线）' },
  { key: 'error', label: '服务异常（后端不可用）' },
  { key: 'offhours', label: '非运营时段' },
  { key: 'clock', label: '按真实时钟判断运营时段' },
]

const KEY = 'mock:scenario'

export const scenario = ref<MockScenario>((uni.getStorageSync(KEY) as MockScenario) || 'normal')
/** 进入当前场景的时间。“过期”场景用它冻结最后一次定位 */
export const scenarioSince = ref(Date.now())

export function setScenario(s: MockScenario) {
  scenario.value = s
  scenarioSince.value = Date.now()
  uni.setStorageSync(KEY, s)
}

export function scenarioLabel(s: MockScenario) {
  return SCENARIOS.find((x) => x.key === s)?.label ?? s
}
