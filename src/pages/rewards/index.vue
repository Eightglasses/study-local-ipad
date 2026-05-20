<template>
  <view class="container">
    <!-- Points Summary -->
    <view class="points-bar">
      <text class="points-label">可用积分</text>
      <text class="points-value">{{ totalPoints }}</text>
    </view>

    <!-- Reward Grid -->
    <view class="section-title">可兑换奖励</view>
    <view v-if="rewards.length === 0" class="empty-tip">
      还没有奖励，去设置页添加吧！
    </view>
    <view class="reward-grid">
      <view
        v-for="reward in rewards"
        :key="reward.id"
        class="reward-card"
        :class="{ disabled: totalPoints < reward.points }"
        @tap="handleRedeem(reward)"
      >
        <view class="reward-icon">{{ reward.icon }}</view>
        <text class="reward-name">{{ reward.name }}</text>
        <view class="reward-cost">
          <text class="cost-value">{{ reward.points }}</text>
          <text class="cost-unit">积分</text>
        </view>
      </view>
    </view>

    <!-- Redeem History -->
    <view v-if="redeemRecords.length > 0" class="section-title">兑换记录</view>
    <view
      v-for="record in redeemRecords.slice().reverse().slice(0, 10)"
      :key="record.id"
      class="record-item"
    >
      <view class="record-info">
        <text class="record-icon">{{ record.rewardIcon }}</text>
        <text class="record-name">{{ record.rewardName }}</text>
      </view>
      <view class="record-meta">
        <text class="record-points">-{{ record.points }}</text>
        <text class="record-date">{{ formatDate(record.createdAt) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import {
  getTotalPoints,
  getRewards,
  redeemReward,
  getRedeemRecords,
} from "../../utils/storage";
import type { Reward, RedeemRecord } from "../../utils/types";

const totalPoints = ref(0);
const rewards = ref<Reward[]>([]);
const redeemRecords = ref<RedeemRecord[]>([]);

async function loadData() {
  totalPoints.value = await getTotalPoints();
  const allRewards = await getRewards();
  rewards.value = allRewards.filter((r) => r.active);
  redeemRecords.value = await getRedeemRecords();
}

function handleRedeem(reward: Reward) {
  if (totalPoints.value < reward.points) {
    uni.showToast({ title: "积分不足", icon: "none" });
    return;
  }

  uni.showModal({
    title: "确认兑换",
    content: `确定用 ${reward.points} 积分兑换「${reward.icon} ${reward.name}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        const result = await redeemReward(reward.id);
        if (result) {
          uni.showToast({ title: "兑换成功！", icon: "success" });
          loadData();
        } else {
          uni.showToast({ title: "积分不足", icon: "none" });
        }
      }
    },
  });
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

onMounted(() => loadData());
onShow(() => loadData());
</script>

<style lang="scss" scoped>
.points-bar {
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  border-radius: 24rpx;
  padding: 36rpx 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
  color: #fff;
}

.points-label {
  font-size: 28rpx;
  opacity: 0.9;
}

.points-value {
  font-size: 56rpx;
  font-weight: 700;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.reward-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.reward-card {
  width: calc(50% - 8rpx);
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx 20rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: transform 0.1s;

  &:active {
    transform: scale(0.97);
  }

  &.disabled {
    opacity: 0.5;
  }
}

.reward-icon {
  font-size: 64rpx;
  margin-bottom: 12rpx;
}

.reward-name {
  font-size: 28rpx;
  font-weight: 500;
  display: block;
  margin-bottom: 12rpx;
}

.reward-cost {
  .cost-value {
    font-size: 36rpx;
    font-weight: 700;
    color: #ff6b35;
  }

  .cost-unit {
    font-size: 22rpx;
    color: #999;
    margin-left: 4rpx;
  }
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 80rpx 0;
  font-size: 28rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
}

.record-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.record-icon {
  font-size: 36rpx;
}

.record-name {
  font-size: 28rpx;
}

.record-meta {
  text-align: right;
}

.record-points {
  font-size: 28rpx;
  color: #f44336;
  font-weight: 600;
  display: block;
}

.record-date {
  font-size: 22rpx;
  color: #999;
}
</style>
