import router from '@/router'
import { useLoginUserStore } from '@/stores/userLoginUserStore'
import { message } from 'ant-design-vue'

/*全局权限管理*/

//是否为首次进入，确保我们不是每一个页面都获取用户对象一次，我们保证只获取一次
let firstFetchLoginUser = true

router.beforeEach(async (to, from, next) => {
  /**
   * 简单思路就是我们首次进入页面先获取下当前用户信息保存到全局变量store里。
   * 然后我们我们后续每次进入router页面前，判断该router的路径是否/admin这种需要权限的
   * 如果需要鉴权，先从全局变量store里获取到当前用户，然后根据url指定的权限去对比用户角色
   * 根据这个来判断放不放行
   */
  const loginUserStore = useLoginUserStore()
  let loginUser = loginUserStore.loginUser
  //如果是首次，那么获取一下当前用户。  记住要获取到当前用户信息后，再校验权限，这里需要同步。
  if (firstFetchLoginUser) {
    //获取当前用户
    await loginUserStore.fetchLoginUser()
    loginUser = loginUserStore.loginUser
    //设置之后为非首次
    firstFetchLoginUser = false
  }

  //获取到将要去的url
  const toUrl = to.fullPath
  //判断将要去的页面是否需要权限
  if (toUrl.startsWith('/admin')) {
    if (!loginUser || loginUser.userRole !== 'admin') {
      //没有权限
      message.error('没有权限')
      //跳转到登录页，并记录下没有权限进入的页面。
      next(`/user/login?redirectTo=${to.fullPath}`)
      return
    }
  }
  next()
})
