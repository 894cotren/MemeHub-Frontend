<template>
  <div id="basicLayout">
    <a-layout style="min-height: 100vh; background: rgb(34, 34, 34);">
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
      <a-layout-footer class="footer">
        <span>站长邮箱：awc20@qq.com | </span>
        <a href="https://beian.miit.gov.cn" onclick="return confirm('即将跳转到工信部备案网站，是否继续？')">蜀ICP备2025148459号</a>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from '@/components/GlobalHeader.vue'
</script>

<style scoped>
#basicLayout {
  background: rgb(34, 34, 34);
}

/* 确保 Ant Design Layout 组件背景正确 */
:deep(.ant-layout) {
  background: rgb(34, 34, 34) !important;
}

#basicLayout .footer {
  background: rgb(50, 50, 50);
  padding: 16px;
  /*position: fixed;*/
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  color: #ffffff;
  border-top: 1px solid rgb(50, 50, 50);
  margin-top: 0;
}

/* 确保footer组件样式正确 */
:deep(.ant-layout-footer) {
  background: rgb(50, 50, 50) !important;
  margin-top: 0 !important;
  padding: 16px !important;
}

/* 全局背景保险 */
:deep(body) {
  background: rgb(34, 34, 34) !important;
}

:deep(html) {
  background: rgb(34, 34, 34) !important;
}

#basicLayout .content {
  background: rgb(34, 34, 34);
  padding: 20px;
  min-height: calc(100vh - 140px);
  margin: 0;
}

#basicLayout .header {
  padding-inline: 20px;
/*  margin-bottom: 0px;*/
  color: #ffffff;
  background: rgb(50, 50, 50);
  border-bottom: 1px solid rgb(60, 60, 60);
}
</style>
