<template>
  <div class="user-update-page">
      <!-- 页面头部 -->
      <div class="page-header">
        <h2>个人信息编辑</h2>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" />
        <p>正在加载用户信息...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <a-result
          status="error"
          title="加载失败"
          :sub-title="error"
        >
          <template #extra>
            <a-button type="primary" @click="loadUserInfo">
              重新加载
            </a-button>
          </template>
        </a-result>
      </div>

      <!-- 表单内容 -->
      <div v-else class="form-container">
        <a-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          layout="vertical"
          class="user-form"
        >
          <a-form-item label="用户头像" name="userAvatar">
            <div class="avatar-upload-row">
              <!-- 左侧头像展示 -->
              <div class="avatar-wrapper">
                <img
                  v-if="formData.userAvatar"
                  :src="formData.userAvatar"
                  class="avatar-img"
                  alt="头像"
                />
                <div v-else class="avatar-placeholder">暂无头像</div>
              </div>
              <!-- 右侧上传按钮 -->
              <a-upload
                :show-upload-list="false"
                :before-upload="beforeAvatarUpload"
                :custom-request="customAvatarUpload"
                accept="image/jpeg,image/png"
                :disabled="uploadingAvatar"
              >
                <a-button class="upload-avatar-btn" type="primary">
                  <template #icon>
                    <UploadOutlined />
                  </template>
                  上传头像
                </a-button>
              </a-upload>
            </div>
          </a-form-item>
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="用户昵称" name="userName">
                <a-input
                  v-model:value="formData.userName"
                  placeholder="请输入用户昵称"
                  size="large"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="用户邮箱" name="userEmail">
                <a-input
                  v-model:value="formData.userEmail"
                  placeholder="请输入用户邮箱"
                  size="large"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="用户账号" name="userAccount">
                <a-input
                  v-model:value="formData.userAccount"
                  disabled
                  size="large"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="用户角色" name="userRole">
                <a-input
                  v-model:value="formData.userRole"
                  disabled
                  size="large"
                >
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="用户简介" name="userProfile">
            <a-textarea
              v-model:value="formData.userProfile"
              placeholder="请输入用户简介"
              :rows="4"
              size="large"
            />
          </a-form-item>

          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="收藏数" name="favoriteCount">
                <a-input
                  v-model:value="formData.favoriteCount"
                  disabled
                  size="large"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="收藏上限" name="favoriteLimit">
                <a-input
                  v-model:value="formData.favoriteLimit"
                  disabled
                  size="large"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="创建时间" name="createTime">
            <a-input
              v-model:value="formattedCreateTime"
              disabled
              size="large"
            />
          </a-form-item>

          <a-form-item label="用户ID" name="id">
            <a-input
              v-model:value="formData.id"
              disabled
              size="large"
            />
          </a-form-item>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <a-space>
              <a-button
                type="primary"
                size="large"
                :loading="submitting"
                @click="handleSubmit"
              >
                保存修改
              </a-button>
              <a-button
                size="large"
                @click="handleReset"
              >
                重置
              </a-button>
              <a-button
                size="large"
                @click="goBack"
              >
                返回
              </a-button>
            </a-space>
          </div>
        </a-form>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { getCurrentUserUsingGet, userUpdateUsingPost } from '@/api/userController'
import { useLoginUserStore } from '@/stores/userLoginUserStore'
import dayjs from 'dayjs'
import { UploadOutlined } from '@ant-design/icons-vue'
import { uploadUserAvatarUsingPost } from '@/api/pictureController'

// 路由
const router = useRouter()
const route = useRoute()

// 用户状态
const loginUserStore = useLoginUserStore()

// 表单引用
const formRef = ref<FormInstance>()

// 状态管理
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const uploadingAvatar = ref(false)

// 表单数据
const formData = reactive({
  id: 0,
  userAccount: '',
  userName: '',
  userAvatar: '',
  userProfile: '',
  userEmail: '',
  userRole: '',
  favoriteCount: 0,
  favoriteLimit: 0,
  createTime: null as Date | null
})

// 表单验证规则
const rules = {
  userName: [
    // { required: true, message: '请输入用户昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '用户昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  userEmail: [
    // { required: true, message: '请输入用户邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  userProfile: [
    { max: 500, message: '用户简介不能超过 500 个字符', trigger: 'blur' }
  ],
  userAvatar: [
    // 可为空，不做校验
  ]
}

// 格式化创建时间
const formattedCreateTime = computed(() => {
  if (!formData.createTime) return ''
  return dayjs(formData.createTime).format('YYYY-MM-DD HH:mm:ss')
})

// 加载用户信息
const loadUserInfo = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await getCurrentUserUsingGet()
    if (response.data.code === 20000) {
      const userData = response.data.data
      Object.assign(formData, userData)
    } else {
      error.value = response.data.message || '加载用户信息失败'
    }
  } catch (err: any) {
    error.value = err.message || '加载用户信息失败'
    console.error('加载用户信息失败:', err)
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    submitting.value = true

    const response = await userUpdateUsingPost({
      id: formData.id,
      userName: formData.userName,
      userProfile: formData.userProfile,
      userEmail: formData.userEmail,
      userAvatar: formData.userAvatar,
    })

    if (response.data.code === 20000) {
      message.success('个人信息更新成功')

      // 更新本地用户状态
      loginUserStore.setLoginUser({
        ...loginUserStore.loginUser,
        userName: formData.userName,
        userAvatar: formData.userAvatar,
        userProfile: formData.userProfile,
        userEmail: formData.userEmail
      })

      // 返回上一页
      goBack()
    } else {
      message.error(response.data.message || '更新失败')
    }
  } catch (err: any) {
    if (err.errorFields) {
      message.error('请检查表单填写是否正确')
    } else {
      message.error(err.message || '更新失败')
    }
    console.error('提交表单失败:', err)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const handleReset = () => {
  formRef.value?.resetFields()
  loadUserInfo()
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 头像上传前校验
const beforeAvatarUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片！')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB！')
    return false
  }
  return true
}

// 自定义头像上传
const customAvatarUpload = async (options: any) => {
  uploadingAvatar.value = true
  try {
    const res = await uploadUserAvatarUsingPost({},options.file)
    if (res.data.code === 20000 && res.data.data) {
      formData.userAvatar = res.data.data // 自动填充URL
      message.success('头像上传成功')
    } else {
      message.error(res.data.message || '头像上传失败')
    }
  } catch (e) {
    message.error('头像上传失败')
  } finally {
    uploadingAvatar.value = false
  }
}

// 页面加载时获取用户信息
onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.user-update-page {
  min-height: 100vh;
  background: rgb(34, 34, 34);
  color: #ffffff;
}

.page-header {
  padding: 30px 0 20px 0;
  text-align: left;
}

.page-header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #ffffff;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #ffffff;
}

.loading-container p {
  margin-top: 16px;
  font-size: 16px;
}

.error-container {
  padding: 40px 0;
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.user-form {
  background: rgb(50, 50, 50);
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.form-actions {
  margin-top: 30px;
  text-align: center;
}

/* 覆盖 Ant Design 组件样式 */
:deep(.ant-form-item-label > label) {
  color: #ffffff !important;
  font-weight: 500;
}

:deep(.ant-input) {
  background: rgb(60, 60, 60) !important;
  border: 1px solid rgb(80, 80, 80) !important;
  color: #ffffff !important;
}

:deep(.ant-input:focus),
:deep(.ant-input-focused) {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
}

:deep(.ant-input[disabled]) {
  background: rgb(45, 45, 45) !important;
  color: #999999 !important;
}

:deep(.ant-textarea) {
  background: rgb(60, 60, 60) !important;
  border: 1px solid rgb(80, 80, 80) !important;
  color: #ffffff !important;
}

:deep(.ant-textarea:focus),
:deep(.ant-textarea-focused) {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
}

:deep(.ant-input::placeholder) {
  color: #999999 !important;
}

:deep(.ant-textarea::placeholder) {
  color: #999999 !important;
}

:deep(.ant-btn) {
  height: 40px;
  font-size: 14px;
  font-weight: 500;
}

:deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

:deep(.ant-btn-primary:hover) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

:deep(.ant-btn-default) {
  background: rgb(60, 60, 60);
  border: 1px solid rgb(80, 80, 80);
  color: #ffffff;
}

:deep(.ant-btn-default:hover) {
  background: rgb(70, 70, 70);
  border-color: rgb(90, 90, 90);
  color: #ffffff;
}

:deep(.ant-result-title) {
  color: #ffffff !important;
}

:deep(.ant-result-subtitle) {
  color: #cccccc !important;
}

:deep(.ant-spin-dot-item) {
  background-color: #1890ff !important;
}

.avatar-upload-row {
  display: flex;
  align-items: center;
  gap: 32px;
}
.avatar-wrapper {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  background: #222;
  border: 2px solid #666;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.avatar-placeholder {
  color: #aaa;
  font-size: 14px;
  background: #333;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.upload-avatar-btn {
  height: 40px;
  font-size: 16px;
  font-weight: 500;
  margin-left: 8px;
  display: flex;
  align-items: center;
}
</style>
