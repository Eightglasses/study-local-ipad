<template>
  <view class="container">
    <!-- Section: Task Management -->
    <view class="section-header">
      <text class="section-title">任务管理</text>
      <view class="btn-add" @tap="showAddTask = true">+ 添加</view>
    </view>

    <view v-for="task in tasks" :key="task.id" class="item-card">
      <view class="item-left">
        <text class="item-icon">{{ task.icon }}</text>
        <view class="item-info">
          <text class="item-name">{{ task.name }}</text>
          <text class="item-sub"
            >+{{ task.points }}分 · {{ repeatLabel(task) }}</text
          >
        </view>
      </view>
      <view class="item-actions">
        <view class="action-btn" @tap="editTask(task)">编辑</view>
        <view class="action-btn danger" @tap="removeTask(task.id)">删除</view>
      </view>
    </view>

    <!-- Section: Reward Management -->
    <view class="section-header section-header--spaced">
      <text class="section-title">奖励管理</text>
      <view class="btn-add" @tap="showAddReward = true">+ 添加</view>
    </view>

    <view v-for="reward in rewards" :key="reward.id" class="item-card">
      <view class="item-left">
        <text class="item-icon">{{ reward.icon }}</text>
        <view class="item-info">
          <text class="item-name">{{ reward.name }}</text>
          <text class="item-sub">{{ reward.points }}积分</text>
        </view>
      </view>
      <view class="item-actions">
        <view class="action-btn" @tap="editReward(reward)">编辑</view>
        <view class="action-btn danger" @tap="removeReward(reward.id)"
          >删除</view
        >
      </view>
    </view>

    <!-- Account -->
    <view class="section-header section-header--spaced">
      <text class="section-title">账号</text>
    </view>

    <view class="item-card" v-if="currentUser">
      <view class="item-left">
        <text class="item-icon">👤</text>
        <view class="item-info">
          <text class="item-name">{{ currentUser.username }}</text>
          <text class="item-sub">当前登录用户</text>
        </view>
      </view>
    </view>

    <view class="logout-btn" @tap="handleLogout">退出登录</view>

    <!-- Add Task Modal -->
    <view v-if="showAddTask" class="modal-overlay">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{
            editingTask ? "编辑任务" : "添加任务"
          }}</text>
          <text class="modal-close" @tap="closeTaskModal">✕</text>
        </view>

        <!-- Quick add -->
        <view v-if="!editingTask" class="quick-add-row" @tap="addQuickTask">
          <text class="quick-add-icon">📝</text>
          <text>快速添加：写作业</text>
          <text class="quick-add-points">+10分</text>
        </view>

        <view class="form-group">
          <text class="form-label">图标</text>
          <view class="icon-select-row" @tap="showTaskIconPicker = true">
            <text class="icon-select-preview">{{ taskForm.icon }}</text>
            <text class="icon-select-arrow">›</text>
          </view>
        </view>

        <view class="form-group">
          <text class="form-label">名称</text>
          <input
            class="form-input"
            v-model="taskForm.name"
            placeholder="例如：练琴、阅读、运动"
          />
          <text class="form-hint">给自己取一个简短的任务名称</text>
        </view>

        <view class="form-group">
          <text class="form-label">积分</text>
          <input
            class="form-input"
            v-model="taskForm.points"
            type="number"
            placeholder="例如：10"
          />
          <text class="form-hint">完成此任务可获得的积分数</text>
        </view>

        <view class="form-group">
          <text class="form-label">重复</text>
          <view class="repeat-options">
            <view
              class="repeat-btn"
              :class="{ active: taskForm.repeat === 'daily' }"
              @tap="taskForm.repeat = 'daily'"
              >每天</view
            >
            <view
              class="repeat-btn"
              :class="{ active: taskForm.repeat === 'weekly' }"
              @tap="taskForm.repeat = 'weekly'"
              >每周</view
            >
            <view
              class="repeat-btn"
              :class="{ active: taskForm.repeat === 'once' }"
              @tap="taskForm.repeat = 'once'"
              >仅一次</view
            >
          </view>
        </view>

        <view v-if="taskForm.repeat === 'weekly'" class="form-group">
          <text class="form-label">选择星期</text>
          <view class="week-grid">
            <view
              v-for="(day, idx) in weekDayNames"
              :key="idx"
              class="week-btn"
              :class="{ active: taskForm.weekDays?.includes(idx) }"
              @tap="toggleWeekDay(idx)"
              >{{ day }}</view
            >
          </view>
        </view>

        <view class="modal-actions">
          <view class="modal-btn cancel" @tap="closeTaskModal">取消</view>
          <view class="modal-btn confirm" @tap="saveTask">保存</view>
        </view>
      </view>
    </view>

    <!-- Add Reward Modal -->
    <view v-if="showAddReward" class="modal-overlay">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{
            editingReward ? "编辑奖励" : "添加奖励"
          }}</text>
          <text class="modal-close" @tap="closeRewardModal">✕</text>
        </view>

        <!-- Quick add -->
        <view v-if="!editingReward" class="quick-add-row" @tap="addQuickReward">
          <text class="quick-add-icon">💰</text>
          <text>快速添加：兑换零花钱</text>
          <text class="quick-add-points">10分</text>
        </view>

        <view class="form-group">
          <text class="form-label">图标</text>
          <view class="icon-select-row" @tap="showRewardIconPicker = true">
            <text class="icon-select-preview">{{ rewardForm.icon }}</text>
            <text class="icon-select-arrow">›</text>
          </view>
        </view>

        <view class="form-group">
          <text class="form-label">名称</text>
          <input
            class="form-input"
            v-model="rewardForm.name"
            placeholder="例如：看电视、吃冰淇淋"
          />
          <text class="form-hint">给自己设定一个心动的奖励</text>
        </view>

        <view class="form-group">
          <text class="form-label">所需积分</text>
          <input
            class="form-input"
            v-model="rewardForm.points"
            type="number"
            placeholder="例如：50"
          />
          <text class="form-hint">兑换此奖励需要消耗的积分数</text>
        </view>

        <view class="modal-actions">
          <view class="modal-btn cancel" @tap="closeRewardModal">取消</view>
          <view class="modal-btn confirm" @tap="saveReward">保存</view>
        </view>
      </view>
    </view>

    <!-- Icon Picker for Task -->
    <IconPicker
      :visible="showTaskIconPicker"
      v-model="taskForm.icon"
      @close="showTaskIconPicker = false"
    />

    <!-- Icon Picker for Reward -->
    <IconPicker
      :visible="showRewardIconPicker"
      v-model="rewardForm.icon"
      @close="showRewardIconPicker = false"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getRewards,
  addReward,
  updateReward,
  deleteReward,
} from "../../utils/storage";
import { logout, getUser } from "../../utils/auth";
import IconPicker from "../../components/icon-picker/index.vue";
import { DEFAULT_TASK_ICON, DEFAULT_REWARD_ICON } from "../../utils/icons";
import type { Task, Reward } from "../../utils/types";
import type { AuthUser } from "../../utils/auth";

const tasks = ref<Task[]>([]);
const rewards = ref<Reward[]>([]);
const showAddTask = ref(false);
const showAddReward = ref(false);
const showTaskIconPicker = ref(false);
const showRewardIconPicker = ref(false);
const editingTask = ref<Task | null>(null);
const editingReward = ref<Reward | null>(null);
const currentUser = ref<AuthUser | null>(null);

const weekDayNames = ["日", "一", "二", "三", "四", "五", "六"];

const taskForm = reactive({
  icon: DEFAULT_TASK_ICON,
  name: "",
  points: 10,
  repeat: "daily" as "daily" | "weekly" | "once",
  weekDays: [] as number[],
});

const rewardForm = reactive({
  icon: DEFAULT_REWARD_ICON,
  name: "",
  points: 50,
});

function repeatLabel(task: Task): string {
  if (task.repeat === "daily") return "每天";
  if (task.repeat === "weekly") {
    const days = (task.weekDays || [])
      .map((d) => "周" + weekDayNames[d])
      .join("、");
    return days;
  }
  return "仅一次";
}

function toggleWeekDay(idx: number) {
  const i = taskForm.weekDays.indexOf(idx);
  if (i === -1) taskForm.weekDays.push(idx);
  else taskForm.weekDays.splice(i, 1);
}

async function addQuickTask() {
  await addTask({
    icon: "📝",
    name: "写作业",
    points: 10,
    repeat: "daily",
    active: true,
  });
  uni.showToast({ title: "添加成功", icon: "success" });
  loadData();
  closeTaskModal();
}

function editTask(task: Task) {
  editingTask.value = task;
  taskForm.icon = task.icon;
  taskForm.name = task.name;
  taskForm.points = task.points;
  taskForm.repeat = task.repeat;
  taskForm.weekDays = [...(task.weekDays || [])];
  showAddTask.value = true;
}

function closeTaskModal() {
  showAddTask.value = false;
  editingTask.value = null;
  taskForm.icon = DEFAULT_TASK_ICON;
  taskForm.name = "";
  taskForm.points = 10;
  taskForm.repeat = "daily";
  taskForm.weekDays = [];
}

async function saveTask() {
  if (!taskForm.name.trim()) {
    uni.showToast({ title: "请输入任务名称", icon: "none" });
    return;
  }
  if (taskForm.points <= 0) {
    uni.showToast({ title: "积分必须大于0", icon: "none" });
    return;
  }

  if (editingTask.value) {
    await updateTask(editingTask.value.id, {
      icon: taskForm.icon,
      name: taskForm.name,
      points: taskForm.points,
      repeat: taskForm.repeat,
      weekDays: taskForm.repeat === "weekly" ? taskForm.weekDays : undefined,
    });
  } else {
    await addTask({
      icon: taskForm.icon,
      name: taskForm.name,
      points: taskForm.points,
      repeat: taskForm.repeat,
      weekDays: taskForm.repeat === "weekly" ? taskForm.weekDays : undefined,
      active: true,
    });
  }

  uni.showToast({ title: "保存成功", icon: "success" });
  closeTaskModal();
  loadData();
}

function removeTask(id: string) {
  uni.showModal({
    title: "确认删除",
    content: "确定要删除这个任务吗？",
    success: async (res) => {
      if (res.confirm) {
        await deleteTask(id);
        loadData();
      }
    },
  });
}

function editReward(reward: Reward) {
  editingReward.value = reward;
  rewardForm.icon = reward.icon;
  rewardForm.name = reward.name;
  rewardForm.points = reward.points;
  showAddReward.value = true;
}

function closeRewardModal() {
  showAddReward.value = false;
  editingReward.value = null;
  rewardForm.icon = DEFAULT_REWARD_ICON;
  rewardForm.name = "";
  rewardForm.points = 50;
}

async function addQuickReward() {
  await addReward({ icon: "💰", name: "兑换零花钱", points: 10, active: true });
  uni.showToast({ title: "添加成功", icon: "success" });
  loadData();
  closeRewardModal();
}

async function saveReward() {
  if (!rewardForm.name.trim()) {
    uni.showToast({ title: "请输入奖励名称", icon: "none" });
    return;
  }
  if (rewardForm.points <= 0) {
    uni.showToast({ title: "积分必须大于0", icon: "none" });
    return;
  }

  if (editingReward.value) {
    await updateReward(editingReward.value.id, {
      icon: rewardForm.icon,
      name: rewardForm.name,
      points: rewardForm.points,
    });
  } else {
    await addReward({
      icon: rewardForm.icon,
      name: rewardForm.name,
      points: rewardForm.points,
      active: true,
    });
  }

  uni.showToast({ title: "保存成功", icon: "success" });
  closeRewardModal();
  loadData();
}

function removeReward(id: string) {
  uni.showModal({
    title: "确认删除",
    content: "确定要删除这个奖励吗？",
    success: async (res) => {
      if (res.confirm) {
        await deleteReward(id);
        loadData();
      }
    },
  });
}

async function loadData() {
  currentUser.value = getUser();
  tasks.value = await getTasks();
  rewards.value = await getRewards();
}

function handleLogout() {
  uni.showModal({
    title: "退出登录",
    content: "确定要退出登录吗？",
    success: (res) => {
      if (res.confirm) {
        logout();
        uni.reLaunch({ url: "/pages/login/index" });
      }
    },
  });
}

onMounted(() => loadData());
onShow(() => loadData());
</script>

<style lang="scss" scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
}

.section-header--spaced {
  margin-top: 40rpx;
}

.btn-add {
  background: #ff6b35;
  color: #fff;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  font-weight: 500;
}

.quick-add-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: linear-gradient(135deg, #fff3ed, #fff8f3);
  border: 2rpx solid #ff6b35;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
  font-size: 28rpx;
  color: #ff6b35;
  font-weight: 500;

  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.quick-add-icon {
  font-size: 36rpx;
}

.quick-add-points {
  margin-left: auto;
  font-weight: 700;
  font-size: 30rpx;
}

.form-hint {
  font-size: 22rpx;
  color: #bbb;
  margin-top: 8rpx;
  display: block;
}

.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.item-icon {
  font-size: 44rpx;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 28rpx;
  font-weight: 500;
  display: block;
}

.item-sub {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.item-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  background: #f5f5f5;
  color: #666;

  &.danger {
    background: #fff0f0;
    color: #f44336;
  }
}

// Modal
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.modal-content {
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 32rpx;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  position: relative;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 700;
}

.modal-close {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32rpx;
  color: #999;
  padding: 8rpx 16rpx;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
  display: block;
}

.form-input {
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
  min-height: 80rpx;
  line-height: 1.4;
}

.repeat-options {
  display: flex;
  gap: 12rpx;
}

.repeat-btn {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 16rpx;
  background: #f5f5f5;
  font-size: 26rpx;

  &.active {
    background: #ff6b35;
    color: #fff;
  }
}

.week-grid {
  display: flex;
  gap: 12rpx;
}

.week-btn {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 16rpx;
  background: #f5f5f5;
  font-size: 26rpx;

  &.active {
    background: #ff6b35;
    color: #fff;
  }
}

.modal-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}

.modal-btn {
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

.logout-btn {
  text-align: center;
  padding: 24rpx 0;
  background: #fff0f0;
  color: #f44336;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 500;
  margin-top: 16rpx;
}

.icon-select-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 20rpx;
  min-height: 80rpx;
  box-sizing: border-box;

  &:active {
    opacity: 0.8;
  }
}

.icon-select-preview {
  font-size: 48rpx;
}

.icon-select-arrow {
  font-size: 36rpx;
  color: #ccc;
  font-weight: 300;
}
</style>
