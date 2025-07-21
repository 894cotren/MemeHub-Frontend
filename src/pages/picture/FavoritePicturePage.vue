
<template>
  <div id="favoritePicturePage">
    <h2 style="margin-bottom: 16px; text-align: center; color: #ffffff;">我的收藏</h2>

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
            <!-- 缩放控制按钮 -->
            <div class="zoom-controls">
              <a-button
                type="text"
                @click="zoomOut"
                class="zoom-btn"
                title="缩小"
              >
                -
              </a-button>
              <span class="zoom-ratio">{{ Math.round(imageScale * 100) }}%</span>
              <a-button
                type="text"
                @click="zoomIn"
                class="zoom-btn"
                title="放大"
              >
                +
              </a-button>
              <a-button
                type="text"
                @click="resetZoom"
                class="reset-btn"
                title="重置"
              >
                重置
              </a-button>
            </div>

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
            :class="{
              zoomed: imageScale > 1,
              'can-drag': canDrag(),
              'dragging': isDragging
            }"
            @click.stop
            @mousedown="handleMouseDown"
            @wheel="handleWheel"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
            :style="{ transform: `translate(${imageTranslateX}px, ${imageTranslateY}px) scale(${imageScale})` }"
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

// 图片缩放和平移相关状态
const imageScale = ref(1)
const imageTranslateX = ref(0)
const imageTranslateY = ref(0)
const isDragging = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)

// 图片尺寸相关状态
const imageNaturalWidth = ref(0)
const imageNaturalHeight = ref(0)
const imageDisplayWidth = ref(0)
const imageDisplayHeight = ref(0)
const containerWidth = ref(0)
const containerHeight = ref(0)

// 触摸事件处理 (移动端双指缩放)
const lastTouchDistance = ref(0)
const isTouching = ref(false)
const isOneFingerDrag = ref(false)
const lastTouchX = ref(0)
const lastTouchY = ref(0)

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
  // 重置缩放状态
  resetZoom()
  // 恢复body滚动
  document.body.classList.remove('modal-open')
}

// 上一张图片
const prevPicture = () => {
  if (currentPictureIndex.value > 0) {
    currentPictureIndex.value--
    currentPicture.value = pictureList.value[currentPictureIndex.value]
    // 重置缩放状态
    resetZoom()
  }
}

// 下一张图片
const nextPicture = () => {
  if (currentPictureIndex.value < pictureList.value.length - 1) {
    currentPictureIndex.value++
    currentPicture.value = pictureList.value[currentPictureIndex.value]
    // 重置缩放状态
    resetZoom()
  }
}

// 重置缩放状态，确保图片严格居中
const resetZoom = () => {
  imageScale.value = 1
  imageTranslateX.value = 0  // 严格左右居中
  imageTranslateY.value = 0  // 严格上下居中
  isDragging.value = false
  isTouching.value = false
  isOneFingerDrag.value = false
  lastTouchDistance.value = 0
  lastTouchX.value = 0
  lastTouchY.value = 0

  // 清理全局监听器
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
}

// 获取图片元素的实际渲染尺寸
const getImageActualSize = () => {
  const imageElement = document.querySelector('.preview-image') as HTMLImageElement
  if (!imageElement) {
    return { width: 0, height: 0 }
  }
  
  return {
    width: imageElement.offsetWidth,
    height: imageElement.offsetHeight
  }
}

// 计算拖拽限制范围
const calculateDragLimits = () => {
  const containerWidth = window.innerWidth
  const containerHeight = window.innerHeight - 100 // 减去头部和底部UI区域
  
  const actualImageSize = getImageActualSize()
  if (!actualImageSize.width || !actualImageSize.height) {
    return {
      maxTranslateX: 0,
      maxTranslateY: 0,
      minTranslateX: 0,
      minTranslateY: 0,
      canMoveX: false,
      canMoveY: false
    }
  }

  // 计算图片缩放后的实际尺寸
  const scaledWidth = actualImageSize.width * imageScale.value
  const scaledHeight = actualImageSize.height * imageScale.value

  // 判断是否溢出
  const overflowX = scaledWidth > containerWidth
  const overflowY = scaledHeight > containerHeight
  
  // 只有溢出的方向才允许拖动
  const maxTranslateX = overflowX ? (scaledWidth - containerWidth) / 2 : 0
  const maxTranslateY = overflowY ? (scaledHeight - containerHeight) / 2 : 0

  return {
    maxTranslateX,
    maxTranslateY,
    minTranslateX: -maxTranslateX,
    minTranslateY: -maxTranslateY,
    canMoveX: overflowX,
    canMoveY: overflowY
  }
}

// 应用拖拽限制
const applyDragLimits = () => {
  const limits = calculateDragLimits()

  // X方向：如果没有溢出，强制居中；如果溢出，限制在边界内
  if (!limits.canMoveX) {
    imageTranslateX.value = 0
  } else {
    imageTranslateX.value = Math.max(
      limits.minTranslateX,
      Math.min(limits.maxTranslateX, imageTranslateX.value)
    )
  }

  // Y方向：如果没有溢出，强制居中；如果溢出，限制在边界内
  if (!limits.canMoveY) {
    imageTranslateY.value = 0
  } else {
    imageTranslateY.value = Math.max(
      limits.minTranslateY,
      Math.min(limits.maxTranslateY, imageTranslateY.value)
    )
  }
}

// 鼠标滚轮缩放
const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.5, Math.min(3, imageScale.value + delta))

  if (newScale !== imageScale.value) {
    imageScale.value = newScale

    // 如果缩放到原始大小，重置位置到严格居中
    if (imageScale.value === 1) {
      imageTranslateX.value = 0
      imageTranslateY.value = 0
    }

    // 应用拖拽限制
    applyDragLimits()
  }
}

// 缩放控制
const zoomIn = () => {
  imageScale.value = Math.min(3, imageScale.value + 0.2)
  applyDragLimits()
}

const zoomOut = () => {
  imageScale.value = Math.max(0.5, imageScale.value - 0.2)

  // 如果缩放到原始大小，重置位置到严格居中
  if (imageScale.value === 1) {
    imageTranslateX.value = 0
    imageTranslateY.value = 0
  }

  // 应用拖拽限制
  applyDragLimits()
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
    case '=':
    case '+':
      event.preventDefault()
      zoomIn()
      break
    case '-':
      event.preventDefault()
      zoomOut()
      break
    case '0':
      event.preventDefault()
      resetZoom()
      break
  }
}

// 图片加载完成时获取尺寸信息
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.opacity = '1'

  // 获取图片的自然尺寸
  imageNaturalWidth.value = img.naturalWidth
  imageNaturalHeight.value = img.naturalHeight

  // 计算图片的实际显示尺寸
  const containerWidth = window.innerWidth
  const containerHeight = window.innerHeight

  // 对于长图片，我们使用更宽松的显示逻辑
  const maxDisplayWidth = containerWidth - 100
  const maxDisplayHeight = containerHeight - 100

  // 计算宽高比
  const imageAspectRatio = imageNaturalWidth.value / imageNaturalHeight.value
  const containerAspectRatio = maxDisplayWidth / maxDisplayHeight

  // 检查是否为长图片（高度明显大于宽度）
  const isLongImage = imageAspectRatio < 0.6 // 宽高比小于0.6认为是长图片

  if (isLongImage) {
    // 对于长图片，优先适应宽度，允许高度超出
    const widthRatio = maxDisplayWidth / imageNaturalWidth.value
    imageDisplayWidth.value = imageNaturalWidth.value * widthRatio
    imageDisplayHeight.value = imageNaturalHeight.value * widthRatio
  } else {
    // 对于普通图片，保持原有逻辑
    const widthRatio = maxDisplayWidth / imageNaturalWidth.value
    const heightRatio = maxDisplayHeight / imageNaturalHeight.value
    const displayRatio = Math.min(widthRatio, heightRatio)

    imageDisplayWidth.value = imageNaturalWidth.value * displayRatio
    imageDisplayHeight.value = imageNaturalHeight.value * displayRatio
  }

  // 应用拖拽限制
  applyDragLimits()
}

// 添加窗口尺寸变化时的处理
const handleWindowResize = () => {
  // 重新计算图片显示尺寸
  if (imageNaturalWidth.value && imageNaturalHeight.value) {
    const containerWidth = window.innerWidth
    const containerHeight = window.innerHeight

    const maxDisplayWidth = containerWidth - 100
    const maxDisplayHeight = containerHeight - 100

    // 计算宽高比
    const imageAspectRatio = imageNaturalWidth.value / imageNaturalHeight.value
    const isLongImage = imageAspectRatio < 0.6

    if (isLongImage) {
      // 对于长图片，优先适应宽度
      const widthRatio = maxDisplayWidth / imageNaturalWidth.value
      imageDisplayWidth.value = imageNaturalWidth.value * widthRatio
      imageDisplayHeight.value = imageNaturalHeight.value * widthRatio
    } else {
      // 对于普通图片，保持原有逻辑
      const widthRatio = maxDisplayWidth / imageNaturalWidth.value
      const heightRatio = maxDisplayHeight / imageNaturalHeight.value
      const displayRatio = Math.min(widthRatio, heightRatio)

      imageDisplayWidth.value = imageNaturalWidth.value * displayRatio
      imageDisplayHeight.value = imageNaturalHeight.value * displayRatio
    }
  }

  // 重新应用拖拽限制
  applyDragLimits()
}

// 图片加载失败处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/favicon.ico' // 设置默认图片
  img.alt = '图片加载失败'
}

// 检查图片是否超出屏幕，只有超出时才允许拖拽
const canDrag = () => {
  const limits = calculateDragLimits()
  // 如果图片的缩放尺寸超出了容器，才允许拖拽
  return limits.maxTranslateX > 5 || limits.maxTranslateY > 5
}

// 鼠标事件处理 (缩放和平移)
const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 0) { // 只处理左键
    // 只有当图片超出屏幕时才允许拖拽
    if (!canDrag()) {
      return
    }

    isDragging.value = true
    lastMouseX.value = event.clientX
    lastMouseY.value = event.clientY
    event.preventDefault()

    // 添加全局监听器
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
  }
}

const handleGlobalMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return

  const deltaX = event.clientX - lastMouseX.value
  const deltaY = event.clientY - lastMouseY.value

  imageTranslateX.value += deltaX
  imageTranslateY.value += deltaY

  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY

  // 应用拖拽限制
  applyDragLimits()

  event.preventDefault()
}

const handleGlobalMouseUp = (event: MouseEvent) => {
  if (event.button === 0) { // 只处理左键
    isDragging.value = false

    // 移除全局监听器
    document.removeEventListener('mousemove', handleGlobalMouseMove)
    document.removeEventListener('mouseup', handleGlobalMouseUp)
  }
}

// 保持原有的方法名以免破坏模板绑定
const handleMouseMove = (event: MouseEvent) => {
  // 这个方法现在不需要做任何事情，因为拖拽由全局监听器处理
}

const handleMouseUp = () => {
  // 这个方法现在不需要做任何事情，因为拖拽由全局监听器处理
}

const handleMouseLeave = () => {
  // 这个方法现在不需要做任何事情，因为拖拽由全局监听器处理
}

// 触摸事件处理 (移动端双指缩放)
const getTouchDistance = (touches: TouchList) => {
  if (touches.length < 2) return 0

  const touch1 = touches[0]
  const touch2 = touches[1]

  return Math.sqrt(
    Math.pow(touch2.clientX - touch1.clientX, 2) +
    Math.pow(touch2.clientY - touch1.clientY, 2)
  )
}

const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 2) {
    isTouching.value = true
    lastTouchDistance.value = getTouchDistance(event.touches)
    event.preventDefault()
  } else if (event.touches.length === 1) {
    // 单指拖拽（仅在图片超出屏幕时）
    if (canDrag()) {
      isOneFingerDrag.value = true
      lastTouchX.value = event.touches[0].clientX
      lastTouchY.value = event.touches[0].clientY
      event.preventDefault()
    }
  }
}

const handleTouchMove = (event: TouchEvent) => {
  if (event.touches.length === 2 && isTouching.value) {
    // 双指缩放
    const currentDistance = getTouchDistance(event.touches)
    const deltaDistance = currentDistance - lastTouchDistance.value

    if (Math.abs(deltaDistance) > 10) {
      const delta = deltaDistance > 0 ? 0.1 : -0.1
      const newScale = Math.max(0.5, Math.min(3, imageScale.value + delta))

      if (newScale !== imageScale.value) {
        imageScale.value = newScale

        // 如果缩放到原始大小，重置位置
        if (imageScale.value === 1) {
          imageTranslateX.value = 0
          imageTranslateY.value = 0
        }

        // 应用拖拽限制
        applyDragLimits()
      }

      lastTouchDistance.value = currentDistance
    }

    event.preventDefault()
  } else if (event.touches.length === 1 && isOneFingerDrag.value) {
    // 单指拖拽
    const deltaX = event.touches[0].clientX - lastTouchX.value
    const deltaY = event.touches[0].clientY - lastTouchY.value

    imageTranslateX.value += deltaX
    imageTranslateY.value += deltaY

    lastTouchX.value = event.touches[0].clientX
    lastTouchY.value = event.touches[0].clientY

    // 应用拖拽限制
    applyDragLimits()

    event.preventDefault()
  }
}

const handleTouchEnd = () => {
  isTouching.value = false
  isOneFingerDrag.value = false
  lastTouchDistance.value = 0
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

  // 监听窗口大小变化
  window.addEventListener('resize', handleWindowResize)
})

// 页面卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  // 确保移除body的modal-open类
  document.body.classList.remove('modal-open')
  // 清理全局监听器
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)

  // 移除窗口大小变化监听器
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<style scoped>
#favoritePicturePage {
  min-height: 100vh;
  background: rgb(34, 34, 34);
  padding: 30px 20px;
  color: #ffffff;
}

/* 加载状态 */
.loading-container {
  text-align: center;
  padding: 100px 0;
  color: #ffffff;
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
  background: rgb(50, 50, 50);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  border: 1px solid rgb(60, 60, 60);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.picture-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.7);
  border-color: rgb(80, 80, 80);
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
  background: rgb(50, 50, 50);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  color: #ffffff;
  border: 1px solid rgb(60, 60, 60);
}

/* 分页 */
.pagination-container {
  text-align: center;
  padding: 25px 0;
  background: rgb(50, 50, 50);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  color: #ffffff;
  border: 1px solid rgb(60, 60, 60);
}

/* 深色主题分页样式 */
:deep(.ant-pagination .ant-pagination-item) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
}

:deep(.ant-pagination .ant-pagination-item a) {
  color: #cccccc !important;
}

:deep(.ant-pagination .ant-pagination-item-active) {
  background: rgb(60, 60, 60) !important;
  border-color: rgb(80, 80, 80) !important;
}

:deep(.ant-pagination .ant-pagination-item-active a) {
  color: #ffffff !important;
}

:deep(.ant-pagination .ant-pagination-prev, .ant-pagination .ant-pagination-next) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
}

:deep(.ant-pagination .ant-pagination-prev a, .ant-pagination .ant-pagination-next a) {
  color: #cccccc !important;
}

:deep(.ant-pagination .ant-pagination-jump-prev, .ant-pagination .ant-pagination-jump-next) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #cccccc !important;
}

:deep(.ant-pagination .ant-pagination-options) {
  color: #cccccc !important;
}

:deep(.ant-pagination .ant-pagination-options-quick-jumper input) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #ffffff !important;
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
  user-select: none;
}

.preview-image {
  max-width: calc(100vw - 120px);
  max-height: calc(100vh - 100px);
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
  transition: transform 0.1s ease;
  transform-origin: center center;
  cursor: default;
  user-select: none;
  pointer-events: auto;
}

.preview-image.can-drag {
  cursor: grab;
}

.preview-image.dragging {
  cursor: grabbing;
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
  background: transparent;
  text-align: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1003;
  pointer-events: auto;
  height: 40px;
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
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6);
}

.usage-tip {
  color: #fff;
  font-size: 12px;
  opacity: 0.8;
  margin-top: 5px;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6);
}

.mobile-tip {
  display: none;
}

.desktop-tip {
  display: inline;
}

/* 移动端显示不同的提示 */
@media (max-width: 768px) {
  .mobile-tip {
    display: inline;
  }

  .desktop-tip {
    display: none;
  }
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

/* 缩放控制按钮 */
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 0, 0, 0.6);
  padding: 5px 10px;
  border-radius: 8px;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.zoom-btn {
  background: none !important;
  border: none !important;
  color: white !important;
  font-size: 20px;
  font-weight: bold;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  opacity: 0.8;
}

.zoom-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  opacity: 1;
}

.zoom-ratio {
  color: white;
  font-size: 14px;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  border: none !important;
  color: white !important;
  font-size: 14px;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
  opacity: 0.8;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  opacity: 1;
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
    max-height: calc(100vh - 100px);
    width: auto;
    height: auto;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    animation: none !important;
    transition: transform 0.1s ease;
    transform-origin: center;
    object-fit: contain;
    cursor: grab;
  }

  .preview-image:active {
    cursor: grabbing;
  }

  .preview-image.zoomed {
    cursor: move;
  }

  /* 移动端缩放控制 */
  .zoom-controls {
    gap: 3px;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .zoom-btn {
    width: 25px;
    height: 25px;
    font-size: 16px;
  }

  .zoom-ratio {
    font-size: 12px;
    min-width: 35px;
  }

  .reset-btn {
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 6px;
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
