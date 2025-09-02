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
import { computed, h, ref } from 'vue'
import { HomeOutlined, LogoutOutlined,FormOutlined } from '@ant-design/icons-vue'
import { MenuProps, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/userLoginUserStore'
import { userLogoutUsingGet } from '@/api/userController'

const loginUserStore = useLoginUserStore()

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

//获取到路由对象。
const router = useRouter()

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
</style>
