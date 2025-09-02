<template>
  <div id="teamMemberManagePage" class="dark-theme">
    <div class="page-header">
      <a-button @click="goBack" class="back-btn">
        ← 返回空间详情
      </a-button>
      <h1>{{ spaceName }} - 成员管理</h1>
      <p class="page-description">管理团队空间的成员，添加新成员或修改成员权限</p>
    </div>

    <!-- 添加新成员表单 -->
    <div class="add-member-section">
      <h2>添加新成员</h2>
      <a-form
        ref="addFormRef"
        :model="newMemberForm"
        layout="inline"
        @finish="handleAddMember"
        @finishFailed="onFinishFailed"
      >
        <a-form-item
          label="用户ID"
          name="userId"
          :rules="[{ required: true, message: '请输入用户ID!' }, { pattern: /^[1-9]\d*$/, message: '用户ID必须是大于0的整数!' }]"
        >
          <a-input
            v-model:value="newMemberForm.userId"
            placeholder="请输入用户ID"
            style="width: 200px"
          />
        </a-form-item>

        <a-form-item
          label="成员角色"
          name="spaceRole"
          :rules="[{ required: true, message: '请选择成员角色!' }]"
        >
          <a-select v-model:value="newMemberForm.spaceRole" placeholder="请选择角色" style="width: 120px">
            <a-select-option value="viewer">查看者</a-select-option>
            <a-select-option value="editor">编辑者</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="addLoading">
            添加成员
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 成员列表 -->
    <div class="members-section">
      <h2>成员列表</h2>
      <a-spin :spinning="loading">
        <div v-if="memberList.length > 0" class="member-list">
          <div v-for="member in memberList" :key="member.id" class="member-item">
            <div class="member-info">
              <a-avatar :size="40" :src="member.user?.userAvatar" />
              <div class="member-details">
                <div class="member-name">{{ member.user?.userName || '未知用户' }}</div>
                <div class="member-id">ID: {{ member.userId }}</div>
              </div>
            </div>

            <div class="member-role">
              <a-tag :color="getRoleColor(member.spaceRole)">
                {{ getRoleText(member.spaceRole) }}
              </a-tag>
            </div>

            <div class="member-actions">
              <a-button
                v-if="canEditRole(member)"
                type="link"
                size="small"
                @click="showEditRoleModal(member)"
              >
                修改角色
              </a-button>

              <a-popconfirm
                v-if="canRemoveMember(member)"
                title="确定要移除这个成员吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleRemoveMember(member.id)"
              >
                <a-button type="link" size="small" danger>
                  移除成员
                </a-button>
              </a-popconfirm>
            </div>
          </div>
        </div>

        <a-empty v-else description="暂无成员" />
      </a-spin>
    </div>

    <!-- 修改成员角色模态框 -->
    <a-modal
      v-model:open="editRoleModalVisible"
      title="修改成员角色"
      @ok="handleUpdateRole"
      @cancel="closeEditRoleModal"
      :confirm-loading="updateLoading"
    >
      <div v-if="editingMember">
        <p>成员: {{ editingMember.user?.userName || '未知用户' }} (ID: {{ editingMember.userId }})</p>
        <a-select v-model:value="editingRole" placeholder="请选择新角色" style="width: 100%">
          <a-select-option value="viewer">查看者</a-select-option>
          <a-select-option value="editor">编辑者</a-select-option>
          <a-select-option value="admin">管理员</a-select-option>
        </a-select>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  listSpaceUserUsingPost,
  addSpaceUserUsingPost,
  editSpaceUserUsingPost,
  deleteSpaceUserUsingPost
} from '@/api/spaceUserController'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController'
import type { FormInstance } from 'ant-design-vue'

const route = useRoute()
const router = useRouter()

// 表单引用
const addFormRef = ref<FormInstance>()

// 状态
const loading = ref(false)
const addLoading = ref(false)
const updateLoading = ref(false)
const spaceName = ref('')
const spaceId = route.params.id as string

// 成员列表
const memberList = ref<API.SpaceUser[]>([])

// 新成员表单
const newMemberForm = reactive({
  userId: '' as string,
  spaceRole: 'viewer' as string,
})

// 编辑角色相关
const editRoleModalVisible = ref(false)
const editingMember = ref<API.SpaceUser | null>(null)
const editingRole = ref('viewer')

// 获取空间信息
const fetchSpaceInfo = async () => {
  try {
    const res = await getSpaceVoByIdUsingGet({ id: spaceId })
    if (res.data.code === 20000 && res.data.data) {
      spaceName.value = res.data.data.spaceName
    }
  } catch (error) {
    console.error('获取空间信息失败:', error)
  }
}

// 获取成员列表
const fetchMemberList = async () => {
  loading.value = true
  try {
    const res = await listSpaceUserUsingPost({
      spaceId: spaceId,
    })

    if (res.data.code === 20000 && res.data.data) {
      memberList.value = res.data.data
      console.log('获取到成员列表:', memberList.value)
    } else {
      console.error('获取成员列表失败:', res.data)
      message.error('获取成员列表失败: ' + (res.data.message || '未知错误'))
    }
  } catch (error: any) {
    console.error('获取成员列表失败:', error)
    message.error('获取成员列表失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 添加新成员
const handleAddMember = async () => {
  if (!newMemberForm.userId || !newMemberForm.spaceRole) {
    message.error('请填写完整信息')
    return
  }

  console.log('正在添加成员，userId:', newMemberForm.userId, '类型:', typeof newMemberForm.userId)

  addLoading.value = true
  try {
    // 直接使用字符串格式的空间ID和用户ID，避免数字精度问题
    console.log('添加成员，spaceId:', spaceId, 'userId:', newMemberForm.userId)
    const res = await addSpaceUserUsingPost({
      spaceId: spaceId,
      userId: newMemberForm.userId,
      spaceRole: newMemberForm.spaceRole,
    })

    if (res.data.code === 20000) {
      message.success('成员添加成功')
      // 重置表单
      newMemberForm.userId = ''
      newMemberForm.spaceRole = 'viewer'
      // 重新获取成员列表
      fetchMemberList()
    } else {
      message.error('添加成员失败: ' + (res.data.message || '未知错误'))
    }
  } catch (error: any) {
    console.error('添加成员失败:', error)
    message.error('添加成员失败: ' + (error.response?.data?.message || error.message))
  } finally {
    addLoading.value = false
  }
}

// 显示编辑角色模态框
const showEditRoleModal = (member: API.SpaceUser) => {
  editingMember.value = member
  editingRole.value = member.spaceRole
  editRoleModalVisible.value = true
}

// 关闭编辑角色模态框
const closeEditRoleModal = () => {
  editRoleModalVisible.value = false
  editingMember.value = null
  editingRole.value = ''
}

// 更新成员角色
const handleUpdateRole = async () => {
  if (!editingMember.value || !editingRole.value) {
    message.error('请选择新角色')
    return
  }

  updateLoading.value = true
  try {
    const res = await editSpaceUserUsingPost({
      id: editingMember.value.id,
      spaceRole: editingRole.value,
    })

    if (res.data.code === 20000) {
      message.success('角色修改成功')
      closeEditRoleModal()
      fetchMemberList()
    } else {
      message.error('修改角色失败: ' + (res.data.message || '未知错误'))
    }
  } catch (error: any) {
    console.error('修改角色失败:', error)
    message.error('修改角色失败: ' + (error.response?.data?.message || error.message))
  } finally {
    updateLoading.value = false
  }
}

// 移除成员
const handleRemoveMember = async (memberId: number) => {
  try {
    const res = await deleteSpaceUserUsingPost({
      id: memberId,
    })

    if (res.data.code === 20000) {
      message.success('成员移除成功')
      fetchMemberList()
    } else {
      message.error('移除成员失败: ' + (res.data.message || '未知错误'))
    }
  } catch (error: any) {
    console.error('移除成员失败:', error)
    message.error('移除成员失败: ' + (error.response?.data?.message || error.message))
  }
}

// 表单验证失败处理
const onFinishFailed = (errorInfo: any) => {
  console.error('表单验证失败:', errorInfo)
}

// 用户ID变化处理 - 现在通过v-model自动绑定，无需额外处理

// 获取角色文本
const getRoleText = (role: string) => {
  const roleMap = {
    viewer: '查看者',
    editor: '编辑者',
    admin: '管理员',
  }
  return roleMap[role as keyof typeof roleMap] || role
}

// 获取角色颜色
const getRoleColor = (role: string) => {
  const colorMap = {
    viewer: 'blue',
    editor: 'green',
    admin: 'red',
  }
  return colorMap[role as keyof typeof colorMap] || 'default'
}

// 判断是否可以编辑角色（暂时允许所有成员都可以编辑）
const canEditRole = (member: API.SpaceUser) => {
  return true
}

// 判断是否可以移除成员（暂时允许所有成员都可以移除）
const canRemoveMember = (member: API.SpaceUser) => {
  return true
}

// 返回空间详情
const goBack = () => {
  router.push(`/space/${spaceId}`)
}

// 页面加载
onMounted(() => {
  fetchSpaceInfo()
  fetchMemberList()
})
</script>

<style scoped>
.dark-theme {
  background: rgb(34, 34, 34);
  color: #ffffff;
  min-height: 100vh;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.back-btn {
  background: rgba(64, 169, 255, 0.1);
  border: 1px solid #40a9ff;
  color: #40a9ff;
}

.back-btn:hover {
  background: rgba(64, 169, 255, 0.2);
  border-color: #69c0ff;
  color: #69c0ff;
}

.page-header h1 {
  margin: 0;
  color: #ffffff;
}

.page-description {
  margin: 10px 0 0 0;
  color: #cccccc;
  font-size: 14px;
}

.add-member-section,
.members-section {
  background: rgb(50, 50, 50);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.add-member-section h2,
.members-section h2 {
  color: #ffffff;
  margin-bottom: 16px;
  border-bottom: 2px solid #1890ff;
  padding-bottom: 8px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgb(40, 40, 40);
  border-radius: 6px;
  border: 1px solid rgb(60, 60, 60);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  font-weight: 500;
  color: #ffffff;
}

.member-id {
  font-size: 12px;
  color: #cccccc;
}

.member-role {
  flex: 0 0 auto;
}

.member-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 覆盖 Ant Design 样式 */
:deep(.ant-form-item-label label) {
  color: #cccccc;
}

:deep(.ant-input-number) {
  background: rgb(60, 60, 60);
  border: 1px solid rgb(80, 80, 80);
  color: #ffffff;
}

:deep(.ant-input-number input) {
  background: rgb(60, 60, 60);
  color: #ffffff;
}

:deep(.ant-input-number:hover) {
  border-color: #40a9ff;
}

:deep(.ant-input-number-focused) {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2);
}

:deep(.ant-select-selector) {
  background: rgb(60, 60, 60) !important;
  border: 1px solid rgb(80, 80, 80) !important;
  color: #ffffff !important;
}

:deep(.ant-select-selection-item) {
  color: #ffffff !important;
}

:deep(.ant-select:hover .ant-select-selector) {
  border-color: #40a9ff !important;
}

:deep(.ant-select-focused .ant-select-selector) {
  border-color: #40a9ff !important;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2) !important;
}

:deep(.ant-select-dropdown) {
  background: rgb(50, 50, 50) !important;
}

:deep(.ant-select-dropdown .ant-select-item) {
  color: #cccccc !important;
}

:deep(.ant-select-dropdown .ant-select-item:hover) {
  background: rgba(64, 169, 255, 0.1) !important;
  color: #40a9ff !important;
}

:deep(.ant-select-dropdown .ant-select-item-option-selected) {
  background: rgba(64, 169, 255, 0.2) !important;
  color: #40a9ff !important;
}

:deep(.ant-btn-primary) {
  background: #1890ff !important;
  border-color: #1890ff !important;
}

:deep(.ant-btn-primary:hover) {
  background: #40a9ff !important;
  border-color: #40a9ff !important;
}

:deep(.ant-modal) {
  background: rgb(50, 50, 50);
}

:deep(.ant-modal-content) {
  background: rgb(50, 50, 50);
  border: 1px solid rgb(60, 60, 60);
}

:deep(.ant-modal-header) {
  background: rgb(50, 50, 50);
  border-bottom: 1px solid rgb(60, 60, 60);
}

:deep(.ant-modal-title) {
  color: #ffffff;
}

:deep(.ant-modal-body) {
  color: #cccccc;
}

:deep(.ant-modal-footer) {
  border-top: 1px solid rgb(60, 60, 60);
}

:deep(.ant-modal-close) {
  color: #cccccc;
}

:deep(.ant-modal-close:hover) {
  color: #ffffff;
}

:deep(.ant-tag) {
  border: none;
}

:deep(.ant-popconfirm) {
  background: rgb(50, 50, 50) !important;
  border: 1px solid rgb(60, 60, 60);
}

:deep(.ant-popconfirm-message) {
  color: #cccccc;
}

:deep(.ant-popconfirm-buttons .ant-btn) {
  background: rgb(60, 60, 60);
  border: 1px solid rgb(80, 80, 80);
  color: #cccccc;
}

:deep(.ant-popconfirm-buttons .ant-btn-primary) {
  background: #1890ff;
  border-color: #1890ff;
  color: #ffffff;
}
</style>