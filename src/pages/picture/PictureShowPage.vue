
<template>
  <div id="pictureShowPage">
        <!-- 搜索区域 -->
    <div class="search-section">
      <a-row :gutter="[16, 16]" justify="center" align="middle" class="search-row">
        <a-col :xs="24" :sm="24" :md="4" :lg="3" class="category-col">
          <a-select
            v-model:value="searchForm.category"
            placeholder="全部分类"
            allow-clear
            size="default"
            @change="handleSearch"
          >
            <a-select-option value="">全部分类</a-select-option>
            <a-select-option value="meme">表情包</a-select-option>
            <a-select-option value="funny">搞笑</a-select-option>
            <a-select-option value="animal">动物</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :sm="24" :md="16" :lg="12" class="search-col">
          <a-input-search
            v-model:value="searchForm.searchText"
            placeholder="搜索图片..."
            enter-button="搜索"
            size="default"
            @search="handleSearch"
            @input="handleSearchInput"
          />
        </a-col>
      </a-row>
    </div>

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
            <div class="image-overlay">
              <div class="overlay-content">
                <h3 v-if="picture.picName">{{ picture.picName }}</h3>
                <p v-if="picture.userName">by {{ picture.userName }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据提示 -->
      <div v-if="!loading && pictureList.length === 0" class="no-data">
        <a-empty description="暂无图片数据" />
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
          <a-button
            type="text"
            @click="closePreview"
            class="close-btn"
          >
            ×
          </a-button>
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
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { getPicturePagesVoUsingPost } from '@/api/pictureController'

// 响应式数据
const loading = ref(false)
const pictureList = ref<API.PicturePagesVO[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12) // 固定每页12张图片

const previewVisible = ref(false)
const currentPicture = ref<API.PicturePagesVO | null>(null)
const currentPictureIndex = ref(0)

// 搜索表单
const searchForm = reactive<API.PictureVOPagesRequest>({
  searchText: '',
  category: '',
  pageNum: 1,
  pageSize: 12,
  sortField: 'createTime',
  sortOrder: 'desc'
})

// 获取图片列表
const fetchPictureList = async () => {
  try {
    loading.value = true

    const requestParams: API.PictureVOPagesRequest = {
      ...searchForm,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }

        const response = await getPicturePagesVoUsingPost(requestParams)

    if (response.data?.code === 20000 && response.data?.data) {
      pictureList.value = response.data.data.records || []
      total.value = parseInt(String(response.data.data.total || 0)) || 0
    } else {
      message.error(response.data?.message || '获取图片列表失败')
      pictureList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取图片列表失败:', error)
    message.error('获取图片列表失败，请稍后重试')
    pictureList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchPictureList()
}

// 搜索输入处理（防抖）
let searchTimeout: number
const handleSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 500)
}

// 分页变化处理
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchPictureList()
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



// 页面挂载时获取数据
onMounted(() => {
  fetchPictureList()
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
#pictureShowPage {
  min-height: 100vh;
  background: #fafafa;
  padding: 0 20px;
}

/* 页面头部 */
.page-header {
  text-align: center;
  padding: 40px 0 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: -20px -20px 30px -20px;
  color: white;
}

.page-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.page-subtitle {
  font-size: 1.2rem;
  margin: 10px 0 0 0;
  opacity: 0.9;
}

/* 搜索区域 */
.search-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}

.search-row {
  margin: 0 !important;
}

.category-col,
.search-col {
  padding: 0 8px !important;
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
}

.overlay-content {
  color: white;
}

.overlay-content h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.overlay-content p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 10px;
    padding: 0 2px;
  }

  .search-section {
    padding: 15px;
  }

  .category-col {
    margin-bottom: 10px;
  }

  .search-col {
    margin-bottom: 0;
  }
}

@media (max-width: 600px) {
  #pictureShowPage {
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
}

@media (max-width: 480px) {
  #pictureShowPage {
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

  .search-section {
    padding: 8px;
    margin-bottom: 15px;
  }

  .category-col,
  .search-col {
    padding: 0 3px !important;
  }

  .category-col {
    margin-bottom: 6px;
  }

  /* 移动端预览样式 */
  .preview-image-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    overflow: hidden;
  }

  .preview-image {
    max-width: calc(100vw - 100px);
    max-height: calc(100vh - 120px);
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    animation: none !important;
    transition: none !important;
    transform: none !important;
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
</style>
