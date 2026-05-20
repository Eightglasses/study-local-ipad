<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { isLoggedIn } from "./utils/auth";

onLaunch(() => {
  console.log("App Launch");
  // 未登录则跳转到登录页
  if (!isLoggedIn()) {
    uni.reLaunch({ url: "/pages/login/index" });
  }
});
</script>

<style lang="scss">
@use "./styles/common.scss";
</style>
