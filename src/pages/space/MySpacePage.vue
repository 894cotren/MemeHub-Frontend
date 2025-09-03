<template>
  <div id="mySpace">
    <p>正在跳转，请稍候...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listSpaceVoByPageUsingPost } from '@/api/spaceController'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/userLoginUserStore'

const router = useRouter()
const loginUserStore = useLoginUserStore()

// 检查用户是否有个人空间
const checkUserSpace = async () => {
  const loginUser = loginUserStore.loginUser
  if (!loginUser?.id) {
    router.replace('/user/login')
    return
  }
  // 获取用户个人空间信息，添加spaceType=0筛选条件
  console.log('查询个人空间，用户ID:', loginUser.id)
  const res = await listSpaceVoByPageUsingPost({
    userId: loginUser.id,
    spaceType: 0, // 只查询个人空间
    pageNum: 1,
    pageSize: 1,
  })
  console.log('个人空间查询结果:', res.data)
  if (res.data.code === 20000) {
    if (res.data.data && res.data.data.records && res.data.data.records.length > 0) {
      const space = res.data.data.records[0]
      router.replace(`/space/${space.id}`)
    } else {
      router.replace('/addSpace')
      message.warn('请先创建空间')
    }
  } else {
    message.error('加载我的空间失败，' + res.data.message)
  }
}

// 在页面加载时检查用户空间
onMounted(() => {
  checkUserSpace()
})
</script>
