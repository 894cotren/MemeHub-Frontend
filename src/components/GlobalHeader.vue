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
      <a-col flex="200px">
        <div class="user-login-status">
          <div v-if="loginUserStore.loginUser.id">
            <a-dropdown>
              <a-space>
                <a-avatar :size="40" :src="loginUserStore.loginUser.userAvatar" />
                {{ loginUserStore.loginUser.userName ?? '无名' }}
              </a-space>
              <template #overlay>
                <a-menu>
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
import { h, ref } from 'vue'
import { HomeOutlined, LogoutOutlined } from '@ant-design/icons-vue'
import { MenuProps, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/userLoginUserStore'
import { userLogoutUsingGet } from '@/api/userController'

const loginUserStore = useLoginUserStore()

const items = ref<MenuProps['items']>([
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
  },
  {
    key: '/about',
    label: '关于',
    title: '关于',
  },
  // {
  //   key: 'others',
  //   label: h('a', { href: 'https://www.codefather.cn', target: '_blank' }, '编程导航'),
  //   title: '编程导航',
  // },
])

//获取到路由对象。
const router = useRouter()

//监听路由变化， 高亮当前菜单项
const current = ref<string[]>(['home'])
router.afterEach((to, from, next) => {
  current.value = [to.path]
})

//路由跳转事件
const doMenuClick = ({ key }) => {
  router.push({
    path: key,
  })
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
</script>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
}

.title {
  color: black;
  font-size: 18px;
  margin-left: 16px;
}

.logo {
  height: 48px;
}
</style>
