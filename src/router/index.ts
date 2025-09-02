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
import BatchUploadPicturePage from '@/pages/admin/BatchUploadPicturePage.vue'
import SpaceManagePage from '@/pages/admin/SpaceManagePage.vue'
import AddSpacePage from '@/pages/space/AddSpacePage.vue'
import MySpacePage from '@/pages/space/MySpacePage.vue'
import SpaceDetailPage from '@/pages/space/SpaceDetailPage.vue'
import TeamMemberManagePage from '@/pages/space/TeamMemberManagePage.vue'

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
      path: '/admin/batchUpload',
      name: '批量添加图片',
      component: BatchUploadPicturePage,
    },
    {
      path: '/admin/spaceManage',
      name: '空间管理',
      component: SpaceManagePage,
    },
    {
      path: '/mySpace',
      name: '我的空间',
      component: MySpacePage,
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
      path: '/addSpace',
      name: '创建空间',
      component: AddSpacePage,
    },
    {
      path: '/space/:id',
      name: '空间详情',
      component: SpaceDetailPage,
      props: true,
    },
    {
      path: '/space/:id/members',
      name: '成员管理',
      component: TeamMemberManagePage,
      props: true,
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
