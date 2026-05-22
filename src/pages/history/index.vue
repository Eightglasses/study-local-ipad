<template>
  <view class="container">
    <!-- Points Summary -->
    <view class="card summary">
      <view class="summary-item">
        <text class="summary-label">累计积分</text>
        <text class="summary-value primary">{{ totalEarned }}</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-label">已消耗</text>
        <text class="summary-value danger">{{ totalRedeemed }}</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-label">可用积分</text>
        <text class="summary-value success">{{ currentPoints }}</text>
      </view>
    </view>

    <!-- Tab Switch -->
    <view class="tab-bar">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'checkin' }"
        @tap="activeTab = 'checkin'"
        >打卡记录</view
      >
      <view
        class="tab-item"
        :class="{ active: activeTab === 'points' }"
        @tap="activeTab = 'points'"
        >积分明细</view
      >
    </view>

    <!-- Check-in Records -->
    <view v-if="activeTab === 'checkin'">
      <view v-if="groupedCheckins.length === 0" class="empty-tip"
        >暂无打卡记录</view
      >
      <view
        v-for="group in groupedCheckins"
        :key="group.date"
        class="date-group"
      >
        <view class="date-label">{{ group.date }}</view>
        <view
          v-for="record in group.records"
          :key="record.id"
          class="record-item"
          @tap="openDetail(record)"
        >
          <view class="record-left">
            <text class="record-icon">{{ record.taskIcon }}</text>
            <view class="record-info">
              <text class="record-name">{{ record.taskName }}</text>
              <text class="record-meta"
                >{{ record.date }} · +{{ record.points }}分<text
                  v-if="record.device"
                >
                  · {{ record.device }}</text
                ></text
              >
            </view>
          </view>
          <view class="record-right">
            <text class="record-points earn">+{{ record.points }}</text>
            <text class="record-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Points Log -->
    <view v-if="activeTab === 'points'">
      <view v-if="pointsLog.length === 0" class="empty-tip">暂无积分记录</view>
      <view v-for="log in pointsLog" :key="log.id" class="record-item">
        <view class="record-left">
          <text class="log-desc">{{ log.description }}</text>
          <text class="log-time">{{ formatDate(log.createdAt) }}</text>
        </view>
        <text class="record-points" :class="log.type"
          >{{ log.type === "earn" ? "+" : "-" }}{{ log.points }}</text
        >
      </view>
    </view>

    <!-- Detail Modal -->
    <view v-if="detailRecord" class="detail-overlay" @tap="closeDetail">
      <view class="detail-card" @tap.stop>
        <!-- Header -->
        <view class="detail-header">
          <text class="detail-emoji">{{ detailRecord.taskIcon }}</text>
          <text class="detail-title">{{ detailRecord.taskName }}</text>
        </view>

        <!-- Info rows -->
        <view class="detail-body">
          <view class="detail-row">
            <text class="detail-label">完成时间</text>
            <text class="detail-value">{{
              formatDateTime(detailRecord.createdAt)
            }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">打卡日期</text>
            <text class="detail-value">{{ detailRecord.date }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">获得积分</text>
            <text class="detail-value detail-points"
              >+{{ detailRecord.points }}</text
            >
          </view>
          <view v-if="detailRecord.device" class="detail-row">
            <text class="detail-label">打卡设备</text>
            <text class="detail-value">{{ detailRecord.device }}</text>
          </view>
        </view>

        <!-- Image -->
        <view
          v-if="detailImageUrl"
          class="detail-image-section"
          @tap="openPreview(detailImageUrl)"
        >
          <text class="detail-section-title">完成证明</text>
          <image :src="detailImageUrl" class="detail-image" mode="aspectFill" />
        </view>

        <!-- Delete button -->
        <view class="detail-footer">
          <view class="detail-delete-btn" @tap="handleDeleteFromDetail">
            <text class="delete-btn-text">删除此记录</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Image Preview Overlay -->
    <view v-if="previewUrl" class="preview-overlay" @tap="closePreview">
      <image
        :src="previewUrl"
        class="preview-image"
        mode="widthFix"
        @tap.stop
      />
      <text class="preview-close">✕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import {
  getCheckIns,
  deleteCheckIn,
  getPointsLog,
  getTotalPoints,
  getRedeemRecords,
} from "../../utils/storage";
import type { CheckIn, PointsLog } from "../../utils/types";

const activeTab = ref<"checkin" | "points">("checkin");
const checkins = ref<CheckIn[]>([]);
const pointsLog = ref<PointsLog[]>([]);
const currentPoints = ref(0);
const totalRedeemed = ref(0);
const previewUrl = ref<string | null>(null);
const detailRecord = ref<CheckIn | null>(null);
const detailImageUrl = ref<string | null>(null);

async function handleDeleteFromDetail() {
  if (!detailRecord.value) return;
  uni.showModal({
    title: "确认删除",
    content: `确定要删除「${detailRecord.value.taskName}」的打卡记录吗？删除后不可恢复。`,
    success: async (res) => {
      if (res.confirm) {
        await deleteCheckIn(detailRecord.value!.id);
        closeDetail();
        loadData();
        uni.showToast({ title: "已删除", icon: "success" });
      }
    },
  });
}

const totalEarned = computed(() => {
  return checkins.value.reduce((sum, c) => sum + c.points, 0);
});

interface CheckInGroup {
  date: string;
  records: CheckIn[];
}

const groupedCheckins = computed<CheckInGroup[]>(() => {
  const groups: Record<string, CheckIn[]> = {};
  const sorted = [...checkins.value].reverse();
  for (const c of sorted) {
    if (!groups[c.date]) groups[c.date] = [];
    groups[c.date].push(c);
  }
  return Object.entries(groups).map(([date, records]) => ({ date, records }));
});

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

async function openDetail(record: CheckIn) {
  detailRecord.value = record;
  detailImageUrl.value = record.imageUrl || null;
}

function closeDetail() {
  detailRecord.value = null;
}

function openPreview(url: string) {
  previewUrl.value = url;
}

function closePreview() {
  previewUrl.value = null;
}

async function loadData() {
  checkins.value = await getCheckIns();
  const log = await getPointsLog();
  pointsLog.value = [...log].reverse();
  const points = await getTotalPoints();
  currentPoints.value = points;
  const redeems = await getRedeemRecords();
  totalRedeemed.value = redeems.reduce((sum: number, r) => sum + r.points, 0);
}

onMounted(() => loadData());
onShow(() => loadData());
</script>

<style lang="scss" scoped>
.summary {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.summary-value {
  font-size: 40rpx;
  font-weight: 700;

  &.primary {
    color: #ff6b35;
  }
  &.danger {
    color: #f44336;
  }
  &.success {
    color: #4caf50;
  }
}

.summary-divider {
  width: 1rpx;
  height: 60rpx;
  background: #eee;
}

.tab-bar {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  padding: 8rpx;
  margin: 24rpx 0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  border-radius: 12rpx;
  color: #666;
  transition: all 0.2s;

  &.active {
    background: #ff6b35;
    color: #fff;
    font-weight: 600;
  }
}

.date-group {
  margin-bottom: 24rpx;
}

.date-label {
  font-size: 26rpx;
  color: #999;
  padding: 8rpx 0;
  font-weight: 500;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 12rpx;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.record-icon {
  font-size: 40rpx;
}

.record-info {
  flex: 1;
}

.record-name {
  font-size: 28rpx;
  font-weight: 500;
  display: block;
}

.record-meta {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.record-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.record-arrow {
  font-size: 36rpx;
  color: #ccc;
  font-weight: 300;
}

.record-points {
  font-size: 30rpx;
  font-weight: 600;

  &.earn {
    color: #4caf50;
  }
  &.redeem {
    color: #f44336;
  }
  &.deduct {
    color: #f44336;
  }
}

.log-desc {
  font-size: 28rpx;
  display: block;
}

.log-time {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 80rpx 0;
  font-size: 28rpx;
}

.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-image {
  max-width: 90%;
  max-height: 80%;
}

.preview-close {
  position: absolute;
  top: 60rpx;
  right: 32rpx;
  color: #fff;
  font-size: 48rpx;
  padding: 16rpx;
}

// Detail Modal
.detail-overlay {
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
  padding: 40rpx;
}

.detail-card {
  background: #fff;
  border-radius: 28rpx;
  width: 100%;
  max-width: 700rpx;
  max-height: 80vh;
  overflow-y: auto;
}

.detail-header {
  text-align: center;
  padding: 48rpx 32rpx 32rpx;
  border-bottom: 2rpx solid #f5f5f5;
}

.detail-emoji {
  font-size: 80rpx;
  display: block;
  margin-bottom: 12rpx;
}

.detail-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.detail-body {
  padding: 24rpx 32rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f5f5f5;

  &:last-of-type {
    border-bottom: none;
  }
}

.detail-label {
  font-size: 26rpx;
  color: #999;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.detail-points {
  color: #4caf50;
  font-weight: 700;
  font-size: 32rpx;
}

.detail-image-section {
  padding: 0 32rpx 32rpx;
}

.detail-section-title {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 12rpx;
}

.detail-image {
  width: 100%;
  height: 360rpx;
  border-radius: 16rpx;
  background: #f0f0f0;
}

.detail-footer {
  padding: 24rpx 32rpx 32rpx;
}

.detail-delete-btn {
  text-align: center;
  padding: 24rpx 0;
  background: #fff0f0;
  border-radius: 16rpx;
  border: 2rpx solid #f44336;

  &:active {
    opacity: 0.8;
  }
}

.delete-btn-text {
  font-size: 28rpx;
  color: #f44336;
  font-weight: 500;
}
</style>
