<template>
  <div id="spaceManagePage" class="dark-theme">
    <!-- 分页查询用的表单 -->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="空间名称">
        <a-input v-model:value="searchParams.spaceName" placeholder="请输入空间名称" />
      </a-form-item>
      <a-form-item label="用户ID">
        <a-input v-model:value="searchParams.userId" placeholder="请输入用户ID" />
      </a-form-item>
      <a-form-item label="空间级别">
        <a-select v-model:value="searchParams.spaceLevel" placeholder="请选择空间级别" allowClear>
          <a-select-option :value="0">普通版</a-select-option>
          <a-select-option :value="1">专业版</a-select-option>
          <a-select-option :value="2">旗舰版</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>
    
    <!-- 加点上下边距 -->
    <div style="margin-top: 16px" />
    
    <!-- 分页数据展示表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'spaceLevel'">
          <div v-if="record.spaceLevel === 0">
            <a-tag color="blue">普通版</a-tag>
          </div>
          <div v-else-if="record.spaceLevel === 1">
            <a-tag color="green">专业版</a-tag>
          </div>
          <div v-else-if="record.spaceLevel === 2">
            <a-tag color="purple">旗舰版</a-tag>
          </div>
        </template>
        
        <template v-else-if="column.dataIndex === 'maxSize'">
          {{ formatFileSize(record.maxSize) }}
        </template>
        
        <template v-else-if="column.dataIndex === 'totalSize'">
          {{ formatFileSize(record.totalSize) }}
        </template>
        
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        
        <template v-else-if="column.dataIndex === 'updateTime'">
          {{ dayjs(record.updateTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        
        <template v-else-if="column.key === 'action'">
          <!-- 空间修改弹窗 -->
          <div>
            <a-button type="primary" @click="openEditModal(record)" style="margin-right: 8px">修改</a-button>
            <a-modal
              v-model:open="visible"
              title="空间修改"
              ok-text="确认修改"
              cancel-text="取消"
              @ok="onOk"
              width="600px"
            >
              <a-form ref="formRef" :model="formState" layout="vertical" name="form_in_modal">
                <a-form-item
                  name="spaceName"
                  label="空间名称"
                  :rules="[{ required: true, message: '请输入空间名称!' }]"
                >
                  <template #extra>
                    <span style="color: #8c8c8c; font-size: 12px;">用户个人空间的显示名称，用于区分不同的存储空间</span>
                  </template>
                  <a-input v-model:value="formState.spaceName" placeholder="请输入空间名称" />
                </a-form-item>
                <a-form-item
                  name="spaceLevel"
                  label="空间级别"
                  :rules="[{ required: true, message: '请选择空间级别!' }]"
                >
                  <template #extra>
                    <span style="color: #8c8c8c; font-size: 12px;">空间等级决定了存储容量和图片数量上限</span>
                  </template>
                  <a-select v-model:value="formState.spaceLevel" placeholder="请选择空间级别">
                    <a-select-option :value="0">普通版</a-select-option>
                    <a-select-option :value="1">专业版</a-select-option>
                    <a-select-option :value="2">旗舰版</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item name="maxSize" label="最大空间大小">
                  <template #extra>
                    <span style="color: #8c8c8c; font-size: 12px;">该空间允许存储图片的最大总容量</span>
                  </template>
                  <a-input 
                    v-model:value="formState.maxSizeMB" 
                    placeholder="请输入最大空间大小(MB)" 
                    @change="onMaxSizeMBChange"
                  />
                  <div style="margin-top: 4px; color: #8c8c8c; font-size: 12px;">
                    当前值: {{ formatFileSize(formState.maxSize) }}
                  </div>
                </a-form-item>
                <a-form-item name="maxCount" label="最大图片数量">
                  <template #extra>
                    <span style="color: #8c8c8c; font-size: 12px;">该空间允许存储图片的最大数量</span>
                  </template>
                  <a-input v-model:value="formState.maxCount" placeholder="请输入最大图片数量" />
                </a-form-item>
              </a-form>
            </a-modal>
          </div>
          
          <!-- 空间删除按钮 -->
          <a-popconfirm
            title="你确认要删除该空间吗?"
            ok-text="Yes"
            cancel-text="No"
            @confirm="doDelete(record.id)"
            @cancel="cancelDelete"
          >
            <a-button danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { 
  deleteSpaceUsingPost, 
  listSpaceByPageUsingPost, 
  updateSpaceUsingPost 
} from '@/api/spaceController'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import type { FormInstance } from 'ant-design-vue'

/* 需要展示的列 */
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '空间名称',
    dataIndex: 'spaceName',
    width: 150,
  },
  {
    title: '空间级别',
    dataIndex: 'spaceLevel',
    width: 100,
  },
  {
    title: '最大空间大小',
    dataIndex: 'maxSize',
    width: 120,
  },
  {
    title: '最大图片数量',
    dataIndex: 'maxCount',
    width: 120,
  },
  {
    title: '当前使用大小',
    dataIndex: 'totalSize',
    width: 120,
  },
  {
    title: '当前图片数量',
    dataIndex: 'totalCount',
    width: 120,
  },
  {
    title: '用户ID',
    dataIndex: 'userId',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 160,
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    width: 160,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
]

// 定义数据
const dataList = ref<API.Space[]>([])
const total = ref(0)

// 定义分页搜索条件
const searchParams = reactive<API.SpaceQueryRequest>({
  pageNum: 1,
  pageSize: 8,
})

// 分页参数对象
const pagination = computed(() => {
  return {
    current: searchParams.pageNum ?? 1,
    pageSize: searchParams.pageSize ?? 8,
    total: total.value,
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
  }
})

// 分页改变时事件
const doTableChange = (pages: any) => {
  searchParams.pageNum = pages.current
  searchParams.pageSize = pages.pageSize
  fetchDataList()
}

// 定义查询函数
const fetchDataList = async () => {
  const res = await listSpaceByPageUsingPost({
    ...searchParams,
  })
  if (res.data.code === 20000 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('分页查询失败' + res.data.message)
  }
}

// 页面加载时获取一次数据
onMounted(() => {
  fetchDataList()
})

// 条件搜索
const doSearch = () => {
  // 重置页码
  searchParams.pageNum = 1
  fetchDataList()
}

// 删除空间
const doDelete = async (id: number) => {
  if (!id) {
    message.error('删除失败')
    return
  }
  const res = await deleteSpaceUsingPost({ id })
  if (res.data.code === 20000) {
    message.success('删除成功')
    // 更新数据
    await fetchDataList()
  } else {
    message.error('删除失败' + res.data.message)
  }
}

// 取消删除空间
const cancelDelete = (e: MouseEvent) => {
  console.log(e)
  message.error('取消删除空间')
}

// 编辑空间弹窗使用的
const formRef = ref<FormInstance>()
const visible = ref(false)
const formState = reactive({
  id: undefined as number | undefined,
  spaceName: '',
  spaceLevel: undefined as number | undefined,
  maxSize: undefined as number | undefined,
  maxSizeMB: undefined as number | undefined,
  maxCount: undefined as number | undefined,
})

// 打开编辑模态框
const openEditModal = (space: API.Space) => {
  // 填充表单数据
  formState.id = space.id
  formState.spaceName = space.spaceName || ''
  formState.spaceLevel = space.spaceLevel
  formState.maxSize = space.maxSize
  formState.maxSizeMB = space.maxSize ? Math.round(space.maxSize / (1024 * 1024)) : undefined
  formState.maxCount = space.maxCount
  visible.value = true
}

// 提交编辑表单
const onOk = async () => {
  try {
    await formRef.value?.validate()
    // 构造提交数据
    const submitData: API.SpaceUpdateRequest = {
      id: formState.id,
      spaceName: formState.spaceName,
      spaceLevel: formState.spaceLevel,
      maxSize: formState.maxSize,
      maxCount: formState.maxCount,
    }
    const res = await updateSpaceUsingPost(submitData)
    if (res.data.code === 20000) {
      message.success('空间修改成功')
      visible.value = false
      // 刷新数据
      await fetchDataList()
    } else {
      message.error('修改失败：' + res.data.message)
    }
  } catch (error) {
    message.error('表单验证失败')
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number | undefined) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// MB转字节的处理函数
const onMaxSizeMBChange = (e: any) => {
  const mbValue = parseFloat(e.target.value)
  if (!isNaN(mbValue) && mbValue >= 0) {
    formState.maxSize = Math.round(mbValue * 1024 * 1024)
  }
}
</script>

<style scoped>
.dark-theme {
  background: rgb(34, 34, 34);
  min-height: 100vh;
  padding: 20px;
  color: #ffffff;
}

/* 覆盖 Ant Design 组件样式 */
:deep(.ant-form) {
  color: #ffffff;
}

:deep(.ant-form-item-label > label) {
  color: #ffffff !important;
}

:deep(.ant-input) {
  background-color: #2a2a2a;
  border-color: #434343;
  color: #ffffff;
}

:deep(.ant-input:focus) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

:deep(.ant-select-selector) {
  background-color: #2a2a2a !important;
  border-color: #434343 !important;
  color: #ffffff !important;
}

:deep(.ant-select-selection-item) {
  color: #ffffff !important;
}

:deep(.ant-table) {
  background-color: #2a2a2a;
  color: #ffffff;
}

:deep(.ant-table-thead > tr > th) {
  background-color: #1f1f1f !important;
  color: #ffffff !important;
  border-bottom: 1px solid #434343 !important;
}

:deep(.ant-table-tbody > tr > td) {
  background-color: #2a2a2a !important;
  color: #ffffff !important;
  border-bottom: 1px solid #434343 !important;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #3a3a3a !important;
}

:deep(.ant-pagination) {
  color: #ffffff;
}

:deep(.ant-pagination-item) {
  background-color: #2a2a2a;
  border-color: #434343;
}

:deep(.ant-pagination-item a) {
  color: #ffffff;
}

:deep(.ant-pagination-item-active) {
  background-color: #1890ff;
  border-color: #1890ff;
}

:deep(.ant-pagination-prev button),
:deep(.ant-pagination-next button) {
  background-color: #2a2a2a;
  border-color: #434343;
  color: #ffffff;
}

:deep(.ant-modal-content) {
  background-color: #2a2a2a;
  color: #ffffff;
}

:deep(.ant-modal-header) {
  background-color: #2a2a2a;
  border-bottom: 1px solid #434343;
}

:deep(.ant-modal-title) {
  color: #ffffff;
}

:deep(.ant-modal-footer) {
  border-top: 1px solid #434343;
}

:deep(.ant-btn) {
  border-color: #434343;
}

:deep(.ant-btn-primary) {
  background-color: #1890ff;
  border-color: #1890ff;
}

:deep(.ant-btn-danger) {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}

:deep(.ant-tag) {
  border: none;
}
</style>
