<template>
  <div id="userLoginPage">
    <h2 class="title">Memehub-用户登录</h2>
    <div class="desc">欢迎分享你珍藏的meme图</div>
    <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
      <a-form-item
        label="用户账号"
        name="userAccount"
        :rules="[{ required: true, message: '请输入账号!' },{min:4,max:20,message: '账号长度应为4-20之间'}]"
      >
        <a-input v-model:value="formState.userAccount" placeholder="请输入账号" />
      </a-form-item>

      <a-form-item
        label="用户密码"
        name="userPassword"
        :rules="[{ required: true, message: '请输入密码!' },{min:8,max:20,message: '密码长度应为8-20之间'}]"
      >
        <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码" />
      </a-form-item>
      <div class="tips">
        没有账号？
        <RouterLink to="/user/register">去注册</RouterLink>
      </div>

      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">登录</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script lang="ts" setup>
import { reactive } from 'vue'
import { userLoginUsingPost } from '@/api/userController'
import { useLoginUserStore } from '@/stores/userLoginUserStore'
import { message } from 'ant-design-vue'
import router from '@/router'

const loginUserStore =useLoginUserStore();

/**
 * 表单项，用于接受表单输入的值
 */
const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
})
/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: any) => {
  //发送登录，通过await同步发送，使用同步发送方法前面需要加async，这样我们可以代码里有异步变同步，记住我们调后端接口基本上都要用同步方法await。
  //注意下面这行调用后端接口的代码，这段请求也是有可能出错抛异常的哦，然后后面代码不执行了，这里优雅一点可以用try catch包裹下。
  const res= await userLoginUsingPost(values);
  //注意，res是ajax的封装好的返回，你取里面data的时候才是你后端返回。
  if (res.data.code === 20000 && res.data.data) {
    //   //登录成功，需要将用户信息保存到userStore全局状态中
    // loginUserStore.setLoginUser(res.data.data);
    //或者是：登录成功，我们再去获取一下当前登录用户信息
    await loginUserStore.fetchLoginUser();
    message.success("登录成功！");
    //todo 这里可以实现一个redirect变量记录从什么地方跳转到这个登录页面的，我们登录完成后可以定向跳转回去。
    router.push({
      path: '/',
      //这里要用replace把当前页面干掉，不然我们登录了跳转主页了点返回上一页到这个登录页面没意义
      replace: true,
    })
  }else{
    message.error("登录失败，"+res.data.message)
  }
}
</script>


<style scoped>
#userLoginPage {
  max-width: 360px;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 16px;
}

.desc {
  text-align: center;
  color: #bbb;
  margin-bottom: 16px;
}

.tips {
  margin-bottom: 16px;
  color: #bbb;
  font-size: 13px;
  text-align: right;
}

</style>
