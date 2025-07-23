<template>
  <div id="batchUploadPicture" class="dark-theme">
    <!-- 标题 -->
    <h2 style="margin-bottom: 16px; text-align: center; color: #ffffff;">
      批量上传图片
    </h2>

    <!-- 批量上传表单 -->
    <a-form layout="vertical" :model="batchForm" @finish="handleBatchUpload">
      <!-- 文件上传区域 -->
      <a-form-item label="选择图片文件" name="files">
        <a-upload
          v-model:file-list="fileList"
          list-type="picture-card"
          :multiple="true"
          :before-upload="beforeUpload"
          :max-count="50"
          accept="image/*"
          @change="handleFileChange"
        >
          <div v-if="fileList.length < 50">
            <plus-outlined />
            <div class="ant-upload-text">点击或拖拽上传图片</div>
            <div class="ant-upload-hint">最多可上传50张图片</div>
          </div>
        </a-upload>
      </a-form-item>

      <!-- 批量配置区域 -->
      <a-card title="批量配置" style="margin-bottom: 16px;">
        <a-form-item label="默认图片名称前缀" name="defaultPicNamePrefix">
          <a-input 
            v-model:value="batchForm.defaultPicNamePrefix" 
            placeholder="请输入默认图片名称前缀（可选）"
            allowClear
          />
        </a-form-item>

        <a-form-item label="默认简介" name="defaultIntroduction">
          <a-textarea
            v-model:value="batchForm.defaultIntroduction"
            placeholder="请输入默认图片简介（可选）"
            :rows="2"
            :autoSize="{ minRows: 2, maxRows: 4 }"
            allowClear
          />
        </a-form-item>

        <a-form-item label="默认分类" name="defaultCategory">
          <a-auto-complete
            v-model:value="batchForm.defaultCategory"
            placeholder="请输入默认图片分类（可选）"
            allowClear
            :options="categoryOptions"
          />
        </a-form-item>

        <a-form-item label="默认标签" name="defaultTags">
          <a-select
            v-model:value="batchForm.defaultTags"
            mode="tags"
            placeholder="请输入默认图片标签（可选）"
            allowClear
            :options="tagOptions"
          />
        </a-form-item>
      </a-card>

      <!-- 提交按钮 -->
      <a-form-item>
        <a-button 
          type="primary" 
          html-type="submit" 
          style="width: 100%" 
          :loading="uploading"
          :disabled="fileList.length === 0"
        >
          {{ uploading ? '上传中...' : '开始批量上传' }}
        </a-button>
      </a-form-item>
    </a-form>

    <!-- 上传结果展示 -->
    <a-card v-if="uploadResult && uploadResult.failedCount > 0" title="上传结果" style="margin-top: 16px;">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="总数量">{{ uploadResult.totalCount }}</a-descriptions-item>
        <a-descriptions-item label="失败数量">
          <span style="color: #ff4d4f;">{{ uploadResult.failedCount }}</span>
        </a-descriptions-item>
      </a-descriptions>

      <!-- 失败列表 -->
      <div v-if="uploadResult.failedList && uploadResult.failedList.length > 0" style="margin-top: 16px;">
        <h4 style="color: #ff4d4f;">上传失败的图片：</h4>
        <a-list :data-source="uploadResult.failedList" size="small">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>{{ item.fileName }}</template>
                <template #description>
                  <span style="color: #ff4d4f;">失败原因: {{ item.reason }}</span>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </a-card>

    <!-- 成功提示 -->
    <a-card v-if="uploadResult && uploadResult.failedCount === 0" title="上传结果" style="margin-top: 16px;">
      <a-result
        status="success"
        title="批量上传成功"
        :sub-title="`共上传 ${uploadResult.totalCount} 张图片`"
      />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { UploadChangeParam, UploadProps, UploadFile } from 'ant-design-vue'
import { batchUploadPictureUsingPost, getTagCategoryListUsingGet } from '@/api/pictureController'
import { useRouter } from 'vue-router'

const router = useRouter()
const uploading = ref<boolean>(false)
const fileList = ref<UploadFile[]>([])
const uploadResult = ref<API.BatchPictureUploadVO>()

const batchForm = reactive({
  defaultPicNamePrefix: '',
  defaultIntroduction: '',
  defaultCategory: '',
  defaultTags: [] as string[],
})

const categoryOptions = ref<{ value: string; label: string }[]>([])
const tagOptions = ref<{ value: string; label: string }[]>([])

/**
 * 文件上传前的校验
 */
const beforeUpload = (file: UploadProps['fileList'][number]) => {
  // 判断图片格式
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('不支持该格式的上传图片，请使用jpg或png格式！')
    return false
  }
  // 判断图片大小
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    message.error('图片大小不能超过 5MB!')
    return false
  }
  return false // 阻止自动上传，我们手动处理
}

/**
 * 文件列表变化处理
 */
const handleFileChange = (info: UploadChangeParam) => {
  fileList.value = info.fileList || []
}

/**
 * 批量上传处理
 */
const handleBatchUpload = async () => {
  if (!fileList.value || fileList.value.length === 0) {
    message.error('请选择要上传的图片')
    return
  }

  uploading.value = true
  try {
    // 准备批量上传的数据
    const files = fileList.value
      .map(item => item.originFileObj)
      .filter((file): file is File => file !== undefined)
    
    const failedList: any[] = []
    let successCount = 0
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file) continue
      
      try {
        const res = await batchUploadPictureUsingPost(file)
        if (res.data.code === 20000 && res.data.data) {
          successCount++
        } else {
          failedList.push({
            fileName: file.name,
            reason: res.data.message || '上传失败'
          })
        }
      } catch (error: any) {
        failedList.push({
          fileName: file.name,
          reason: error.message || '上传失败'
        })
      }
    }

    // 设置结果
    uploadResult.value = {
      failedList,
      totalCount: files.length,
      failedCount: failedList.length
    }

    const successCountFinal = files.length - failedList.length
    message.success(`批量上传完成！成功: ${successCountFinal}，失败: ${failedList.length}`)
    
    // 清空文件列表
    fileList.value = []
  } catch (error: any) {
    console.error('批量上传失败:', error)
    message.error('批量上传失败: ' + (error.message || '未知错误'))
  } finally {
    uploading.value = false
  }
}

/**
 * 获取标签和分类选项
 */
const getTagCategoryOptions = async () => {
  try {
    const res = await getTagCategoryListUsingGet()
    if (res.data.code === 20000 && res.data.data) {
      tagOptions.value = (res.data.data.tagList ?? []).map((data: string) => ({
        value: data,
        label: data,
      }))
      categoryOptions.value = (res.data.data.categoryList ?? []).map((data: string) => ({
        value: data,
        label: data,
      }))
    } else {
      message.error('加载选项失败，' + res.data.message)
    }
  } catch (error) {
    console.error('获取标签分类失败:', error)
  }
}

onMounted(() => {
  getTagCategoryOptions()
})
</script>

<style scoped>
.dark-theme {
  background: rgb(34, 34, 34);
  min-height: 100vh;
  padding: 20px;
  color: #ffffff;
  max-width: 1000px;
  margin: 0 auto;
}

/* 覆盖 Ant Design 组件样式 */
:deep(.ant-form) {
  background: transparent;
}

:deep(.ant-input) {
  background: rgb(50, 50, 50) !important;
  border: 1px solid rgb(60, 60, 60) !important;
  color: #ffffff !important;
}

:deep(.ant-input:hover) {
  border: 1px solid rgb(80, 80, 80) !important;
}

:deep(.ant-input:focus) {
  border: 1px solid #40a9ff !important;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2) !important;
}

:deep(.ant-input::placeholder) {
  color: #999999 !important;
}

:deep(.ant-input-affix-wrapper) {
  background: rgb(50, 50, 50) !important;
  border: 1px solid rgb(60, 60, 60) !important;
  color: #ffffff !important;
}

:deep(.ant-input-affix-wrapper:hover) {
  border: 1px solid rgb(80, 80, 80) !important;
}

:deep(.ant-input-affix-wrapper:focus-within) {
  border: 1px solid #40a9ff !important;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2) !important;
}

:deep(.ant-input-affix-wrapper .ant-input) {
  background: transparent !important;
  border: none !important;
  color: #ffffff !important;
}

:deep(.ant-input-affix-wrapper .ant-input:focus) {
  border: none !important;
  box-shadow: none !important;
}

:deep(.ant-textarea) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #ffffff !important;
}

:deep(.ant-textarea:hover) {
  border-color: rgb(80, 80, 80) !important;
}

:deep(.ant-textarea:focus) {
  border-color: #40a9ff !important;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2) !important;
}

:deep(.ant-btn-primary) {
  background: #40a9ff !important;
  border-color: #40a9ff !important;
  font-size: 16px !important;
  height: 40px !important;
}

:deep(.ant-btn-primary:hover) {
  background: #69c0ff !important;
  border-color: #69c0ff !important;
}

:deep(.ant-select) {
  color: #ffffff !important;
}

:deep(.ant-select-selector) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #ffffff !important;
}

:deep(.ant-select-arrow) {
  color: #ffffff !important;
}

:deep(.ant-select-dropdown) {
  background: rgb(50, 50, 50) !important;
}

:deep(.ant-select-item) {
  color: #ffffff !important;
}

:deep(.ant-select-item-option-selected) {
  background: rgba(64, 169, 255, 0.2) !important;
  color: #69c0ff !important;
}

:deep(.ant-auto-complete) {
  color: #ffffff !important;
}

:deep(.ant-auto-complete .ant-select-selector) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
  color: #ffffff !important;
}

:deep(.ant-form-item-label > label) {
  color: #ffffff !important;
  font-weight: 500 !important;
}

:deep(.ant-upload) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
}

:deep(.ant-upload:hover) {
  border-color: #40a9ff !important;
}

:deep(.ant-upload-text) {
  color: #cccccc !important;
}

:deep(.ant-upload-hint) {
  color: #999999 !important;
}

:deep(.ant-card) {
  background: rgb(50, 50, 50) !important;
  border-color: rgb(60, 60, 60) !important;
}

:deep(.ant-card-head) {
  background: rgb(50, 50, 50) !important;
  border-bottom-color: rgb(60, 60, 60) !important;
}

:deep(.ant-card-head-title) {
  color: #ffffff !important;
}

:deep(.ant-descriptions) {
  color: #ffffff !important;
}

:deep(.ant-descriptions-item-label) {
  color: #cccccc !important;
  background: rgb(60, 60, 60) !important;
}

:deep(.ant-descriptions-item-content) {
  color: #ffffff !important;
  background: rgb(50, 50, 50) !important;
}

:deep(.ant-list) {
  background: transparent !important;
}

:deep(.ant-list-item) {
  border-color: rgb(60, 60, 60) !important;
}

:deep(.ant-list-item-meta-title) {
  color: #ffffff !important;
}

:deep(.ant-list-item-meta-description) {
  color: #cccccc !important;
}
</style>

