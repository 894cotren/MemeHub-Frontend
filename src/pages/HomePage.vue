
<template>
  <div id="homePage">
      <h1>
        {{msg}}
      </h1>
      <p/>
      <router-link to="/pictureShow" style="font-size: large">码头搞点薯条</router-link>
  </div>
</template>


<script setup lang="ts">
  const msg="欢迎来到memehub";
</script>

<style scoped>

</style>
