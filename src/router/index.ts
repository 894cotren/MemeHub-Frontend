import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UserLoginPage from '@/pages/user/UserLoginPage.vue'
import UserManagePage from '@/pages/admin/UserManagePage.vue'
import UserRegisterPage from '@/pages/user/UserRegisterPage.vue'
import AddPicturePage from '@/pages/picture/AddPicturePage.vue'
import PictureManagePage from '@/pages/admin/PictureManagePage.vue'
import PictureShowPage from '@/pages/picture/PictureShowPage.vue'
import FavoritePicturePage from '@/pages/picture/FavoritePicturePage.vue'
import MyPicturesPage from '@/pages/picture/MyPicturesPage.vue'
import UserUpdatePage from '@/pages/user/UserUpdatePage.vue'
import HomePage from '@/pages/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/user/login',
      name: '用户登录',
      component: UserLoginPage,
    },
    {
      path: '/user/register',
      name: '用户注册',
      component: UserRegisterPage,
    },
    {
      path: '/admin/userManage',
      name: '用户管理',
      component: UserManagePage,
    },
    {
      path: '/addPicture',
      name: '添加图片',
      component: AddPicturePage,
    },
    {
      path: '/admin/pictureManage',
      name: '图片管理',
      component: PictureManagePage,
    },
    {
      path: '/pictureShow',
      name: 'meme图库',
      component: PictureShowPage,
    },
    {
      path: '/favoritePicture',
      name: '图片收藏',
      component: FavoritePicturePage,
    },
          {
        path: '/myPictures',
        name: '我的上传',
        component: MyPicturesPage,
      },
      {
        path: '/userUpdate',
        name: '个人信息编辑',
        component: UserUpdatePage,
      },
  ],
})

export default router
