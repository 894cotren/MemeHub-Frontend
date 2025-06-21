

<template>
  <div id="app">
    <BasicLayout/>
  </div>
</template>

<script setup lang="ts">
import BasicLayout from '@/layouts/BasicLayout.vue'
//已经在access.ts里做了全局权限，那边会在进入的时候获取用户对象的。
// import { useLoginUserStore } from '@/stores/userLoginUserStore'
//
// const loginUserStore=useLoginUserStore()
// loginUserStore.fetchLoginUser()


</script>



<style scoped>

</style>
