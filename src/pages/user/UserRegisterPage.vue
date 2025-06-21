<template>
  <div id="userRegisterPage">
    <h2 class="title">Memehub-用户注册</h2>
    <div class="desc">欢迎分享你珍藏的meme图</div>
    <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
      <a-form-item
        label="用户账号"
        name="userAccount"
        :rules="[
          { required: true, message: '请输入账号!' },
          { min: 4, max: 20, message: '账号长度应为4-20之间' },
        ]"
      >
        <a-input v-model:value="formState.userAccount" placeholder="请输入账号" />
      </a-form-item>

      <a-form-item
        label="用户密码"
        name="userPassword"
        :rules="[
          { required: true, message: '请输入密码!' },
          { min: 8, max: 20, message: '密码长度应为8-20之间' },
        ]"
      >
        <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码" />
      </a-form-item>

      <a-form-item
        label="确认密码"
        name="checkPassword"
        :rules="[
          { required: true, message: '请输入确认密码!' },
          { min: 8, max: 20, message: '密码长度应为8-20之间' },
        ]"
      >
        <a-input-password v-model:value="formState.checkPassword" placeholder="请再次输入密码" />
      </a-form-item>
      <div class="tips">
        已有账号？
        <RouterLink to="/user/register">去登录</RouterLink>
      </div>

      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">注册</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script lang="ts" setup>
import { reactive } from 'vue'
import { userLoginUsingPost, userRegisterUsingPost } from '@/api/userController'
import { useLoginUserStore } from '@/stores/userLoginUserStore'
import { message } from 'ant-design-vue'
import router from '@/router'

const loginUserStore = useLoginUserStore()

/**
 * 表单项，用于接受表单输入的值
 */
const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
})
/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: any) => {
  //校验两次密码是否输入一致
  if (values.userPassword !== values.checkPassword) {
    message.error('两次密码输入不一致')
    return
  }

  const res = await userRegisterUsingPost(values)
  //注意，res是ajax的封装好的返回，你取里面data的时候才是你后端返回。
  if (res.data.code === 20000 && res.data.data) {
   //注册成功
    message.success('注册成功！')
    //注册完后跳转登陆页面
    router.push({
      path: '/user/login',
      replace: true,
    })
  } else {
    message.error('注册失败，' + res.data.message)
  }
}
</script>

<style scoped>
#userRegisterPage {
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
