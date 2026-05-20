<template>
  <view class="tab-bar">
    <view
      v-for="tab in tabs"
      :key="tab.path"
      class="tab-item"
      :class="{ active: currentPath === tab.path }"
      @tap="switchTab(tab.path)"
    >
      <text class="tab-icon">{{ currentPath === tab.path ? tab.activeIcon : tab.icon }}</text>
      <text class="tab-text">{{ tab.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const currentPath = ref('/pages/index/index')

const tabs = [
  { path: '/pages/index/index', icon: '📋', activeIcon: '✅', text: '打卡' },
  { path: '/pages/rewards/index', icon: '🎁', activeIcon: '🏆', text: '奖励' },
  { path: '/pages/history/index', icon: '📊', activeIcon: '📈', text: '记录' },
  { path: '/pages/settings/index', icon: '⚙️', activeIcon: '🔧', text: '设置' },
]

function switchTab(path: string) {
  if (currentPath.value === path) return
  uni.switchTab({ url: path })
}

onMounted(() => {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const page = pages[pages.length - 1]
    currentPath.value = '/' + (page as any).route
  }
})
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1rpx solid #eee;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 8rpx 0;
  transition: transform 0.15s;

  &:active {
    transform: scale(0.9);
  }

  &.active .tab-text {
    color: #FF6B35;
    font-weight: 600;
  }
}

.tab-icon {
  font-size: 44rpx;
  line-height: 1;
  margin-bottom: 4rpx;
}

.tab-text {
  font-size: 22rpx;
  color: #999;
}
</style>
