<template>
  <div id="pictureManagePage" class="dark-theme">
    <!--    分页查询用的表单-->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="关键词" name="searchText">
        <a-input
          v-model:value="searchParams.searchText"
          placeholder="从名称和简介搜索"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="分类" name="category">
        <a-input v-model:value="searchParams.category" placeholder="请输入分类" allow-clear />
      </a-form-item>
      <a-form-item label="标签" name="tags">
        <a-select
          v-model:value="searchParams.tags"
          mode="tags"
          placeholder="请输入标签"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="审核状态" name="reviewStatus">
        <a-select
          v-model:value="searchParams.reviewStatus"
          placeholder="请选择审核状态"
          style="min-width: 150px"
          allow-clear
        >
          <a-select-option :value="0">待审核</a-select-option>
          <a-select-option :value="1">审核通过</a-select-option>
          <a-select-option :value="2">审核驳回</a-select-option>
          <a-select-option :value="3">违规下架</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="创建时间" name="timeRange">
        <a-range-picker
          v-model:value="searchParams.timeRange"
          style="width: 240px"
          placeholder="['开始时间', '结束时间']"
          format="YYYY-MM-DD HH:mm:ss"
          show-time
          allow-clear
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>
    <!--加点上下边距-->
    <div style="margin-top: 16px" />
    <!--    分页数据展示表格-->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      @change="doTableChange"
    >
      //column：当前列名，record：当前数据
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'picUrl'">
          <a-image :src="record.picUrl" :width="140" />
        </template>
        <template v-if="column.dataIndex === 'tags'">
          <a-space wrap>
            <a-tag v-for="tag in JSON.parse(record.tags || '[]')" :key="tag">{{ tag }}</a-tag>
          </a-space>
        </template>
        <!-- 图片信息 -->
        <template v-if="column.dataIndex === 'picInfo'">
          <div>格式：{{ record.picFormat }}</div>
          <div>宽度：{{ record.picWidth }}</div>
          <div>高度：{{ record.picHeight }}</div>
          <div>宽高比：{{ record.picScale }}</div>
          <div>大小：{{ (record.picSize / 1024).toFixed(2) }}KB</div>
        </template>
        <template v-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-if="column.dataIndex === 'reviewStatus'">
            <div v-if="record.reviewStatus === 0">
              待审核
              <div v-if="record.reviewerId" style="font-size: 12px; color: #666;">审核人ID: {{ record.reviewerId }}</div>
            </div>
            <div v-else-if="record.reviewStatus === 1 ">
              审核通过
              <div v-if="record.reviewerId" style="font-size: 12px; color: #666;">审核人ID: {{ record.reviewerId }}</div>
            </div>
            <div v-else-if="record.reviewStatus === 2 ">
              审核驳回
              <div v-if="record.reviewerId" style="font-size: 12px; color: #666;">审核人ID: {{ record.reviewerId }}</div>
            </div>
            <div v-else-if="record.reviewStatus === 3 ">
              违规下架
              <div v-if="record.reviewerId" style="font-size: 12px; color: #666;">审核人ID: {{ record.reviewerId }}</div>
            </div>
        </template>

        <template v-else-if="column.key === 'review'">
          <!-- 审核按钮 -->
          <template v-if="record.reviewStatus === 0">
            <!-- 待审核状态：显示审核通过和审核驳回按钮 -->
            <a-button 
              type="primary" 
              size="small" 
              @click="showReviewModal(record, 1)"
              style="margin-right: 8px;"
            >
              通过
            </a-button>
            <a-button 
              type="primary" 
              danger 
              size="small" 
              @click="showReviewModal(record, 2)"
              style="margin-right: 8px;"
            >
              驳回
            </a-button>
          </template>
          <template v-else-if="record.reviewStatus === 1">
            <!-- 审核通过状态：显示下架按钮 -->
            <a-button 
              type="primary" 
              danger 
              size="small" 
              @click="showReviewModal(record, 3)"
              style="margin-right: 8px;"
            >
              下架
            </a-button>
          </template>
          <template v-else-if="record.reviewStatus === 2">
            <!-- 审核驳回状态：显示重新审核按钮 -->
            <a-button 
              type="primary" 
              size="small" 
              @click="showReviewModal(record, 1)"
              style="margin-right: 8px;"
            >
              重新审核
            </a-button>
          </template>
          <template v-else-if="record.reviewStatus === 3">
            <!-- 违规下架状态：显示恢复按钮 -->
            <a-button 
              type="primary" 
              size="small" 
              @click="showReviewModal(record, 1)"
              style="margin-right: 8px;"
            >
              恢复
            </a-button>
          </template>
        </template>

        <template v-else-if="column.key === 'action'">
          <!--     图片编辑按钮   跳转到我们的创建页面+id 变成了编辑页面   -->
          <a-button type="link" :href="`/addPicture?id=${record.id}`" target="_blank"
            >编辑</a-button
          >
          
          <!--          图片删除按钮-->
          <a-popconfirm
            title="你确认要删除该图片吗?"
            ok-text="Yes"
            cancel-text="No"
            @confirm="doDelete(record.id)"
            @cancel="cancelDelete"
          >
            <a-button danger size="small">删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
    
    <!-- 审核模态框 -->
    <a-modal
      v-model:open="reviewModalVisible"
      title="图片审核"
      @ok="handleReviewSubmit"
      @cancel="handleReviewCancel"
      :confirm-loading="reviewSubmitting"
    >
      <div v-if="currentReviewPicture">
        <div style="margin-bottom: 16px;">
          <a-image :src="currentReviewPicture.picUrl" :width="200" />
        </div>
        <div style="margin-bottom: 16px;">
          <strong>图片名称：</strong>{{ currentReviewPicture.picName }}
        </div>
        <div style="margin-bottom: 16px;">
          <strong>当前状态：</strong>
          <span v-if="currentReviewPicture.reviewStatus === 0">待审核</span>
          <span v-else-if="currentReviewPicture.reviewStatus === 1">审核通过</span>
          <span v-else-if="currentReviewPicture.reviewStatus === 2">审核驳回</span>
          <span v-else-if="currentReviewPicture.reviewStatus === 3">违规下架</span>
        </div>
        <div style="margin-bottom: 16px;">
          <strong>审核操作：</strong>
          <span v-if="currentReviewStatus === 1" style="color: #52c41a;">审核通过</span>
          <span v-else-if="currentReviewStatus === 2" style="color: #f5222d;">审核驳回</span>
          <span v-else-if="currentReviewStatus === 3" style="color: #f5222d;">违规下架</span>
        </div>
        <a-form-item label="审核信息">
          <a-textarea
            v-model:value="reviewMessage"
            placeholder="请输入审核信息（可选）"
            :rows="4"
            :maxlength="500"
          />
        </a-form-item>
      </div>
    </a-modal>
  </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import { deletePictureByIdUsingPost, getPicturePagesUsingPost, doPictureReviewUsingPost } from '@/api/pictureController'

// 扩展搜索参数类型，添加前端需要的时间范围字段
interface ExtendedSearchParams extends API.PicturePagesRequest {
  timeRange?: [Dayjs, Dayjs] | undefined
}

/*需要展示的列*/
const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '图片',
    dataIndex: 'picUrl',
  },
  {
    title: '名称',
    dataIndex: 'picName',
  },
  {
    title: '简介',
    dataIndex: 'introduction',
    ellipsis: true,
  },
  {
    title: '分类',
    dataIndex: 'category',
  },
  {
    title: '标签',
    dataIndex: 'tags',
  },
  {
    title: '图片信息',
    dataIndex: 'picInfo',
  },
  {
    title: ' 上传者id',
    dataIndex: 'userId',
    width: 80,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
  },
  {
    title: '图片状态',
    dataIndex: 'reviewStatus',
  },
  {
    title: '审核',
    key: 'review',
    width: 120,
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
  },
]

//定义数据
const dataList = ref<API.Picture[]>([])
const total = ref(0)

//定义分页搜索条件 （下面类型是给我们后端用的,cursor生成继承了我们的PicturePagesRequest）
const searchParams = reactive<ExtendedSearchParams>({
  pageNum: 1,
  pageSize: 8,
  sortField: 'create_time',
  sortOrder: 'descend',
  timeRange: undefined,
})

// 审核相关的响应式数据
const reviewModalVisible = ref(false)
const reviewSubmitting = ref(false)
const currentReviewPicture = ref<API.Picture | null>(null)
const currentReviewStatus = ref<number>(0)
const reviewMessage = ref('')

//  分页参数对象-放组件里的。组件里的api
const pagination = computed(() => {
  return {
    current: searchParams.pageNum ?? 1,
    pageSize: searchParams.pageSize ?? 10,
    total: total.value,
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
  }
})

//分页改变时事件
const doTableChange = (pages: any) => {
  //把组件里改变的值给到我们searchParams，然后再分页查询一次
  searchParams.pageNum = pages.current
  searchParams.pageSize = pages.pageSize
  fetchDataList()
}

//定义查询函数
const fetchDataList = async () => {
  // 处理时间范围参数
  const requestParams: any = {
    ...searchParams,
  }

  // 如果有时间范围，转换为后端需要的格式
  if (searchParams.timeRange && searchParams.timeRange.length === 2) {
    // 发送 ISO 8601 格式的时间字符串
    requestParams.startTime = searchParams.timeRange[0].toISOString()
    requestParams.endTime = searchParams.timeRange[1].toISOString()
  }

  // 删除前端用的时间范围字段
  delete requestParams.timeRange

  const res = await getPicturePagesUsingPost(requestParams)
  if (res.data.code === 20000 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('分页查询失败' + res.data.message)
  }
}
//页面加载时获取一次数据
onMounted(() => {
  fetchDataList()
})

//条件搜索
const doSearch = () => {
  //重置页码
  searchParams.pageNum = 1
  fetchDataList()
}

// 显示审核模态框
const showReviewModal = (picture: API.Picture, reviewStatus: number) => {
  currentReviewPicture.value = picture
  currentReviewStatus.value = reviewStatus
  reviewMessage.value = ''
  reviewModalVisible.value = true
}

// 处理审核提交
const handleReviewSubmit = async () => {
  if (!currentReviewPicture.value) {
    message.error('审核信息错误')
    return
  }

  reviewSubmitting.value = true
  
  try {
    const res = await doPictureReviewUsingPost({
      id: currentReviewPicture.value.id,
      reviewStatus: currentReviewStatus.value,
      reviewMessage: reviewMessage.value || undefined,
    })
    
    if (res.data.code === 20000) {
      message.success('审核成功')
      reviewModalVisible.value = false
      // 刷新数据
      await fetchDataList()
    } else {
      message.error('审核失败：' + res.data.message)
    }
  } catch (error) {
    message.error('审核失败')
  } finally {
    reviewSubmitting.value = false
  }
}

// 取消审核
const handleReviewCancel = () => {
  reviewModalVisible.value = false
  currentReviewPicture.value = null
  currentReviewStatus.value = 0
  reviewMessage.value = ''
}

//删除图片
const doDelete = async (id: string) => {
  if (!id) {
    message.error('删除失败')
    return
  }
  const res = await deletePictureByIdUsingPost({ id: parseInt(id) })
  if (res.data.code === 20000) {
    message.success('删除成功')
    //更新数据
    await fetchDataList()
  } else {
    message.error('删除失败' + res.data.message)
  }
}
//取消删除图片
const cancelDelete = (e: MouseEvent) => {
  console.log(e)
  message.error('取消删除图片')
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
  background: transparent;
}

:deep(.ant-input) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #ffffff !important;
}

:deep(.ant-input:hover) {
  border-color: rgb(80, 80, 80) !important;
  background: rgb(50, 50, 50) !important;
}

:deep(.ant-input:focus) {
  border-color: #40a9ff !important;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2) !important;
  background: rgb(50, 50, 50) !important;
}

:deep(.ant-input:focus-within) {
  background: rgb(50, 50, 50) !important;
}

:deep(.ant-input-affix-wrapper) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
}

:deep(.ant-input-affix-wrapper:hover) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(80, 80, 80) !important;
}

:deep(.ant-input-affix-wrapper:focus) {
  background: rgb(50, 50, 50) !important;
  border-color: #40a9ff !important;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2) !important;
}

:deep(.ant-input-affix-wrapper:focus-within) {
  background: rgb(50, 50, 50) !important;
  border-color: #40a9ff !important;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2) !important;
}

:deep(.ant-input-affix-wrapper .ant-input) {
  background: transparent !important;
}

:deep(.ant-input-suffix) {
  background: transparent !important;
  color: #cccccc !important;
}

:deep(.ant-input-clear-icon) {
  color: #cccccc !important;
}

:deep(.ant-input-clear-icon:hover) {
  color: #ffffff !important;
}

:deep(.ant-btn-primary) {
  background: #40a9ff !important;
  border-color: #40a9ff !important;
}

:deep(.ant-btn-primary:hover) {
  background: #69c0ff !important;
  border-color: #69c0ff !important;
}

:deep(.ant-table) {
  background: rgb(50, 50, 50) !important;
  color: #ffffff !important;
}

:deep(.ant-table-thead > tr > th) {
  background: rgb(60, 60, 60) !important;
  color: #ffffff !important;
  border-bottom: 1px solid rgb(80, 80, 80) !important;
}

:deep(.ant-table-tbody > tr > td) {
  background: rgb(50, 50, 50) !important;
  color: #ffffff !important;
  border-bottom: 1px solid rgb(60, 60, 60) !important;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: rgb(60, 60, 60) !important;
}

:deep(.ant-pagination) {
  color: #cccccc !important;
}

:deep(.ant-pagination .ant-pagination-item) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
}

:deep(.ant-pagination .ant-pagination-item a) {
  color: #cccccc !important;
}

:deep(.ant-pagination .ant-pagination-item-active) {
  background: rgb(60, 60, 60) !important;
  border-color: rgb(80, 80, 80) !important;
}

:deep(.ant-pagination .ant-pagination-item-active a) {
  color: #ffffff !important;
}

:deep(.ant-pagination .ant-pagination-prev, .ant-pagination .ant-pagination-next) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
}

:deep(.ant-pagination .ant-pagination-prev a, .ant-pagination .ant-pagination-next a) {
  color: #cccccc !important;
}

:deep(.ant-pagination .ant-pagination-options-quick-jumper input) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #ffffff !important;
}

:deep(.ant-select) {
  color: #ffffff !important;
}

:deep(.ant-select-selector) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #ffffff !important;
}

:deep(.ant-select-arrow) {
  color: #ffffff !important;
}

:deep(.ant-select-dropdown) {
  background: rgb(50, 50, 50) !important;
}

:deep(.ant-select-item) {
  color: #ffffff !important;
}

:deep(.ant-select-item-option-selected) {
  background: rgba(64, 169, 255, 0.2) !important;
  color: #69c0ff !important;
}

:deep(.ant-form-item-label > label) {
  color: #ffffff !important;
}

:deep(.ant-picker) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #ffffff !important;
}

:deep(.ant-picker-input > input) {
  color: #ffffff !important;
}

:deep(.ant-picker-suffix) {
  color: #ffffff !important;
}

:deep(.ant-picker-dropdown) {
  background: rgb(50, 50, 50) !important;
}

:deep(.ant-tag) {
  background: rgba(64, 169, 255, 0.2) !important;
  border-color: #40a9ff !important;
  color: #69c0ff !important;
}

:deep(.ant-btn-dangerous) {
  background: #ff4d4f !important;
  border-color: #ff4d4f !important;
  color: #ffffff !important;
}

:deep(.ant-btn-dangerous:hover) {
  background: #ff7875 !important;
  border-color: #ff7875 !important;
}

:deep(.ant-image) {
  border-radius: 8px;
  border: 1px solid rgb(60, 60, 60);
}

:deep(.ant-modal) {
  color: #ffffff !important;
}

:deep(.ant-modal-content) {
  background: rgb(50, 50, 50) !important;
}

:deep(.ant-modal-header) {
  background: rgb(50, 50, 50) !important;
  border-bottom: 1px solid rgb(60, 60, 60) !important;
}

:deep(.ant-modal-title) {
  color: #ffffff !important;
}

:deep(.ant-textarea) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #ffffff !important;
}

:deep(.ant-textarea:hover) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(80, 80, 80) !important;
}

:deep(.ant-textarea:focus) {
  background: rgb(50, 50, 50) !important;
  border-color: #40a9ff !important;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2) !important;
}

/* 修复所有可能的白色背景 */
:deep(.ant-form-item-control-input) {
  background: transparent !important;
}

:deep(.ant-form-item-control-input-content) {
  background: transparent !important;
}

:deep(.ant-input-group-addon) {
  background: rgb(60, 60, 60) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #cccccc !important;
}

/* 确保输入框在所有状态下都是深色 */
:deep(input) {
  background: rgb(50, 50, 50) !important;
  color: #ffffff !important;
}

:deep(input:focus) {
  background: rgb(50, 50, 50) !important;
}

:deep(input:hover) {
  background: rgb(50, 50, 50) !important;
}
</style>
