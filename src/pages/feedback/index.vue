<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '@/services/api'
import type { FeedbackType } from '@/types'

const TYPES: { key: FeedbackType; label: string }[] = [
  { key: 'position', label: '位置不准' },
  { key: 'stale', label: '数据不更新' },
  { key: 'broken', label: '页面打不开 / 报错' },
  { key: 'route', label: '线路站点有误' },
  { key: 'suggest', label: '功能建议' },
  { key: 'other', label: '其他' },
]
const MAX_IMAGES = 3
const MAX_LEN = 300

const type = ref<FeedbackType | null>(null)
const content = ref('')
const images = ref<string[]>([])
const contact = ref('')
const routeId = ref<string>()
const submitting = ref(false)
const doneId = ref<string | null>(null)

onLoad((q) => {
  routeId.value = q?.routeId as string | undefined
})

const canSubmit = computed(() => !!type.value && content.value.trim().length >= 5 && !submitting.value)

function pickImages() {
  uni.chooseMedia({
    count: MAX_IMAGES - images.value.length,
    mediaType: ['image'],
    sizeType: ['compressed'],
    success: (res) => {
      images.value.push(...res.tempFiles.map((f) => f.tempFilePath))
    },
  })
}

function removeImage(i: number) {
  images.value.splice(i, 1)
}

function preview(i: number) {
  uni.previewImage({ urls: images.value, current: i })
}

async function submit() {
  if (!type.value) return uni.showToast({ title: '请选择问题类型', icon: 'none' })
  if (content.value.trim().length < 5) return uni.showToast({ title: '请至少描述 5 个字', icon: 'none' })
  submitting.value = true
  try {
    const uploaded = await Promise.all(images.value.map((p) => api.uploadImage(p)))
    const res = await api.submitFeedback({
      type: type.value,
      content: content.value.trim(),
      images: uploaded,
      contact: contact.value.trim() || undefined,
      routeId: routeId.value,
    })
    doneId.value = res.id
  } catch (e: any) {
    uni.showModal({ title: '提交失败', content: `${e?.message || '网络异常'}，请稍后再试。`, showCancel: false })
  } finally {
    submitting.value = false
  }
}

function back() {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="page">
    <!-- 提交成功 -->
    <view v-if="doneId" class="done">
      <view class="done-mark"><text>✓</text></view>
      <text class="done-title">已收到，谢谢你</text>
      <text class="done-desc">值守同学会尽快查看处理。</text>
      <text class="done-id num">反馈编号 {{ doneId }}</text>
      <view class="btn btn--dark" hover-class="tap-active" @tap="back"><text>返回</text></view>
    </view>

    <template v-else>
      <view class="intro">
        <text class="h1">遇到问题了？</text>
        <text class="lead">车辆位置不对、页面打不开，或者有想法，都可以告诉我们。</text>
      </view>

      <view class="card">
        <text class="label">问题类型<text class="req">*</text></text>
        <view class="chips">
          <view
            v-for="t in TYPES"
            :key="t.key"
            :class="['chip', { 'chip--on': type === t.key }]"
            hover-class="tap-active"
            @tap="type = t.key"
          >
            <text>{{ t.label }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="label">具体描述<text class="req">*</text></text>
        <textarea
          v-model="content"
          class="textarea"
          :maxlength="MAX_LEN"
          placeholder="例如：8:05 在图书馆站，地图显示车已到站，但现场没有看到车"
          placeholder-class="ph"
          :auto-height="false"
        />
        <text class="count num">{{ content.length }}/{{ MAX_LEN }}</text>

        <text class="label label--gap">截图<text class="opt">选填，最多 {{ MAX_IMAGES }} 张</text></text>
        <view class="images">
          <view v-for="(img, i) in images" :key="img" class="img">
            <image :src="img" mode="aspectFill" class="img-el" @tap="preview(i)" />
            <view class="img-del" @tap.stop="removeImage(i)"><text>×</text></view>
          </view>
          <view v-if="images.length < MAX_IMAGES" class="img img--add" hover-class="tap-active" @tap="pickImages">
            <text class="plus">＋</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="label">联系方式<text class="opt">选填，仅用于回复你</text></text>
        <input v-model="contact" class="input" placeholder="微信号 / 手机号 / 邮箱" placeholder-class="ph" maxlength="50" />
      </view>

      <view class="footer">
        <view :class="['btn', 'btn--brand', { 'btn--disabled': !canSubmit }]" hover-class="tap-active" @tap="submit">
          <text>{{ submitting ? '提交中…' : '提交反馈' }}</text>
        </view>
        <text class="privacy">我们只收集你填写的内容，不会获取你的位置。</text>
      </view>
    </template>

  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 16rpx 28rpx calc(160rpx + env(safe-area-inset-bottom));
}
.intro { padding: 24rpx 8rpx 32rpx; display: flex; flex-direction: column; gap: 12rpx; }
.h1 { font-family: $serif; font-size: 52rpx; font-weight: 600; }
.lead { font-size: 26rpx; color: $ink-2; }

.card {
  background: $surface;
  border: $hairline;
  border-radius: $radius-lg;
  padding: 32rpx 28rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
}
.label { font-size: 28rpx; font-weight: 700; margin-bottom: 20rpx; }
.label--gap { margin-top: 36rpx; }
.req { color: $err; margin-left: 4rpx; }
.opt { font-size: 22rpx; font-weight: 400; color: $ink-3; margin-left: 12rpx; }

.chips { display: flex; flex-wrap: wrap; gap: 16rpx; }
.chip {
  padding: 16rpx 28rpx;
  border-radius: 999rpx;
  background: $sunken;
  font-size: 26rpx;
  color: $ink-2;
  border: 2rpx solid transparent;
}
.chip--on { background: $ink; color: #fff; font-weight: 700; }

.textarea {
  width: 100%;
  height: 220rpx;
  padding: 20rpx 24rpx;
  border-radius: $radius;
  background: $sunken;
  font-size: 28rpx;
  line-height: 1.6;
}
.ph { color: #9d978a; }
.count { align-self: flex-end; margin-top: 10rpx; font-size: 22rpx; color: $ink-3; }

.images { display: flex; gap: 16rpx; }
.img {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  border-radius: $radius;
  overflow: hidden;
}
.img-el { width: 100%; height: 100%; }
.img-del {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(11, 31, 28, 0.7);
  color: #fff;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.img--add {
  background: $sunken;
  border: 2rpx dashed #cdc7ba;
  display: flex;
  align-items: center;
  justify-content: center;
}
.plus { font-size: 48rpx; color: $ink-3; }

.input {
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: $radius;
  background: $sunken;
  font-size: 28rpx;
}

.footer { margin-top: 36rpx; display: flex; flex-direction: column; gap: 20rpx; align-items: center; }
.btn {
  width: 100%;
  height: 96rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 800;
}
.btn--brand { background: $brand; color: #fff; }
.btn--dark { background: $ink; color: #fff; }
.btn--disabled { background: #cfcabf; }
.privacy { font-size: 22rpx; color: $ink-3; }

.done {
  padding: 160rpx 40rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  text-align: center;
}
.done-mark {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: $brand-soft;
  color: $brand;
  font-size: 72rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}
.done-title { font-family: $serif; font-size: 48rpx; font-weight: 600; }
.done-desc { font-size: 26rpx; color: $ink-2; }
.done-id { font-size: 22rpx; color: $ink-3; margin-bottom: 48rpx; }
</style>
