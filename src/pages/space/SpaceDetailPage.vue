<template>
  <div id="spaceDetailPage" class="dark-theme">
    <!-- 空间信息 -->
    <div class="space-header">
      <a-flex justify="space-between" align="center">
        <h2>{{ space.spaceName }}（{{ space.spaceType === 1 ? '团队空间' : '私有空间' }}）</h2>
        <a-space size="middle">
<!--          <a-button type="primary" :href="`/addPicture?spaceId=${id}`" target="_blank">
            + 创建图片
          </a-button>-->
          <a-button type="primary" @click="goToAddPicture">
            + 创建图片
          </a-button>
          <!-- 团队空间特有的成员管理按钮 -->
          <a-button
            v-if="space.spaceType === 1"
            type="default"
            @click="goToMemberManage"
          >
            👥 成员管理
          </a-button>
          <a-tooltip
            :title="`占用空间 ${formatSize(space.totalSize || 0)} / ${formatSize(space.maxSize || 0)}`"
          >
            <a-progress
              type="circle"
              :percent="getStoragePercent()"
              :size="42"
              :stroke-color="getProgressColor(getStoragePercent())"
            />
          </a-tooltip>
        </a-space>
      </a-flex>

      <!-- 空间详细信息 -->
      <div class="space-info">
        <div class="info-item">
          <span class="label">空间级别：</span>
          <a-tag :color="getSpaceLevelColor(space.spaceLevel)">
            {{ getSpaceLevelText(space.spaceLevel) }}
          </a-tag>
        </div>
        <div class="info-item">
          <span class="label">图片数量：</span>
          <span class="value">{{ space.totalCount || 0 }} / {{ space.maxCount || 0 }} 张</span>
        </div>
        <div class="info-item">
          <span class="label">创建时间：</span>
          <span class="value">{{ formatDate(space.createTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 图片列表 -->
    <div class="picture-section">
      <!-- 排序区域 -->
      <div class="sort-section">
        <div class="sort-wrapper">
          <span class="sort-label">排序：</span>
          <a-select
            v-model:value="searchParams.sortOrder"
            size="small"
            class="simple-select"
            :bordered="false"
            @change="handleSortChange"
          >
            <a-select-option value="descend">时间降序</a-select-option>
            <a-select-option value="ascend">时间升序</a-select-option>
          </a-select>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" />
      </div>

      <!-- 图片网格 -->
      <div v-else class="picture-grid">
        <div class="grid-container">
          <div
            v-for="picture in dataList"
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
              <!-- 操作按钮组 -->
              <div class="action-buttons">
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
                <!-- 删除按钮 -->
                <div
                  class="delete-btn"
                  @click="handleDeletePicture(picture, $event)"
                >
                  <a-popconfirm
                    title="确定要删除这张图片吗？"
                    ok-text="确定"
                    cancel-text="取消"
                    @confirm="confirmDeletePicture(picture)"
                    @click.stop
                  >
                    <a-button
                      type="text"
                      class="delete-btn-inner"
                      shape="circle"
                      size="large"
                      danger
                    >
                      <template #icon>
                        <svg class="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                        </svg>
                      </template>
                    </a-button>
                  </a-popconfirm>
                </div>
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
        <div v-if="!loading && dataList.length === 0" class="no-data">
          <a-empty description="暂无图片数据" />
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container" v-if="total > 0">
        <a-pagination
          v-model:current="searchParams.current"
          :total="total"
          :page-size="searchParams.pageSize"
          :show-size-changer="false"
          :show-quick-jumper="true"
          show-total
          @change="onPageChange"
        />
      </div>
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
            {{ currentPictureIndex + 1 }} / {{ dataList.length }}
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
            v-if="currentPictureIndex < dataList.length - 1"
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
            By：{{ currentPicture.userName }}
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
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController'
import { getPicturePagesVoUsingPost, deletePictureByIdUsingPost } from '@/api/pictureController'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const props = defineProps<{
  id: string
}>()

const router = useRouter()
const route = useRoute()

// 空间信息
const space = ref<API.SpaceVO>({})

// 获取空间详情
const fetchSpaceDetail = async (spaceId?: string) => {
  const id = spaceId || props.id
  if (!id) return

  try {
    console.log('获取空间详情，spaceId:', id, '类型:', typeof id)
    const res = await getSpaceVoByIdUsingGet({
      id: id,
    })
    if (res.data.code === 20000 && res.data.data) {
      space.value = res.data.data
      console.log('获取到空间详情:', space.value)
    } else {
      console.error('获取空间详情失败，响应:', res.data)
      message.error('获取空间详情失败，' + (res.data.message || '未知错误'))
    }
  } catch (e: any) {
    console.error('获取空间详情失败:', e)
    message.error('获取空间详情失败：' + (e.response?.data?.message || e.message || '网络错误'))
  }
}

// 数据
const dataList = ref<(API.Picture & { isFavorite?: boolean })[]>([])
const total = ref(0)
const loading = ref(true)

// 搜索条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 12,
  sortField: 'create_time',
  sortOrder: 'descend',
})

// 分页参数
const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  fetchData()
}

// 获取数据
const fetchData = async (spaceId?: string) => {
  loading.value = true
  try {
    // 转换搜索参数
    const params = {
      spaceId: spaceId || props.id,
      ...searchParams,
    }
    console.log('获取图片数据，参数:', params, 'spaceId类型:', typeof params.spaceId)
    const res = await getPicturePagesVoUsingPost(params)
    if (res.data.code === 20000 && res.data.data) {
      dataList.value = res.data.data.records ?? []
      total.value = res.data.data.total ?? 0
      console.log('获取到图片数据:', dataList.value.length, '张图片')
    } else {
      console.error('获取数据失败，响应:', res.data)
      message.error('获取数据失败，' + (res.data.message || '未知错误'))
      dataList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取图片列表失败:', error)
    message.error('获取图片列表失败')
  } finally {
    loading.value = false
  }
}

//创建图片跳转
const goToAddPicture = () => {
  // 跳转到创建图片页面，传递空间ID参数
  const currentSpaceId = route.params.id || props.id
  console.log('跳转到创建图片页面，spaceId:', currentSpaceId)
  router.push(`/addPicture?spaceId=${currentSpaceId}`)
}

//跳转到成员管理页面
const goToMemberManage = () => {
  // 跳转到成员管理页面，传递空间ID参数
  const currentSpaceId = route.params.id || props.id
  console.log('跳转到成员管理页面，spaceId:', currentSpaceId)
  router.push(`/space/${currentSpaceId}/members`)
}

// 图片预览
const previewVisible = ref(false)
const currentPicture = ref<(API.Picture & { isFavorite?: boolean }) | null>(null)
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

// 空间级别相关
const getSpaceLevelText = (level: number | undefined) => {
  if (level === 0) return '普通版'
  if (level === 1) return '专业版'
  if (level === 2) return '旗舰版'
  return '未知'
}

const getSpaceLevelColor = (level: number | undefined) => {
  if (level === 0) return 'blue'
  if (level === 1) return 'green'
  if (level === 2) return 'purple'
  return 'default'
}

// 存储使用百分比
const getStoragePercent = () => {
  if (!space.value.maxSize || !space.value.totalSize) return 0
  return Math.round((space.value.totalSize / space.value.maxSize) * 100)
}

const getProgressColor = (percent: number) => {
  if (percent >= 90) return '#ff4d4f'
  if (percent >= 70) return '#faad14'
  return '#52c41a'
}

// 格式化文件大小
const formatSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (date: string | undefined) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 事件处理
const handleSortChange = (value: string) => {
  searchParams.sortOrder = value
  searchParams.current = 1
  fetchData()
}

const handlePictureClick = (picture: API.Picture & { isFavorite?: boolean }) => {
  const index = dataList.value.findIndex(p => p.id === picture.id)
  currentPictureIndex.value = index
  currentPicture.value = picture
  previewVisible.value = true
  // 禁用body滚动
  document.body.classList.add('modal-open')
}

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
    currentPicture.value = dataList.value[currentPictureIndex.value]
    // 重置缩放状态
    resetZoom()
  }
}

// 下一张图片
const nextPicture = () => {
  if (currentPictureIndex.value < dataList.value.length - 1) {
    currentPictureIndex.value++
    currentPicture.value = dataList.value[currentPictureIndex.value]
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

// 计算图片的显示尺寸
const calculateImageDisplaySize = () => {
  if (!imageNaturalWidth.value || !imageNaturalHeight.value) return

  // 获取容器尺寸
  containerWidth.value = window.innerWidth
  containerHeight.value = window.innerHeight

  // 计算最大显示尺寸（留出边距）
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

  // 重新应用拖拽限制
  applyDragLimits()
}

// 应用拖拽限制
const applyDragLimits = () => {
  if (!imageDisplayWidth.value || !imageDisplayHeight.value) return

  const maxTranslateX = Math.max(0, (imageDisplayWidth.value * imageScale.value - containerWidth.value) / 2)
  const maxTranslateY = Math.max(0, (imageDisplayHeight.value * imageScale.value - containerHeight.value) / 2)

  imageTranslateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, imageTranslateX.value))
  imageTranslateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, imageTranslateY.value))
}

// 检查是否可以拖拽
const canDrag = () => {
  return imageScale.value > 1
}

// 缩放功能
const zoomIn = () => {
  imageScale.value = Math.min(imageScale.value * 1.2, 5)
  applyDragLimits()
}

const zoomOut = () => {
  imageScale.value = Math.max(imageScale.value / 1.2, 0.5)
  applyDragLimits()
}

// 鼠标拖拽处理
const handleMouseDown = (event: MouseEvent) => {
  if (!canDrag()) return

  event.preventDefault()
  isDragging.value = true
  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY

  document.addEventListener('mousemove', handleGlobalMouseMove)
  document.addEventListener('mouseup', handleGlobalMouseUp)
}

const handleGlobalMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return

  const deltaX = event.clientX - lastMouseX.value
  const deltaY = event.clientY - lastMouseY.value

  imageTranslateX.value += deltaX
  imageTranslateY.value += deltaY

  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY

  applyDragLimits()
}

const handleGlobalMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
}

// 鼠标滚轮缩放
const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  if (event.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

// 触摸事件处理
const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    // 单指触摸 - 准备拖拽
    isOneFingerDrag.value = true
    const touch = event.touches[0]
    lastTouchX.value = touch.clientX
    lastTouchY.value = touch.clientY
  } else if (event.touches.length === 2) {
    // 双指触摸 - 准备缩放
    isTouching.value = true
    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    lastTouchDistance.value = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }
}

const handleTouchMove = (event: TouchEvent) => {
  if (event.touches.length === 1 && isOneFingerDrag.value && canDrag()) {
    // 单指拖拽
    const touch = event.touches[0]
    const deltaX = touch.clientX - lastTouchX.value
    const deltaY = touch.clientY - lastTouchY.value

    imageTranslateX.value += deltaX
    imageTranslateY.value += deltaY

    lastTouchX.value = touch.clientX
    lastTouchY.value = touch.clientY

    applyDragLimits()
  } else if (event.touches.length === 2 && isTouching.value) {
    // 双指缩放
    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )

    if (lastTouchDistance.value > 0) {
      const scaleFactor = currentDistance / lastTouchDistance.value
      imageScale.value = Math.max(0.5, Math.min(5, imageScale.value * scaleFactor))
      applyDragLimits()
    }

    lastTouchDistance.value = currentDistance
  }
}

const handleTouchEnd = () => {
  isTouching.value = false
  isOneFingerDrag.value = false
  lastTouchDistance.value = 0
}

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (!previewVisible.value) return

  switch (event.key) {
    case 'Escape':
      closePreview()
      break
    case 'ArrowLeft':
      if (currentPictureIndex.value > 0) {
        prevPicture()
      }
      break
    case 'ArrowRight':
      if (currentPictureIndex.value < dataList.value.length - 1) {
        nextPicture()
      }
      break
    case '=':
    case '+':
      zoomIn()
      break
    case '-':
      zoomOut()
      break
    case '0':
      resetZoom()
      break
  }
}

// 窗口大小变化处理
const handleWindowResize = () => {
  if (previewVisible.value) {
    calculateImageDisplaySize()
  }
}

const toggleFavorite = (picture: API.Picture & { isFavorite?: boolean }, event?: Event) => {
  if (event) {
    event.stopPropagation()
  }
  // TODO: 实现收藏/取消收藏逻辑
  picture.isFavorite = !picture.isFavorite
  message.success(picture.isFavorite ? '已收藏' : '已取消收藏')
}

// 删除图片处理
const handleDeletePicture = (picture: API.Picture & { isFavorite?: boolean }, event: Event) => {
  event.stopPropagation()
}

// 确认删除图片
const confirmDeletePicture = async (picture: API.Picture & { isFavorite?: boolean }) => {
  if (!picture.id) {
    message.error('图片ID不存在')
    return
  }

  try {
    const res = await deletePictureByIdUsingPost({
      id: picture.id
    })

    if (res.data.code === 20000) {
      message.success('删除成功')
      // 从列表中移除删除的图片
      dataList.value = dataList.value.filter(p => p.id !== picture.id)
      // 更新总数
      total.value = Math.max(0, total.value - 1)
      // 重新获取空间信息以更新容量
      fetchSpaceDetail()
    } else {
      message.error('删除失败：' + res.data.message)
    }
  } catch (error) {
    console.error('删除图片失败:', error)
    message.error('删除失败')
  }
}

const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img) {
    // 图片加载完成后显示
    img.style.opacity = '1'

    // 如果是预览图片，获取其自然尺寸
    if (img.classList.contains('preview-image')) {
      imageNaturalWidth.value = img.naturalWidth
      imageNaturalHeight.value = img.naturalHeight
      calculateImageDisplaySize()
    }
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img) {
    // 图片加载失败时的处理
    img.style.opacity = '0.5'
    console.error('图片加载失败:', img.src)
  }
}



// 监听路由参数变化，重新加载数据
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    console.log('路由参数变化，从', oldId, '变为', newId, '类型:', typeof newId)
    // 重置分页和搜索参数
    searchParams.current = 1
    searchParams.sortOrder = 'descend'

    // 确保newId是字符串类型
    const spaceIdStr = String(newId)
    console.log('转换后的spaceId:', spaceIdStr)

    // 重新获取数据
    fetchSpaceDetail(spaceIdStr)
    fetchData(spaceIdStr)
  }
}, { immediate: false })

// 页面加载
onMounted(() => {
  fetchSpaceDetail()
  fetchData()
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
.dark-theme {
  background: rgb(34, 34, 34);
  min-height: 100vh;
  padding: 20px;
  color: #ffffff;
}

.space-header {
  background: #1f1f1f;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #434343;
}

.space-header h2 {
  margin: 0 0 20px 0;
  font-size: 1.8rem;
  color: #ffffff;
}

.space-info {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  color: #8c8c8c;
  font-size: 14px;
}

.info-item .value {
  color: #ffffff;
  font-weight: 500;
}

.picture-section {
  background: transparent;
  border-radius: 0;
  padding: 0;
  border: none;
}

/* 排序区域 */
.sort-section {
  padding: 15px 0 10px 0;
  margin-bottom: 10px;
}

.sort-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sort-label {
  font-size: 0.9rem;
  color: #cccccc;
  white-space: nowrap;
}

/* 极简下拉框样式 */
.simple-select {
  font-size: 0.9rem !important;
}

.simple-select .ant-select-selector {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  height: auto !important;
  min-height: auto !important;
}

.simple-select .ant-select-selection-item {
  color: #cccccc !important;
  font-size: 0.9rem !important;
  padding-right: 0 !important;
  line-height: 1.4 !important;
}

.simple-select .ant-select-arrow {
  color: #cccccc !important;
  font-size: 10px !important;
  right: -2px !important;
}

.simple-select:hover .ant-select-selection-item {
  color: #40a9ff !important;
}

.simple-select:hover .ant-select-arrow {
  color: #40a9ff !important;
}

.simple-select.ant-select-focused .ant-select-selector {
  border: none !important;
  box-shadow: none !important;
}

/* 排序下拉选项样式 */
:deep(.ant-select-dropdown) {
  background: rgb(50, 50, 50) !important;
  border: 1px solid rgb(60, 60, 60) !important;
}

:deep(.ant-select-item) {
  color: #cccccc !important;
  background: rgb(50, 50, 50) !important;
}

:deep(.ant-select-item:hover) {
  background: rgba(64, 169, 255, 0.1) !important;
  color: #40a9ff !important;
}

:deep(.ant-select-item-option-selected) {
  background: rgba(64, 169, 255, 0.2) !important;
  color: #69c0ff !important;
}

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

.image-container img[src] {
  opacity: 1;
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
  background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.9) 100%);
  opacity: 0;
  transition: all 0.4s ease;
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

  .action-buttons {
    display: none !important; /* 移动端完全隐藏操作按钮组 */
  }

  .heart-btn {
    width: 36px !important;
    height: 36px !important;
  }

  .favorite-icon {
    width: 16px;
    height: 16px;
  }

  .delete-btn-inner {
    width: 36px !important;
    height: 36px !important;
  }

  .delete-icon {
    width: 14px;
    height: 14px;
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

/* 操作按钮组 */
.action-buttons {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* PC端悬停时显示操作按钮 */
.picture-card:hover .action-buttons {
  opacity: 1;
}

/* 收藏按钮 */
.favorite-btn {
  display: block;
}

/* 删除按钮 */
.delete-btn {
  display: block;
}

.heart-btn {
  background: rgba(50, 50, 50, 0.9) !important;
  border: 1px solid rgba(80, 80, 80, 0.8) !important;
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
}

.heart-btn:hover {
  background: rgba(70, 70, 70, 1) !important;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7) !important;
  border-color: rgba(100, 100, 100, 1) !important;
}

.heart-btn.favorited {
  background: rgba(255, 255, 255, 0.95) !important;
}

.favorite-icon {
  width: 20px;
  height: 20px;
  color: #cccccc;
  transition: color 0.3s ease;
}

.heart-btn.favorited .favorite-icon {
  color: #1890ff;
}

/* 删除按钮样式 */
.delete-btn-inner {
  background: rgba(50, 50, 50, 0.9) !important;
  border: 1px solid rgba(80, 80, 80, 0.8) !important;
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
}

.delete-btn-inner:hover {
  background: rgba(220, 38, 38, 0.9) !important;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.5) !important;
  border-color: rgba(239, 68, 68, 1) !important;
}

.delete-icon {
  width: 18px;
  height: 18px;
  color: #cccccc;
  transition: color 0.3s ease;
}

.delete-btn-inner:hover .delete-icon {
  color: #ffffff;
}

/* 无数据提示 */
.no-data {
  text-align: center;
  padding: 80px 0;
  background: rgb(50, 50, 50);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  color: #ffffff;
}

/* 分页 */
.pagination-container {
  text-align: center;
  padding: 25px 0;
  background: rgb(50, 50, 50);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  color: #ffffff;
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
  background: rgb(34, 34, 34);
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
  background: rgba(34, 34, 34, 0.95);
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

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(50, 50, 50, 0.9);
  padding: 5px 10px;
  border-radius: 8px;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(80, 80, 80, 0.8);
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

.preview-heart-btn {
  color: white !important;
  font-size: 24px;
  font-weight: bold;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.preview-heart-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  transform: scale(1.1);
}

.preview-heart-btn.favorited {
  background: rgba(255, 255, 255, 0.1) !important;
}

.preview-heart-btn .favorite-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.preview-heart-btn.favorited .favorite-icon {
  color: #1890ff;
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
  background: rgba(50, 50, 50, 0.9) !important;
  border: 1px solid rgba(80, 80, 80, 0.8) !important;
  color: white !important;
  width: 50px !important;
  height: 50px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5) !important;
}

.preview-favorite-btn .preview-heart-btn:hover {
  background: rgba(70, 70, 70, 1) !important;
  transform: scale(1.1) !important;
  border-color: rgba(100, 100, 100, 1) !important;
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

.zoom-ratio {
  color: white;
  font-size: 14px;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

.nav-btn {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(50, 50, 50, 0.9) !important;
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
  border: 1px solid rgba(80, 80, 80, 0.8) !important;
  outline: none !important;
}

.nav-btn:hover {
  background: rgba(70, 70, 70, 1) !important;
  transform: translateY(-50%) scale(1.1);
  border-color: rgba(100, 100, 100, 1) !important;
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
  margin-top: 5px;
  font-size: 10px;
  color: #ccc;
  opacity: 0.8;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6);
}

.desktop-tip {
  display: block;
}

/* 覆盖 Ant Design 组件样式 */
:deep(.ant-progress-circle) {
  .ant-progress-text {
    color: #ffffff !important;
  }
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

:deep(.ant-pagination .ant-pagination-options-quick-jumper input) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #ffffff !important;
}

:deep(.ant-select-selector) {
  background-color: #2a2a2a !important;
  border-color: #434343 !important;
  color: #ffffff !important;
}

:deep(.ant-select-selection-item) {
  color: #ffffff !important;
}

:deep(.ant-empty-description) {
  color: #8c8c8c;
}

:deep(.ant-btn-primary) {
  background-color: #1890ff;
  border-color: #1890ff;
}

:deep(.ant-btn-primary:hover) {
  background-color: #40a9ff;
  border-color: #40a9ff;
}
</style>
