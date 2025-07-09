
<template>
  <div id="favoritePicturePage">
    <h2 style="margin-bottom: 16px ;text-align: center">我的收藏</h2>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
    </div>

    <!-- 图片网格 -->
    <div v-else class="picture-grid">
      <div class="grid-container">
        <div
          v-for="picture in pictureList"
          :key="picture.id"
          class="picture-card"
          @click="handlePictureClick(picture)"
        >
          <div class="image-container">
            <img
              :src="picture.picUrl"
              :alt="picture.picName || '图片'"
              @load="handleImageLoad"
              @error="handleImageError"
            />
            <!-- 收藏按钮 -->
            <div
              class="favorite-btn"
              @click="toggleFavorite(picture, $event)"
            >
              <a-button
                type="text"
                :class="['heart-btn', { 'favorited': picture.isFavorite }]"
                shape="circle"
                size="large"
              >
                <template #icon>
                  <svg class="favorite-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path v-if="picture.isFavorite" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="currentColor"/>
                    <path v-else d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </template>
              </a-button>
            </div>
            <div class="image-overlay">
              <div class="overlay-content">
                <p v-if="picture.userName">by {{ picture.userName }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据提示 -->
      <div v-if="!loading && pictureList.length === 0" class="no-data">
        <a-empty description="您还没有收藏任何图片">
          <template #image>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </template>
        </a-empty>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > 0">
      <a-pagination
        v-model:current="currentPage"
        :total="total"
        :page-size="pageSize"
        :show-size-changer="false"
        :show-quick-jumper="true"
        show-total
        @change="handlePageChange"
      />
    </div>

    <!-- 图片预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      :footer="null"
      width="100%"
      :wrapClassName="'fullscreen-modal'"
      :centered="false"
      @cancel="closePreview"
      :bodyStyle="{ padding: '0', height: '100vh' }"
      :maskStyle="{ background: 'rgba(0, 0, 0, 0.95)', overflow: 'hidden' }"
      :transitionName="''"
      :maskTransitionName="''"
    >
      <div v-if="currentPicture" class="preview-content">
        <!-- 图片导航区域 -->
        <div class="preview-header">
          <div class="preview-counter">
            {{ currentPictureIndex + 1 }} / {{ pictureList.length }}
          </div>
          <div class="preview-actions">
            <!-- 关闭按钮 -->
            <a-button
              type="text"
              @click="closePreview"
              class="close-btn"
            >
              ×
            </a-button>
          </div>
        </div>

        <!-- 图片显示区域 -->
        <div class="preview-image-container" @click="closePreview">
          <!-- 左侧导航按钮 -->
          <a-button
            v-if="currentPictureIndex > 0"
            class="nav-btn nav-btn-left"
            type="text"
            @click.stop="prevPicture"
          >
            ‹
          </a-button>

          <!-- 图片 -->
          <img
            :src="currentPicture.picUrl"
            :alt="currentPicture.picName || '图片'"
            class="preview-image"
            @click.stop
          />

          <!-- 右侧导航按钮 -->
          <a-button
            v-if="currentPictureIndex < pictureList.length - 1"
            class="nav-btn nav-btn-right"
            type="text"
            @click.stop="nextPicture"
          >
            ›
          </a-button>
        </div>

        <!-- 图片信息区域 -->
        <div class="preview-info" v-if="currentPicture.userName">
          <p class="author-info">
            作者：{{ currentPicture.userName }}
          </p>
        </div>

        <!-- 固定在屏幕右下角的收藏按钮 -->
        <div class="preview-favorite-btn" @click.stop="toggleFavorite(currentPicture)">
          <a-button
            type="text"
            :class="['preview-heart-btn', { 'favorited': currentPicture.isFavorite }]"
            shape="circle"
            size="large"
          >
            <template #icon>
              <svg class="favorite-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path v-if="currentPicture.isFavorite" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="currentColor"/>
                <path v-else d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </template>
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { getFavoritePicturePagesUsingPost, userUnfavoritePictureUsingPost, userFavoritePictureUsingPost } from '@/api/pictureController'
import { useLoginUserStore } from '@/stores/userLoginUserStore'

// 响应式数据
const loading = ref(false)
const pictureList = ref<API.PicturePagesVO[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12) // 固定每页12张图片

const previewVisible = ref(false)
const currentPicture = ref<API.PicturePagesVO | null>(null)
const currentPictureIndex = ref(0)

// 用户登录状态
const loginUserStore = useLoginUserStore()
const { loginUser } = loginUserStore

// 获取收藏图片列表
const fetchFavoritePictureList = async () => {
  try {
    loading.value = true

    if (!loginUser?.id) {
      message.warning('请先登录后查看收藏')
      return
    }

    const requestParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      sortField: 'createTime',
      sortOrder: 'desc',
      userId: loginUser.id
    }

    const response = await getFavoritePicturePagesUsingPost(requestParams)

    if (response.data?.code === 20000 && response.data?.data) {
      pictureList.value = response.data.data.records || []
      total.value = parseInt(String(response.data.data.total || 0)) || 0
    } else {
      message.error(response.data?.message || '获取收藏图片列表失败')
      pictureList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取收藏图片列表失败:', error)
    message.error('获取收藏图片列表失败，请稍后重试')
    pictureList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 分页变化处理
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchFavoritePictureList()
  // 滚动到页面顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 图片点击处理
const handlePictureClick = (picture: API.PicturePagesVO) => {
  const index = pictureList.value.findIndex(p => p.id === picture.id)
  currentPictureIndex.value = index
  currentPicture.value = picture
  previewVisible.value = true
  // 禁用body滚动
  document.body.classList.add('modal-open')
}

// 关闭预览
const closePreview = () => {
  previewVisible.value = false
  currentPicture.value = null
  currentPictureIndex.value = 0
  // 恢复body滚动
  document.body.classList.remove('modal-open')
}

// 上一张图片
const prevPicture = () => {
  if (currentPictureIndex.value > 0) {
    currentPictureIndex.value--
    currentPicture.value = pictureList.value[currentPictureIndex.value]
  }
}

// 下一张图片
const nextPicture = () => {
  if (currentPictureIndex.value < pictureList.value.length - 1) {
    currentPictureIndex.value++
    currentPicture.value = pictureList.value[currentPictureIndex.value]
  }
}

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (!previewVisible.value) return

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      prevPicture()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextPicture()
      break
    case 'Escape':
      event.preventDefault()
      closePreview()
      break
  }
}

// 图片加载成功处理
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.opacity = '1'
}

// 图片加载失败处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/favicon.ico' // 设置默认图片
  img.alt = '图片加载失败'
}

// 切换收藏状态
const toggleFavorite = async (picture: API.PicturePagesVO, event?: Event) => {
  // 阻止事件冒泡，防止打开预览
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }

  // 检查用户是否已登录
  if (!loginUser?.id) {
    message.warning('请先登录后再操作收藏')
    return
  }

  try {
    const picId = picture.id
    const userId = loginUser.id

    if (picture.isFavorite) {
      // 取消收藏
      const response = await userUnfavoritePictureUsingPost({
        picId: picId,
        userId: userId
      })

      if (response.data?.code === 20000 && response.data?.data) {
        picture.isFavorite = false
        message.success('取消收藏成功')

        // 从收藏列表中移除该图片
        const index = pictureList.value.findIndex(p => p.id === picture.id)
        if (index !== -1) {
          pictureList.value.splice(index, 1)
          total.value = Math.max(0, total.value - 1)

          // 如果当前页没有图片了，且不是第一页，则回到上一页
          if (pictureList.value.length === 0 && currentPage.value > 1) {
            currentPage.value--
            fetchFavoritePictureList()
          }

          // 如果在预览模式下，需要调整当前图片索引
          if (previewVisible.value && currentPictureIndex.value >= pictureList.value.length) {
            if (pictureList.value.length === 0) {
              closePreview()
            } else {
              currentPictureIndex.value = Math.max(0, pictureList.value.length - 1)
              currentPicture.value = pictureList.value[currentPictureIndex.value]
            }
          }
        }
      } else {
        message.error(response.data?.message || '取消收藏失败')
      }
    } else {
      // 重新收藏（一般不会发生，因为这里都是收藏的图片）
      const response = await userFavoritePictureUsingPost({
        picId: picId,
        userId: userId
      })

      if (response.data?.code === 20000 && response.data?.data) {
        picture.isFavorite = true
        message.success('收藏成功')
      } else {
        message.error(response.data?.message || '收藏失败')
      }
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    message.error('收藏操作失败，请稍后重试')
  }
}

// 页面挂载时获取数据
onMounted(() => {
  // 获取用户登录状态
  loginUserStore.fetchLoginUser()
  fetchFavoritePictureList()
  document.addEventListener('keydown', handleKeyDown)
})

// 页面卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  // 确保移除body的modal-open类
  document.body.classList.remove('modal-open')
})
</script>

<style scoped>
#favoritePicturePage {
  min-height: 100vh;
  background: #fafafa;
  padding: 30px 20px;
}

/* 加载状态 */
.loading-container {
  text-align: center;
  padding: 100px 0;
}

/* 图片网格 */
.picture-grid {
  margin-bottom: 30px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 15px;
  padding: 0 5px;
}

.picture-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.picture-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.image-container {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
}

/* 移动端图片容器自适应高度 */
@media (max-width: 600px) {
  .image-container {
    height: auto;
    min-height: 200px;
  }
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
  opacity: 0;
}

/* 移动端图片自适应 */
@media (max-width: 600px) {
  .image-container img {
    width: 100%;
    height: auto;
    max-height: 80vh;
    object-fit: contain;
  }
}

.image-container:hover img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
  padding: 20px;
}

.picture-card:hover .image-overlay {
  opacity: 1;
}

/* 移动端取消悬停效果 */
@media (max-width: 600px) {
  .image-container:hover img {
    transform: none;
  }

  .image-overlay {
    display: none;
  }

  .picture-card:hover .image-overlay {
    display: none;
  }

  .favorite-btn {
    display: none !important; /* 移动端完全隐藏收藏按钮 */
  }
}

.overlay-content {
  color: white;
}

.overlay-content p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

/* 收藏按钮 */
.favorite-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: block;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* PC端悬停时显示收藏按钮 */
.picture-card:hover .favorite-btn {
  opacity: 1;
}

.heart-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  border: none !important;
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

.heart-btn:hover {
  background: rgba(255, 255, 255, 1) !important;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
}

.heart-btn.favorited {
  background: rgba(255, 255, 255, 0.95) !important;
}

.favorite-icon {
  width: 20px;
  height: 20px;
  color: #666;
  transition: color 0.3s ease;
}

.heart-btn.favorited .favorite-icon {
  color: #1890ff;
}

/* 无数据提示 */
.no-data {
  text-align: center;
  padding: 80px 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

/* 分页 */
.pagination-container {
  text-align: center;
  padding: 25px 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

/* 全屏模态框样式 */
:global(.fullscreen-modal) {
  top: 0 !important;
  left: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
  height: 100vh !important;
  overflow: hidden !important;
  animation: none !important;
  transition: none !important;
  transform: none !important;
}

:global(.fullscreen-modal .ant-modal-content) {
  border-radius: 0 !important;
  height: 100vh !important;
  background: transparent !important;
  box-shadow: none !important;
  overflow: hidden !important;
  animation: none !important;
  transition: none !important;
  transform: none !important;
  top: 0 !important;
  left: 0 !important;
  position: fixed !important;
}

:global(.fullscreen-modal .ant-modal-body) {
  padding: 0 !important;
  height: 100vh !important;
  overflow: hidden !important;
}

:global(.fullscreen-modal .ant-modal-close) {
  display: none !important;
}

:global(.fullscreen-modal .ant-modal-header) {
  display: none !important;
}

/* 确保模态框中的图片没有默认样式 */
:global(.fullscreen-modal img) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 禁用模态框遮罩动画 */
:global(.fullscreen-modal .ant-modal-mask) {
  animation: none !important;
  transition: none !important;
  opacity: 1 !important;
}

/* 禁用模态框包装器动画 */
:global(.fullscreen-modal .ant-modal-wrap) {
  animation: none !important;
  transition: none !important;
}

/* 全屏模态框打开时禁用body滚动 */
:global(body.modal-open) {
  overflow: hidden !important;
  height: 100vh !important;
  position: fixed !important;
  width: 100% !important;
}

/* 预览模态框 */
.preview-content {
  position: relative;
  background: #000;
  height: 100vh;
  width: 100vw;
  display: block;
  overflow: hidden;
  margin: 0;
  padding: 0;
  border: none;
  animation: none !important;
  transition: none !important;
  transform: none !important;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1003;
  backdrop-filter: blur(10px);
  pointer-events: auto;
  height: 60px;
  box-sizing: border-box;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-counter {
  font-size: 14px;
  font-weight: 500;
}

.close-btn {
  color: white !important;
  font-size: 24px;
  font-weight: bold;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.preview-image-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.preview-image {
  max-width: calc(100vw - 120px);
  max-height: calc(100vh - 140px);
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  background: transparent;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  margin: 0;
  padding: 0;
  animation: none !important;
  transition: none !important;
  transform: none !important;
}

.nav-btn {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.6) !important;
  color: white !important;
  font-size: 32px;
  font-weight: bold;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  pointer-events: auto;
  border: none !important;
  outline: none !important;
}

.nav-btn:hover {
  background: rgba(0, 0, 0, 0.8) !important;
  transform: translateY(-50%) scale(1.1);
}

.nav-btn-left {
  left: 20px;
}

.nav-btn-right {
  right: 20px;
}

.preview-info {
  padding: 15px;
  background: rgba(0, 0, 0, 0.8);
  text-align: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1003;
  backdrop-filter: blur(10px);
  pointer-events: auto;
  height: 80px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.author-info {
  color: #fff;
  font-style: italic;
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

/* 固定在屏幕右下角的收藏按钮 */
.preview-favorite-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1004;
  opacity: 0.9;
  transition: opacity 0.3s ease;
}

.preview-favorite-btn:hover {
  opacity: 1;
}

.preview-favorite-btn .preview-heart-btn {
  background: rgba(0, 0, 0, 0.6) !important;
  border: none !important;
  color: white !important;
  width: 50px !important;
  height: 50px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
}

.preview-favorite-btn .preview-heart-btn:hover {
  background: rgba(0, 0, 0, 0.8) !important;
  transform: scale(1.1) !important;
}

.preview-favorite-btn .preview-heart-btn.favorited {
  background: rgba(0, 0, 0, 0.8) !important;
}

.preview-favorite-btn .favorite-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.preview-favorite-btn .preview-heart-btn.favorited .favorite-icon {
  color: #1890ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 10px;
    padding: 0 2px;
  }
}

@media (max-width: 600px) {
  #favoritePicturePage {
    padding: 0 5px;
  }

  .grid-container {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 0;
  }

  .picture-card {
    max-width: 100%;
    border-radius: 4px;
  }

  .image-container {
    height: auto;
    min-height: 200px;
    border-radius: 4px;
  }

  /* 移动端预览样式 */
  .preview-image {
    max-width: calc(100vw - 20px);
    max-height: calc(100vh - 120px);
    width: auto;
    height: auto;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    animation: none !important;
    transition: none !important;
    transform: none !important;
    object-fit: contain;
  }

  .nav-btn {
    width: 40px;
    height: 40px;
    font-size: 24px;
    z-index: 1002;
  }

  .nav-btn-left {
    left: 10px;
  }

  .nav-btn-right {
    right: 10px;
  }

  .preview-header {
    padding: 10px 15px;
    height: 50px;
    z-index: 1003;
  }

  /* 移动端预览收藏按钮样式 */
  .preview-favorite-btn {
    bottom: 15px;
    right: 15px;
  }

  .preview-favorite-btn .preview-heart-btn {
    width: 44px !important;
    height: 44px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
  }

  .preview-favorite-btn .favorite-icon {
    width: 20px;
    height: 20px;
  }

  .preview-info {
    padding: 10px;
    height: 70px;
    z-index: 1003;
  }

  .author-info {
    font-size: 11px;
  }

  .pagination-container {
    padding: 15px 0;
    margin-top: 10px;
  }
}

@media (max-width: 480px) {
  #favoritePicturePage {
    padding: 0 3px;
  }

  .grid-container {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 0;
  }

  .picture-card {
    border-radius: 2px;
    max-width: 100%;
  }

  .image-container {
    height: auto;
    min-height: 150px;
    border-radius: 2px;
  }
}
</style>
