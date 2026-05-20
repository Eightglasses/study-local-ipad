<template>
  <view v-if="visible" class="icon-picker-overlay" @tap="close">
    <view class="icon-picker-panel" @tap.stop>
      <view class="picker-header">
        <text class="picker-title">选择图标</text>
        <text class="picker-close" @tap="close">✕</text>
      </view>

      <view class="icon-preview-row">
        <text class="preview-label">已选：</text>
        <text class="preview-icon">{{ tempIcon }}</text>
      </view>

      <view class="picker-body">
        <view v-for="group in iconLibrary" :key="group.name" class="icon-group">
          <text class="group-name">{{ group.name }}</text>
          <view class="icon-grid">
            <view
              v-for="icon in group.icons"
              :key="icon"
              class="icon-cell"
              :class="{ selected: tempIcon === icon }"
              @tap="selectIcon(icon)"
            >
              <text class="icon-emoji">{{ icon }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="picker-footer">
        <view class="footer-btn cancel" @tap="close">取消</view>
        <view class="footer-btn confirm" @tap="confirmSelection">确定</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ICON_LIBRARY } from "../../utils/icons";

const props = defineProps<{
  visible: boolean;
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  close: [];
}>();

const iconLibrary = ICON_LIBRARY;
const tempIcon = ref(props.modelValue);

// 每次打开时，将临时选中值同步为当前值
watch(
  () => props.visible,
  (v: boolean) => {
    if (v) tempIcon.value = props.modelValue;
  },
);

function selectIcon(icon: string) {
  tempIcon.value = icon;
}

function confirmSelection() {
  emit("update:modelValue", tempIcon.value);
  emit("close");
}

function close() {
  emit("close");
}
</script>

<style lang="scss" scoped>
.icon-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.icon-picker-panel {
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  position: relative;
  border-bottom: 2rpx solid #f5f5f5;
}

.picker-title {
  font-size: 34rpx;
  font-weight: 700;
}

.picker-close {
  position: absolute;
  right: 32rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32rpx;
  color: #999;
  padding: 8rpx 16rpx;
}

.icon-preview-row {
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx;
  border-bottom: 2rpx solid #f5f5f5;
}

.preview-label {
  font-size: 26rpx;
  color: #999;
}

.preview-icon {
  font-size: 48rpx;
  margin-left: 12rpx;
}

.picker-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16rpx 24rpx 40rpx;
}

.icon-group {
  margin-bottom: 24rpx;
}

.group-name {
  font-size: 26rpx;
  color: #999;
  font-weight: 500;
  display: block;
  margin-bottom: 12rpx;
  padding-left: 8rpx;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.icon-cell {
  width: calc((100% - 60rpx) / 6);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  border-radius: 16rpx;
  border: 3rpx solid transparent;
  transition: all 0.15s;

  &.selected {
    background: #fff3ed;
    border-color: #ff6b35;
  }

  &:active {
    transform: scale(0.92);
  }
}

.icon-emoji {
  font-size: 40rpx;
}

.picker-footer {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 32rpx 40rpx;
  border-top: 2rpx solid #f5f5f5;
}

.footer-btn {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  border-radius: 24rpx;
  font-size: 30rpx;
  font-weight: 600;

  &.cancel {
    background: #f5f5f5;
    color: #666;
  }

  &.confirm {
    background: #ff6b35;
    color: #fff;
  }
}
</style>
