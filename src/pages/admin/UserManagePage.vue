<template>
  <div id="userManagePage" class="dark-theme">
    <!--    分页查询用的表单-->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="账号">
        <a-input v-model:value="searchParams.userAccount" placeholder="请输入账号" />
      </a-form-item>
      <a-form-item label="用户名">
        <a-input v-model:value="searchParams.userName" placeholder="请输入用户名" />
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
          <div v-else-if="record.userRole === 'admin'">
            <a-tag color="green">管理员</a-tag>
          </div>
        </template>
        <template v-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>

        <template v-else-if="column.key === 'action'">

<!--          用户修改弹窗-->
          <div>
            <a-button type="primary" @click="openEditModal(record)">修改</a-button>
            <a-modal
              v-model:open="visible"
              title="用户修改"
              ok-text="确认修改"
              cancel-text="取消"
              @ok="onOk"
              width="600px"
            >
              <a-form ref="formRef" :model="formState" layout="vertical" name="form_in_modal">
                <a-form-item
                  name="userAccount"
                  label="用户账号"
                  :rules="[{ required: true, message: '请输入用户账号!' }]"
                >
                  <a-input v-model:value="formState.userAccount" placeholder="请输入用户账号" />
                </a-form-item>
                <a-form-item
                  name="userName"
                  label="用户名"
                  :rules="[{ required: true, message: '请输入用户名!' }]"
                >
                  <a-input v-model:value="formState.userName" placeholder="请输入用户名" />
                </a-form-item>
                <a-form-item name="userEmail" label="用户邮箱">
                  <a-input v-model:value="formState.userEmail" placeholder="请输入用户邮箱" />
                </a-form-item>
                <a-form-item name="userProfile" label="用户简介">
                  <a-textarea v-model:value="formState.userProfile" placeholder="请输入用户简介" />
                </a-form-item>
                <a-form-item name="userRole" label="用户角色">
                  <a-select v-model:value="formState.userRole" placeholder="请选择用户角色">
                    <a-select-option value="user">普通用户</a-select-option>
                    <a-select-option value="admin">管理员</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item name="userAvatar" label="用户头像">
                  <a-input v-model:value="formState.userAvatar" placeholder="请输入头像URL" />
                </a-form-item>
              </a-form>
            </a-modal>
          </div>


<!--          用户删除按钮-->
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
import { userDeleteUsingPost, userPageListUsingPost, userUpdateUsingPost } from '@/api/userController'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import type { FormInstance } from 'ant-design-vue'
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


//编辑用户弹窗使用的
const formRef = ref<FormInstance>();
const visible = ref(false);
const formState = reactive({
  id: undefined as number | undefined,
  userAccount: '',
  userName: '',
  userEmail: '',
  userProfile: '',
  userRole: '',
  userAvatar: '',
});

// 打开编辑模态框
const openEditModal = (user: API.UserVo) => {
  // 填充表单数据
  formState.id = user.id;
  formState.userAccount = user.userAccount || '';
  formState.userName = user.userName || '';
  formState.userEmail = user.userEmail || '';
  formState.userProfile = user.userProfile || '';
  formState.userRole = user.userRole || '';
  formState.userAvatar = user.userAvatar || '';
  visible.value = true;
};

// 提交编辑表单
const onOk = async () => {
  try {
    await formRef.value?.validate();
    // 构造提交数据，将日期转换为字符串
    const submitData: API.UserUpdateRequest = {
      id: formState.id,
      userAccount: formState.userAccount,
      userName: formState.userName,
      userEmail: formState.userEmail,
      userProfile: formState.userProfile,
      userRole: formState.userRole,
      userAvatar: formState.userAvatar,
    };
    const res = await userUpdateUsingPost(submitData);
    if (res.data.code === 20000) {
      message.success('用户修改成功');
      visible.value = false;
      // 刷新数据
      await fetchDataList();
    } else {
      message.error('修改失败：' + res.data.message);
    }
  } catch (error) {
    message.error('表单验证失败');
  }
};

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

:deep(.ant-input-affix-wrapper) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
}

:deep(.ant-input-affix-wrapper:hover) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(80, 80, 80) !important;
}

:deep(.ant-input-affix-wrapper:focus-within) {
  background: rgb(50, 50, 50) !important;
  border-color: #40a9ff !important;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2) !important;
}

:deep(.ant-input-affix-wrapper .ant-input) {
  background: transparent !important;
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

:deep(.ant-tag-blue) {
  background: rgba(64, 169, 255, 0.2) !important;
  border-color: #40a9ff !important;
  color: #69c0ff !important;
}

:deep(.ant-tag-green) {
  background: rgba(82, 196, 26, 0.2) !important;
  border-color: #52c41a !important;
  color: #73d13d !important;
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

:deep(.ant-form-item-label > label) {
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

:deep(.ant-textarea) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #ffffff !important;
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
</style>
