<template>
  <div id="pictureManagePage">
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
            <div v-if="record.reviewStatus === 0">待审核</div>
            <div v-else-if="record.reviewStatus === 1 ">审核通过</div>
            <div v-else-if="record.reviewStatus === 2 ">审核驳回</div>
            <div v-else-if="record.reviewStatus === 3 ">违规下架</div>
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
            <a-button danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
  </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import { deletePictureByIdUsingPost, getPicturePagesUsingPost } from '@/api/pictureController'

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
    title: '操作',
    key: 'action',
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

//删除图片
const doDelete = async (id: string) => {
  if (!id) {
    message.error('删除失败')
    return
  }
  const res = await deletePictureByIdUsingPost({ id })
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
