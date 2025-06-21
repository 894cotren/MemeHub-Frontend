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
          <div v-else-if="isVipValid(record)">
            <a-tag color="red">会员</a-tag>
          </div>
          <div v-else-if="record.userRole === 'vip'">
            <a-tag color="default">会员已过期</a-tag>
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
                    <a-select-option value="vip">VIP会员</a-select-option>
                    <a-select-option value="admin">管理员</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item name="vipNumber" label="会员编号">
                  <a-input v-model:value="formState.vipNumber" placeholder="请输入会员编号" />
                </a-form-item>
                <a-form-item name="userAvatar" label="用户头像">
                  <a-input v-model:value="formState.userAvatar" placeholder="请输入头像URL" />
                </a-form-item>
                <a-form-item name="vipExpireTime" label="会员到期时间">
                  <a-date-picker
                    v-model:value="formState.vipExpireTime"
                    format="YYYY-MM-DD HH:mm:ss"
                    show-time
                    placeholder="请选择会员到期时间"
                    style="width: 100%"
                  />
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

// 判断VIP是否有效（角色为vip且未过期）
const isVipValid = (user: API.UserVo) => {
  if (user.userRole !== 'vip') return false;
  if (!user.vipExpireTime) return false;
  return dayjs(user.vipExpireTime).isAfter(dayjs());
};


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
  vipNumber: '',
  vipExpireTime: null as Dayjs | null,
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
  formState.vipNumber = user.vipNumber ? String(user.vipNumber) : '';
  // 处理会员到期时间
  formState.vipExpireTime = user.vipExpireTime ? dayjs(user.vipExpireTime) : null;
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
      vipNumber: formState.vipNumber,
      vipExpireTime: formState.vipExpireTime ? formState.vipExpireTime.toISOString() : undefined,
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
