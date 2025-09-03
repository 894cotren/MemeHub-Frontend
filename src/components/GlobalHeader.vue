<template>
  <div id="globalHeader">
    <a-row :wrap="false">
      <a-col flex="150px">
        <router-link to="/">
          <div class="title-bar">
            <img class="logo" src="../assets/logo.png" />
            <div class="title">Memehub</div>
          </div>
        </router-link>
      </a-col>
      <a-col flex="auto">
        <a-menu
          v-model:selectedKeys="current"
          mode="horizontal"
          :items="items"
          @click="doMenuClick"
        />
      </a-col>

      <!-- 团队空间下拉菜单 -->
      <a-col flex="150px" v-if="loginUserStore.loginUser.id">
        <div class="team-space-dropdown">
          <a-dropdown>
            <a-button type="text" class="team-space-btn">
              我的团队空间
              <DownOutlined />
            </a-button>
            <template #overlay>
              <a-menu @click="handleTeamSpaceClick">
                <a-menu-item
                  v-for="space in teamSpaces"
                  :key="space.id"
                  :data-space-id="space.id"
                >
                  {{ space.spaceName }}
                </a-menu-item>
                <a-menu-divider v-if="teamSpaces.length > 0" />
                <a-menu-item key="create-team" @click="toCreateTeamSpace">
                  <PlusOutlined />
                  创建团队空间
                </a-menu-item>
                <a-menu-item key="no-team" disabled v-if="teamSpaces.length === 0">
                  暂无团队空间
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-col>

      <!-- 用户信息展示栏     -->
      <a-col flex="120px">
        <div class="user-login-status">
          <div v-if="loginUserStore.loginUser.id">
            <a-dropdown>
              <a-space>
                <a-avatar :size="40" :src="loginUserStore.loginUser.userAvatar" />
                <span class="username">
                  {{ loginUserStore.loginUser.userName ?? '无名' }}
                </span>
              </a-space>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="toUserUpdate">
                    <FormOutlined />
                    个人信息
                  </a-menu-item>
                  <a-menu-item @click="doLogout">
                    <LogoutOutlined />
                    退出登录
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
          <div v-else>
            <a-button type="primary" href="/user/login">登录</a-button>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>
<script lang="ts" setup>
import { computed, h, ref, onMounted, watch } from 'vue'
import { HomeOutlined, LogoutOutlined, FormOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { MenuProps, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/userLoginUserStore'
import { userLogoutUsingGet } from '@/api/userController'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController'

const loginUserStore = useLoginUserStore()
const router = useRouter()

// 团队空间数据
const teamSpaces = ref<API.SpaceVO[]>([])

// 获取用户团队空间列表
const fetchTeamSpaces = async () => {
  try {
    // 1. 获取用户加入的团队空间ID列表
    const res = await listMyTeamSpaceUsingPost()
    if (res.data.code === 20000 && res.data.data) {
      const spaceUserList = res.data.data

      // 2. 对每个空间ID获取详细信息
      const spacePromises = spaceUserList.map(async (spaceUser) => {
        try {
          // 确保spaceId是字符串类型，避免精度问题
          const spaceIdStr = String(spaceUser.spaceId)
          console.log('获取空间详情，spaceId:', spaceIdStr)
          const spaceRes = await getSpaceVoByIdUsingGet({ id: spaceIdStr })
          if (spaceRes.data.code === 20000 && spaceRes.data.data) {
            return spaceRes.data.data
          }
        } catch (error) {
          console.error(`获取空间 ${spaceUser.spaceId} 详情失败:`, error)
        }
        return null
      })

      // 等待所有请求完成
      const spaces = await Promise.all(spacePromises)
      console.log('获取到的所有空间:', spaces.map(s => s ? `${s.spaceName}(type:${s.spaceType})` : 'null'))

      // 过滤掉null值，并只保留团队空间（spaceType=1）
      teamSpaces.value = spaces.filter(space => space !== null && space.spaceType === 1)
      console.log('过滤后的团队空间:', teamSpaces.value.map(s => `${s.spaceName}(type:${s.spaceType})`))
    }
  } catch (error) {
    console.error('获取团队空间列表失败:', error)
  }
}

// 处理团队空间点击
const handleTeamSpaceClick = ({ key, domEvent }) => {
  if (key === 'create-team') {
    // 创建团队空间
    router.push('/addSpace?spaceType=1')
  } else {
    // 跳转到对应空间详情页
    const spaceId = domEvent?.target?.dataset?.spaceId || key
    if (spaceId && spaceId !== 'no-team') {
      router.push(`/space/${spaceId}`)
    }
  }
}

// 跳转到创建团队空间页面
const toCreateTeamSpace = () => {
  router.push('/addSpace?spaceType=1')
}

//原始菜单数组
const originItems =[
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/pictureShow',
    label: 'meme图库',
    title: 'meme图库',
  },
  {
    key: '/favoritePicture',
    label: '我的收藏',
    title: '我的收藏',
  },
  {
    key: '/myPictures',
    label: '我的上传',
    title: '我的上传',
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
  },
  {
    key: '/addPicture',
    label: '创建图片',
    title: '创建图片',
  },
  {
    key: '/admin/batchUpload',
    label: '批量创建图片',
    title: '批量创建图片',
  },
  {
    key: '/mySpace',
    label: '我的空间',
    title: '我的空间',
  },
  // {
  //   key: '/addSpace?spaceType=0',
  //   label: '创建个人空间',
  //   title: '创建个人空间',
  // },
  {
    key: '/addSpace?spaceType=1',
    label: '创建团队空间',
    title: '创建团队空间',
  },
  {
    key: '/admin/spaceManage',
    label: '空间管理',
    title: '空间管理',
  },
  {
    key: '/admin/pictureManage',
    label: '图片管理',
    title: '图片管理',
  },
]

/**
 * 对菜单进行权限过滤
 *  只有管理员才能访问/admin开头的页面
 *  思路是获取到当前用户，在对菜单数组进行过滤  如果/admin开头就鉴权判断留不留下
 */
const filterMenus = (menus = [] as MenuProps['items']) => {
  return menus?.filter((menu) => {
    //管理员才能看到/admin开头的页面
    if (menu?.key?.startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser
      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }
    return true
  })
}
//展示在菜单的路由数组
const items = computed(() => {
  return filterMenus(originItems)
})

//获取到路由对象已经在上面定义过了

// 监听用户登录状态变化，重新获取团队空间
watch(() => loginUserStore.loginUser.id, (newUserId) => {
  if (newUserId) {
    fetchTeamSpaces()
  } else {
    teamSpaces.value = []
  }
})

// 组件挂载时获取团队空间数据
onMounted(() => {
  if (loginUserStore.loginUser.id) {
    fetchTeamSpaces()
  }
})

//监听路由变化， 高亮当前菜单项
const current = ref<string[]>(['home'])
router.afterEach((to, from, next) => {
  current.value = [to.path]
})

//路由跳转事件
const doMenuClick = ({ key }) => {
  // 检查是否包含查询参数
  if (key.includes('?')) {
    const [path, queryString] = key.split('?')
    const params = new URLSearchParams(queryString)
    const query = {}
    for (const [paramKey, paramValue] of params) {
      query[paramKey] = paramValue
    }
    router.push({
      path: path,
      query: query
    })
  } else {
    router.push({
      path: key,
    })
  }
}

/**
 * 退出登录
 */
const doLogout = async () => {
  const res = await userLogoutUsingGet()
  if (res.data.code === 20000) {
    message.success('退出登录成功')
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    //跳转到新页面-用户登录页面
    await router.push({
      path: '/user/login',
    })
  } else {
    message.error('退出登录失败' + res.data.message)
  }
}

/**
 * 跳转个人信息编辑页面
 */
const toUserUpdate = async () => {
    if (!loginUserStore.loginUser?.id) {
        message.warning('请先登录')
        router.push('/user/login')
        return
    }
    router.push(`/userUpdate?userId=${loginUserStore.loginUser.id}`)
}
</script>

<style scoped>
#globalHeader {
  background: rgb(50, 50, 50);
  color: #ffffff;
}

.title-bar {
  display: flex;
  align-items: center;
}

.title {
  color: #ffffff;
  font-size: 18px;
  margin-left: 16px;
  font-weight: 500;
}

.logo {
  height: 48px;
}

.user-login-status {
  color: #ffffff;
}

/* 覆盖 Ant Design 菜单的默认样式 */
:deep(.ant-menu-horizontal) {
  background: rgb(50, 50, 50) !important;
  border-bottom: none !important;
}

:deep(.ant-menu-horizontal .ant-menu-item) {
  color: #cccccc !important;
  border-bottom: 2px solid transparent !important;
}

:deep(.ant-menu-horizontal .ant-menu-item:hover) {
  color: #40a9ff !important;
  border-bottom-color: #40a9ff !important;
  background: rgba(64, 169, 255, 0.1) !important;
}

:deep(.ant-menu-horizontal .ant-menu-item-selected) {
  color: #40a9ff !important;
  border-bottom-color: #40a9ff !important;
  background: rgba(64, 169, 255, 0.15) !important;
}

:deep(.ant-avatar) {
  border: 2px solid rgba(80, 80, 80, 0.8);
}

:deep(.ant-dropdown-menu) {
  background: rgb(50, 50, 50) !important;
}

:deep(.ant-dropdown-menu .ant-dropdown-menu-item) {
  color: #cccccc !important;
}

:deep(.ant-dropdown-menu .ant-dropdown-menu-item:hover) {
  background: rgba(64, 169, 255, 0.1) !important;
  color: #40a9ff !important;
}

:deep(.ant-btn-primary) {
  background: #40a9ff !important;
  border-color: #40a9ff !important;
}

:deep(.ant-btn-primary:hover) {
  background: #69c0ff !important;
  border-color: #69c0ff !important;
}

.username {
  display: inline-block;
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle; /* 文本垂直居中 */
}

/* 团队空间下拉菜单样式 */
.team-space-dropdown {
  text-align: center;
}

.team-space-btn {
  color: #cccccc !important;
  font-size: 14px;
  height: 32px;
  padding: 0 8px;
}

.team-space-btn:hover {
  color: #40a9ff !important;
  background: rgba(64, 169, 255, 0.1) !important;
}

.team-space-dropdown :deep(.ant-dropdown-menu) {
  background: rgb(50, 50, 50) !important;
  border: 1px solid #434343;
}

.team-space-dropdown :deep(.ant-dropdown-menu .ant-dropdown-menu-item) {
  color: #cccccc !important;
  padding: 8px 16px;
}

.team-space-dropdown :deep(.ant-dropdown-menu .ant-dropdown-menu-item:hover) {
  background: rgba(64, 169, 255, 0.1) !important;
  color: #40a9ff !important;
}

.team-space-dropdown :deep(.ant-dropdown-menu .ant-dropdown-menu-item-disabled) {
  color: #666666 !important;
  cursor: not-allowed;
}

.team-space-dropdown :deep(.ant-dropdown-menu .ant-dropdown-menu-item .anticon) {
  margin-right: 8px;
}
</style>
