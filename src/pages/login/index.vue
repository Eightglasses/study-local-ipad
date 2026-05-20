<template>
  <view class="login-container">
    <view class="login-card">
      <!-- Logo -->
      <view class="logo-area">
        <text class="logo-emoji">🌟</text>
        <text class="logo-title">儿童打卡积分</text>
        <text class="logo-sub">坚持打卡，积累成长</text>
      </view>

      <!-- Tab Switch -->
      <view class="tab-row">
        <view
          class="tab-btn"
          :class="{ active: mode === 'login' }"
          @tap="mode = 'login'"
          >登录</view
        >
        <view
          class="tab-btn"
          :class="{ active: mode === 'register' }"
          @tap="mode = 'register'"
          >注册</view
        >
      </view>

      <!-- Form -->
      <view class="form-area">
        <view class="input-group">
          <text class="input-label">用户名</text>
          <input
            class="input-field"
            v-model="username"
            placeholder="请输入用户名"
            :maxlength="20"
          />
        </view>

        <view class="input-group">
          <text class="input-label">密码</text>
          <input
            class="input-field"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            :maxlength="20"
          />
        </view>

        <view
          class="btn-submit"
          :class="{ loading: submitting }"
          @tap="handleSubmit"
        >
          <text v-if="!submitting">{{
            mode === "login" ? "登录" : "注册"
          }}</text>
          <text v-else>处理中...</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { login, register, isLoggedIn } from "../../utils/auth";

const mode = ref<"login" | "register">("login");
const username = ref("");
const password = ref("");
const submitting = ref(false);

// 如果已登录，直接跳走
if (isLoggedIn()) {
  uni.switchTab({ url: "/pages/index/index" });
}

async function handleSubmit() {
  if (submitting.value) return;

  const u = username.value.trim();
  const p = password.value.trim();

  if (!u) {
    uni.showToast({ title: "请输入用户名", icon: "none" });
    return;
  }
  if (!p) {
    uni.showToast({ title: "请输入密码", icon: "none" });
    return;
  }

  if (mode.value === "register" && u.length < 2) {
    uni.showToast({ title: "用户名至少 2 个字符", icon: "none" });
    return;
  }
  if (mode.value === "register" && p.length < 4) {
    uni.showToast({ title: "密码至少 4 位", icon: "none" });
    return;
  }

  submitting.value = true;

  try {
    if (mode.value === "login") {
      await login(u, p);
    } else {
      await register(u, p);
    }
    uni.switchTab({ url: "/pages/index/index" });
  } catch {
    // auth.ts 已处理 toast
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff3ed, #ffe8d6);
  padding: 40rpx;
}

.login-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 60rpx 48rpx;
  width: 100%;
  max-width: 600rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.logo-area {
  text-align: center;
  margin-bottom: 48rpx;
}

.logo-emoji {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.logo-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.logo-sub {
  font-size: 26rpx;
  color: #999;
}

.tab-row {
  display: flex;
  background: #f5f5f5;
  border-radius: 20rpx;
  padding: 6rpx;
  margin-bottom: 40rpx;
}

.tab-btn {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #999;
  transition: all 0.2s;

  &.active {
    background: #ff6b35;
    color: #fff;
  }
}

.input-group {
  margin-bottom: 28rpx;
}

.input-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
  display: block;
}

.input-field {
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 22rpx 24rpx;
  font-size: 30rpx;
  width: 100%;
  box-sizing: border-box;
  background: #fafafa;
  min-height: 88rpx;
  line-height: 1.4;

  &:focus {
    border-color: #ff6b35;
    background: #fff;
  }
}

.btn-submit {
  margin-top: 20rpx;
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  color: #fff;
  text-align: center;
  padding: 26rpx 0;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 600;

  &.loading {
    opacity: 0.7;
  }
}
</style>
