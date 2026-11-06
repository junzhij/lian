/**
 * 自定义导航栏需要的尺寸：状态栏高度 + 胶囊按钮位置。
 * 内容要避开右上角的微信胶囊。
 */
export function useNavLayout() {
  const sys = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
  const statusBar = sys.statusBarHeight || 20
  let navHeight = 44
  let capsuleWidth = 0
  // #ifdef MP-WEIXIN
  const rect = uni.getMenuButtonBoundingClientRect()
  if (rect && rect.height) {
    navHeight = (rect.top - statusBar) * 2 + rect.height
    capsuleWidth = sys.windowWidth - rect.left
  }
  // #endif
  return {
    statusBar,
    navHeight,
    /** 状态栏 + 导航栏总高度（px） */
    top: statusBar + navHeight,
    capsuleWidth,
    windowHeight: sys.windowHeight,
    safeBottom: sys.safeAreaInsets?.bottom ?? 0,
  }
}
