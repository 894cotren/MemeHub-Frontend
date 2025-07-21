import router from '@/router'
import { useLoginUserStore } from '@/stores/userLoginUserStore'
import { message } from 'ant-design-vue'

/*全局权限管理*/

//是否为首次进入，确保我们不是每一个页面都获取用户对象一次，我们保证只获取一次
let firstFetchLoginUser = true

router.beforeEach(async (to, from, next) => {
  /**
   * 全局权限控制逻辑：
   * 1. 公开页面白名单 - 无需登录即可访问
   * 2. 普通页面 - 需要登录
   * 3. 管理员页面 - 需要管理员权限
   */
  const loginUserStore = useLoginUserStore()
  let loginUser = loginUserStore.loginUser
  
  //如果是首次，那么获取一下当前用户信息
  if (firstFetchLoginUser) {
    await loginUserStore.fetchLoginUser()
    loginUser = loginUserStore.loginUser
    firstFetchLoginUser = false
  }

  //获取到将要去的url
  const toUrl = to.fullPath
  
  // 公开页面白名单 - 无需登录即可访问
  const publicPages = [
    '/',                    // 首页
    '/pictureShow',         // meme图库页面
    '/user/login',          // 登录页面
    '/user/register'        // 注册页面
  ]
  
  // 检查是否为公开页面
  const isPublicPage = publicPages.some(page => 
    toUrl === page || toUrl.startsWith(page + '?')
  )
  
  // 如果是公开页面，直接放行
  if (isPublicPage) {
    next()
    return
  }
  
  // 非公开页面需要检查登录状态
  if (!loginUser || !loginUser.id) {
    // 未登录，跳转到登录页面
    message.warning('请先登录')
    next(`/user/login?redirect=${encodeURIComponent(to.fullPath)}`)
    return
  }
  
  // 已登录，检查管理员页面权限
  if (toUrl.startsWith('/admin')) {
    if (loginUser.userRole !== 'admin') {
      // 没有管理员权限
      message.error('没有权限访问管理页面')
      next(`/user/login?redirect=${encodeURIComponent(to.fullPath)}`)
      return
    }
  }
  
  // 权限检查通过，放行
  next()
})
