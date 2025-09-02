<template>
  <div id="addSpacePage" class="dark-theme">
    <div class="page-header">
      <h1>{{ isTeamSpace ? '创建团队空间' : '创建个人空间' }}</h1>
      <p class="page-description">{{ isTeamSpace ? '创建团队协作空间，与团队成员共同管理图片收藏' : '创建您的专属存储空间，开始管理您的图片收藏' }}</p>
    </div>

    <!-- 创建空间表单 - 放在正中间 -->
    <div class="create-form">
      <h2>{{ isTeamSpace ? '创建团队空间' : '创建个人空间' }}</h2>
      <a-form
        ref="formRef"
        :model="formState"
        layout="vertical"
        @finish="onSubmit"
        class="space-form"
      >
        <a-form-item
          name="spaceName"
          label="空间名称"
          :rules="[
            { required: true, message: '请输入空间名称!' },
            { min: 2, max: 20, message: '空间名称长度应在2-20个字符之间!' }
          ]"
        >
          <template #extra>
            <span class="field-hint">{{ isTeamSpace ? '为您的团队空间起一个有意义的名字，方便团队成员识别和管理' : '为您的空间起一个有意义的名字，方便识别和管理' }}</span>
          </template>
          <a-input
            v-model:value="formState.spaceName"
            :placeholder="isTeamSpace ? '请输入团队空间名称' : '请输入空间名称'"
            maxlength="20"
            show-count
          />
        </a-form-item>

        <a-form-item
          name="spaceLevel"
          label="空间级别"
        >
          <template #extra>
            <span class="field-hint">当前仅支持普通版空间，更多版本敬请期待</span>
          </template>
          <a-input
            :value="SPACE_LEVEL_MAP[SPACE_LEVEL_ENUM.COMMON]"
            disabled
            class="disabled-input"
          />
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            :loading="loading"
            class="submit-btn"
          >
            {{ loading ? '创建中...' : (isTeamSpace ? '创建团队空间' : '创建空间') }}
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 空间权益说明 - 放在下方，纯文字形式 -->
    <div class="space-benefits">
      <h2>空间权益说明</h2>
      <div class="benefits-list">
        <div v-for="level in spaceLevels" :key="level.value" class="benefit-item">
          <div class="benefit-header">
            <span class="level-name">{{ level.text }}</span>
                         <span class="level-badge" :class="getLevelBadgeClass(level.value)">
               {{ level.value === 0 ? '当前可用' : '暂未开放' }}
             </span>
          </div>
          <div class="benefit-details">
            <p><strong>存储容量：</strong>{{ formatFileSize(level.maxSize || 0) }}</p>
            <p><strong>图片数量：</strong>{{ level.maxCount || 0 }} 张</p>
            <p v-if="level.value === 0" class="current-level-tip">✨{{ isTeamSpace ? '团队空间' : '普通用户' }}仅支持创建此版本，其他版本请联系站长</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, computed, watch } from 'vue'
import { addSpaceUsingPost, listSpaceLevelUsingGet } from '@/api/spaceController'
import { message } from 'ant-design-vue'
import { useRouter, useRoute } from 'vue-router'
import { SPACE_LEVEL_ENUM, SPACE_LEVEL_MAP } from '@/constants/space'
import type { FormInstance } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const spaceLevels = ref<API.SpaceLevel[]>([])

// 从URL参数获取spaceType，默认为0（个人空间）
const spaceType = computed(() => {
  const type = route.query.spaceType
  return type ? parseInt(type as string) : 0
})

// 判断是否为团队空间
const isTeamSpace = computed(() => spaceType.value === 1)

// 表单数据
const formState = reactive({
  spaceName: '',
  spaceLevel: SPACE_LEVEL_ENUM.COMMON, // 固定为普通版
  spaceType: 0, // 初始值，会在onMounted中设置
})

// 获取空间权益列表
const fetchSpaceLevels = async () => {
  try {
    const res = await listSpaceLevelUsingGet()
    if (res.data.code === 20000 && res.data.data) {
      spaceLevels.value = res.data.data
    } else {
      message.error('获取空间权益信息失败')
    }
  } catch (error) {
    console.error('获取空间权益失败:', error)
  }
}

// 获取等级徽章样式类
const getLevelBadgeClass = (level: number | undefined) => {
  if (level === 0) return 'badge-current'
  return 'badge-coming'
}

// 提交表单
const onSubmit = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    const res = await addSpaceUsingPost({
      spaceName: formState.spaceName,
      spaceLevel: formState.spaceLevel,
      spaceType: formState.spaceType,
    })

    if (res.data.code === 20000 && res.data.data) {
      message.success(`${isTeamSpace.value ? '团队空间' : '空间'}创建成功！`)
      // 等待接口返回空间ID，然后跳转到新创建的空间详情页
      const newSpaceId = res.data.data
      if (newSpaceId) {
        router.push(`/space/${newSpaceId}`)
      } else {
        // 如果没有返回ID，跳转到我的空间页面
        router.push('/mySpace')
      }
    } else {
      message.error('创建失败：' + res.data.message)
    }
  } catch (error) {
    message.error('表单验证失败')
  } finally {
    loading.value = false
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 监听spaceType变化并更新表单
watch(spaceType, (newValue) => {
  formState.spaceType = newValue
})

// 页面加载时获取空间权益信息
onMounted(() => {
  // 设置初始spaceType
  formState.spaceType = spaceType.value
  fetchSpaceLevels()
})
</script>

<style scoped>
.dark-theme {
  background: rgb(34, 34, 34);
  min-height: 100vh;
  padding: 20px;
  color: #ffffff;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 16px;
  color: #ffffff;
}

.page-description {
  font-size: 1.1rem;
  color: #8c8c8c;
  margin: 0;
}

/* 创建表单 - 放在正中间 */
.create-form {
  max-width: 600px;
  margin: 0 auto 60px auto;
}

.create-form h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #ffffff;
}

.space-form {
  background: #1f1f1f;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #434343;
}

.field-hint {
  color: #8c8c8c;
  font-size: 12px;
}

.disabled-input {
  background-color: #2a2a2a !important;
  color: #8c8c8c !important;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

/* 空间权益说明 - 放在下方，纯文字形式 */
.space-benefits {
  max-width: 800px;
  margin: 0 auto;
}

.space-benefits h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #ffffff;
  font-size: 1.8rem;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.benefit-item {
  background: #2a2a2a;
  border: 1px solid #434343;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
}

.benefit-item:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.benefit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.level-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1890ff;
}

.level-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.badge-current {
  background-color: #52c41a;
  color: #ffffff;
}

.badge-coming {
  background-color: #8c8c8c;
  color: #ffffff;
}

.benefit-details p {
  margin: 8px 0;
  color: #d9d9d9;
  font-size: 14px;
}

.current-level-tip {
  color: #52c41a !important;
  font-weight: 500;
  margin-top: 12px !important;
}

/* 覆盖 Ant Design 组件样式 */
:deep(.ant-form) {
  color: #ffffff;
}

:deep(.ant-form-item-label > label) {
  color: #ffffff !important;
}

:deep(.ant-input) {
  background-color: #2a2a2a !important;
  border-color: #434343 !important;
  color: #ffffff !important;
  border: 1px solid #434343 !important;
}

:deep(.ant-input-affix-wrapper) {
  background-color: #2a2a2a !important;
  border: 1px solid #434343 !important;
  color: #ffffff !important;
}

:deep(.ant-input-affix-wrapper .ant-input) {
  border: none !important;
  background-color: transparent !important;
}

:deep(.ant-input:focus) {
  border: 1px solid #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
}

:deep(.ant-input-affix-wrapper:focus) {
  border: 1px solid #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
}

:deep(.ant-input[disabled]) {
  background-color: #2a2a2a !important;
  border: 1px solid #434343 !important;
  color: #8c8c8c !important;
}

:deep(.ant-input:hover) {
  border: 1px solid #40a9ff !important;
}

:deep(.ant-input-affix-wrapper:hover) {
  border: 1px solid #40a9ff !important;
}

:deep(.ant-input::placeholder) {
  color: #8c8c8c !important;
}

:deep(.ant-input:not([disabled]):hover) {
  border: 1px solid #40a9ff !important;
}

:deep(.ant-input:not([disabled]):focus) {
  border: 1px solid #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
}

:deep(.ant-btn-primary) {
  background-color: #1890ff;
  border-color: #1890ff;
  height: 48px;
}

:deep(.ant-btn-primary:hover) {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

:deep(.ant-form-item-extra) {
  color: #8c8c8c;
}
</style>
