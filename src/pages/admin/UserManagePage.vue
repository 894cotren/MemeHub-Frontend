<template>
  <div id="userManagePage">
    <!--    分页查询用的表单-->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="账号">
        <a-input v-model:value="searchParams.userAccount" placeholder="请输入账号" />
      </a-form-item>
      <a-form-item label="用户名">
        <a-input v-model:value="searchParams.userName" placeholder="请输入用户名" />
      </a-form-item>
      <a-form-item label="会员编号">
        <a-input v-model:value="searchParams.vipNumber" placeholder="请输入会员编号" />
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
        <template v-if="column.dataIndex === 'userAvatar'">
          <a-image :src="record.userAvatar" :width="60" />
        </template>
        <template v-else-if="column.dataIndex === 'userRole'">
          <div v-if="record.userRole === 'user'">
            <a-tag color="blue">用户</a-tag>
          </div>
          <div v-else-if="record.userRole === 'vip'">
            <a-tag color="red">会员</a-tag>
          </div>
          <div v-else-if="record.userRole === 'admin'">
            <a-tag color="green">管理员</a-tag>
          </div>
        </template>
        <template v-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-if="column.dataIndex === 'vipExpireTime'">
          <!--          //如果存在会员时间，那么格式化一下。-->
          <div v-if="record.vipExpireTime">
            {{ dayjs(record.vipExpireTime).format('YYYY-MM-DD HH:mm:ss') }}
          </div>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-popconfirm
            title="你确认要删除该用户吗?"
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
import { SmileOutlined, DownOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { userDeleteUsingPost, userPageListUsingPost } from '@/api/userController'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
/*需要展示的列*/
const columns = [
  {
    title: 'id',
    dataIndex: 'id',
  },
  {
    title: '账号',
    dataIndex: 'userAccount',
  },
  {
    title: '用户名',
    dataIndex: 'userName',
  },
  {
    title: '头像',
    dataIndex: 'userAvatar',
  },
  {
    title: '简介',
    dataIndex: 'userProfile',
  },
  {
    title: '用户角色',
    dataIndex: 'userRole',
  },
  {
    title: '用户邮箱',
    dataIndex: 'userEmail',
  },
  {
    title: '会员编号',
    dataIndex: 'vipNumber',
  },
  {
    title: '会员到期时间',
    dataIndex: 'vipExpireTime',
  },
  {
    title: '收藏数',
    dataIndex: 'favoriteCount',
  },
  {
    title: '可收藏上限',
    dataIndex: 'favoriteLimit',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
  },
  {
    title: '操作',
    key: 'action',
  },
]

//定义数据
const dataList = ref<API.UserVo[]>([])
const total = ref(0)

//定义分页搜索条件 （给我们后端用的）
const searchParams = reactive<API.UserPageListRequest>({
  pageNum: 1,
  pageSize: 8,
})

//  分页参数对象-放组件里的。组件里的api
const pagination = computed(() => {
  return {
    current: searchParams.pageNum ?? 1,
    pageSize: searchParams.pageSize ?? 10,
    total: total.value,
    showSizeChanger: true,
    showTotal: (total) => `共 ${total} 条`,
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
  const res = await userPageListUsingPost({
    //将这个对象展开形成一个新的对象，免得污染该分页对象
    ...searchParams,
  })
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

//删除用户
const doDelete = async (id: string) => {
  if (!id) {
    message.error('删除失败')
    return
  }
  const res = await userDeleteUsingPost({ id })
  if (res.data.code === 20000) {
    message.success('删除成功')
    //更新数据
    await fetchDataList()
  } else {
    message.error('删除失败' + res.data.message)
  }
}
//取消删除用户
const cancelDelete = (e: MouseEvent) => {
  console.log(e)
  message.error('取消删除用户')
}
</script>
