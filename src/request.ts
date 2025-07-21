import axios from 'axios'
import { message } from 'ant-design-vue'

/**
 * axios配置
 * 这里是请求的框架axios的配置。 有请求的基路径配置，有请求的拦截器配置，全局响应拦截器配置。
 */

const myAxios = axios.create({
  baseURL: 'http://localhost:8123',
  timeout: 60000,
  withCredentials: true,
});

// 添加请求拦截器
myAxios.interceptors.request.use(function (config) {
  // 在发送请求之前做些什么
  return config;
}, function (error) {
  // 对请求错误做些什么
  return Promise.reject(error);
});


// 全局响应拦截器
myAxios.interceptors.response.use(
  function (response) {
    const { data } = response
    // 未登录   如果后端返回未登录
    if (data.code === 40100) {
      // 白名单：无需登录即可访问的接口
      const publicApiWhitelist = [
        'user/getLoginUser',        // 获取用户信息（正确路径）
        'picture/getPicturePagesVO' // 获取图片列表（允许未登录访问）
      ]
      
      // 检查当前请求是否在白名单中
      const isPublicApi = publicApiWhitelist.some(api => 
        response.request.responseURL.includes(api)
      )
      
      // 不是白名单接口，并且用户目前不是已经在用户登录页面，则跳转到登录页面
      if (
        !isPublicApi &&
        !window.location.pathname.includes('/user/login')
      ) {
        message.warning('请先登录')
        window.location.href = `/user/login?redirect=${window.location.href}`
      }
    }
    return response
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error)
  },
)

export default myAxios;
