<template>
  <view class="container">
    <!-- Points Banner -->
    <view class="points-banner">
      <view class="points-label">我的积分</view>
      <view class="points-value">{{ totalPoints }}</view>
      <view class="points-subtitle">继续加油！</view>
    </view>

    <!-- Today Progress -->
    <view class="card progress-card">
      <view class="progress-header">
        <text class="progress-title">今日进度</text>
        <text class="progress-count"
          >{{ completedCount }}/{{ totalCount }}</text
        >
      </view>
      <view class="progress-bar">
        <view
          class="progress-fill"
          :style="{ width: progressPercent + '%' }"
        ></view>
      </view>
    </view>

    <!-- Task List -->
    <view class="section-title">今日任务</view>
    <view
      v-if="pendingTasks.length === 0 && completedTasks.length === 0"
      class="empty-tip"
    >
      还没有任务，去设置页添加吧！
    </view>

    <!-- Deduct Points Section -->
    <view class="deduct-section">
      <view class="deduct-header" @tap="showDeduct = !showDeduct">
        <text class="deduct-title">⚠️ 扣分</text>
        <text class="deduct-toggle">{{ showDeduct ? "收起" : "展开" }}</text>
      </view>
      <view v-if="showDeduct" class="deduct-body">
        <text class="deduct-hint">表现不好时快速扣分：</text>
        <view class="deduct-grid">
          <view
            v-for="item in quickDeductReasons"
            :key="item.label"
            class="deduct-chip"
            @tap="handleDeduct(item.points, item.label)"
          >
            <text class="deduct-chip-icon">{{ item.icon }}</text>
            <text class="deduct-chip-label">{{ item.label }}</text>
            <text class="deduct-chip-points">-{{ item.points }}</text>
          </view>
        </view>
        <view class="deduct-custom">
          <input
            class="deduct-input"
            v-model="customDeductPoints"
            type="number"
            placeholder="自定义扣分分值"
          />
          <view
            class="deduct-custom-btn"
            @tap="handleDeduct(customDeductPoints, '表现扣分')"
            >扣分</view
          >
        </view>
      </view>
    </view>

    <!-- Pending Tasks -->
    <view
      v-for="task in pendingTasks"
      :key="task.id"
      class="task-item"
      @tap="handleCheckIn(task)"
    >
      <view class="task-icon">{{ task.icon }}</view>
      <view class="task-info">
        <text class="task-name">{{ task.name }}</text>
        <text class="task-repeat">{{ repeatLabel(task) }}</text>
      </view>
      <view class="task-points">+{{ task.points }}</view>
    </view>

    <!-- Completed Tasks -->
    <view v-if="completedTasks.length > 0" class="section-title completed-title"
      >已完成</view
    >
    <view
      v-for="task in completedTasks"
      :key="'done-' + task.id"
      class="task-item completed"
    >
      <view class="task-icon">{{ task.icon }}</view>
      <view class="task-info">
        <text class="task-name">{{ task.name }}</text>
        <text class="task-repeat completed-text">已完成</text>
      </view>
      <view class="task-points earned">+{{ task.points }}</view>
    </view>

    <!-- Check-in Animation Overlay -->
    <view
      v-if="showAnimation"
      class="animation-overlay"
      @tap="showAnimation = false"
    >
      <view class="animation-content">
        <text class="animation-emoji">🎉</text>
        <text class="animation-text">打卡成功！</text>
        <text class="animation-points">+{{ animatedPoints }} 积分</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import {
  getTodayTasks,
  getCompletedTodayTaskIds,
  getTasks,
  checkIn,
  getTotalPoints,
} from "../../utils/storage";
import { deductPoints } from "../../utils/api";
import type { Task } from "../../utils/types";

const totalPoints = ref(0);
const pendingTasks = ref<Task[]>([]);
const completedTaskIds = ref<string[]>([]);
const showAnimation = ref(false);
const animatedPoints = ref(0);
const uploadingTaskId = ref<string | null>(null);
const allTasks = ref<Task[]>([]);
const showDeduct = ref(false);
const customDeductPoints = ref(0);

const quickDeductReasons = [
  { icon: "😤", label: "发脾气", points: 5 },
  { icon: "📱", label: "玩手机", points: 10 },
  { icon: "😴", label: "赖床", points: 3 },
  { icon: "🗣️", label: "顶嘴", points: 5 },
  { icon: "📺", label: "偷看电视", points: 8 },
  { icon: "🍬", label: "偷吃零食", points: 3 },
];

const allActiveTasks = computed(() =>
  allTasks.value.filter((t: Task) => t.active),
);

const completedTasks = computed(() => {
  return allActiveTasks.value.filter((t: Task) =>
    completedTaskIds.value.includes(t.id),
  );
});

const completedCount = computed(() => completedTaskIds.value.length);
const totalCount = computed(
  () => pendingTasks.value.length + completedTaskIds.value.length,
);
const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((completedCount.value / totalCount.value) * 100);
});

function repeatLabel(task: Task): string {
  if (task.repeat === "daily") return "每天";
  if (task.repeat === "weekly") {
    const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
    const days = (task.weekDays || [])
      .map((d) => "周" + dayNames[d])
      .join("、");
    return days;
  }
  return "仅一次";
}

function handleCheckIn(task: Task) {
  uni.showActionSheet({
    itemList: ["📷 拍照", "🖼️ 从相册选择", "✅ 直接完成"],
    success: (res) => {
      if (res.tapIndex === 2) {
        doCheckIn(task);
      } else {
        const sourceType: ("camera" | "album")[] =
          res.tapIndex === 0 ? ["camera"] : ["album"];
        chooseAndUploadImage(task, sourceType);
      }
    },
  });
}

async function chooseAndUploadImage(
  task: Task,
  sourceType: ("camera" | "album")[],
) {
  try {
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType,
    });
    const tempFilePath = res.tempFilePaths[0];
    uploadingTaskId.value = task.id;

    uni.showLoading({ title: "上传图片中..." });

    const result = await checkIn(task.id, tempFilePath);

    uni.hideLoading();

    if (result) {
      animatedPoints.value = task.points;
      showAnimation.value = true;
      loadData();

      setTimeout(() => {
        showAnimation.value = false;
      }, 1500);
    }
  } catch (e: any) {
    uni.hideLoading();
    if (e.errMsg !== "chooseImage:fail cancel") {
      uni.showToast({ title: "打卡失败", icon: "none" });
    }
  } finally {
    uploadingTaskId.value = null;
  }
}

async function doCheckIn(task: Task) {
  const result = await checkIn(task.id);
  if (result) {
    animatedPoints.value = task.points;
    showAnimation.value = true;
    loadData();

    setTimeout(() => {
      showAnimation.value = false;
    }, 1500);
  }
}

async function handleDeduct(points: number, reason: string) {
  if (!points || points <= 0) {
    uni.showToast({ title: "请输入有效的扣分分值", icon: "none" });
    return;
  }

  uni.showModal({
    title: "确认扣分",
    content: `确定要扣除 ${points} 分吗？（${reason}）`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await deductPoints(points, reason);
          uni.showToast({ title: `已扣除 ${points} 分`, icon: "success" });
          loadData();
        } catch {
          // error already shown
        }
      }
    },
  });
}

async function loadData() {
  totalPoints.value = await getTotalPoints();
  completedTaskIds.value = await getCompletedTodayTaskIds();
  pendingTasks.value = await getTodayTasks();
  allTasks.value = await getTasks();
}

onMounted(() => {
  loadData();
});

onShow(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.points-banner {
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  text-align: center;
  margin-bottom: 24rpx;
  color: #fff;
}

.points-label {
  font-size: 28rpx;
  opacity: 0.9;
}

.points-value {
  font-size: 80rpx;
  font-weight: 700;
  margin: 8rpx 0;
}

.points-subtitle {
  font-size: 26rpx;
  opacity: 0.8;
}

.progress-card {
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
  }

  .progress-title {
    font-size: 28rpx;
    font-weight: 600;
  }

  .progress-count {
    font-size: 26rpx;
    color: #ff6b35;
    font-weight: 600;
  }

  .progress-bar {
    height: 16rpx;
    background: #f0f0f0;
    border-radius: 8rpx;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff6b35, #ff8f65);
    border-radius: 8rpx;
    transition: width 0.5s ease;
  }
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  margin-top: 24rpx;

  &:first-of-type {
    margin-top: 0;
  }
}

.completed-title {
  color: #999;
}

.task-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: transform 0.1s;

  &:active {
    transform: scale(0.98);
  }

  &.completed {
    opacity: 0.6;
  }
}

.task-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
  width: 72rpx;
  text-align: center;
}

.task-info {
  flex: 1;
}

.task-name {
  font-size: 30rpx;
  font-weight: 500;
  display: block;
}

.task-repeat {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;

  &.completed-text {
    color: #4caf50;
  }
}

.task-points {
  font-size: 32rpx;
  font-weight: 700;
  color: #ff6b35;

  &.earned {
    color: #4caf50;
  }
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 80rpx 0;
  font-size: 28rpx;
}

.deduct-section {
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.deduct-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #fff5f5;
}

.deduct-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #f44336;
}

.deduct-toggle {
  font-size: 24rpx;
  color: #999;
}

.deduct-body {
  padding: 24rpx;
}

.deduct-hint {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 16rpx;
}

.deduct-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.deduct-chip {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 14rpx 20rpx;
  background: #fff5f5;
  border: 2rpx solid #ffcdd2;
  border-radius: 28rpx;
  font-size: 26rpx;

  &:active {
    opacity: 0.8;
    transform: scale(0.96);
  }
}

.deduct-chip-icon {
  font-size: 28rpx;
}

.deduct-chip-label {
  color: #666;
}

.deduct-chip-points {
  color: #f44336;
  font-weight: 600;
}

.deduct-custom {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.deduct-input {
  flex: 1;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  font-size: 26rpx;
  min-height: 72rpx;
  box-sizing: border-box;
}

.deduct-custom-btn {
  padding: 16rpx 32rpx;
  background: #f44336;
  color: #fff;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 500;
  white-space: nowrap;

  &:active {
    opacity: 0.8;
  }
}

.animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.animation-content {
  text-align: center;
  animation: popIn 0.4s ease-out;
}

.animation-emoji {
  font-size: 120rpx;
  display: block;
  margin-bottom: 16rpx;
}

.animation-text {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  display: block;
  margin-bottom: 8rpx;
}

.animation-points {
  font-size: 36rpx;
  color: #ffd700;
  font-weight: 600;
}

@keyframes popIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  70% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
