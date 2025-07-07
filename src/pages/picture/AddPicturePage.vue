<template>
  <div id="addPicture">
    <!-- 标题   -->
    <h2 style="margin-bottom: 16px">
      {{ route.query?.id ? '修改图片' : '创建图片' }}
    </h2>
    <!--    图片上传-->
    <PictureUpload :picture="picture" :on-success="onSuccess" />
    <!-- 图片修改表单 -->
    <a-form v-if="picture" layout="vertical" :model="pictureForm" @finish="handleSubmit">
      <a-form-item label="名称" name="picName">
        <a-input v-model:value="pictureForm.picName" placeholder="请输入图片名称" />
      </a-form-item>
      <a-form-item label="简介" name="introduction">
        <a-textarea
          v-model:value="pictureForm.introduction"
          placeholder="请输入图片简介"
          :rows="2"
          :autoSize="{ minRows: 2, maxRows: 6 }"
          allowClear
        />
      </a-form-item>
      <a-form-item label="分类" name="category">
        <a-auto-complete
          v-model:value="pictureForm.category"
          placeholder="请输入图片分类"
          allowClear
          :options="categoryOptions"
        />
      </a-form-item>
      <a-form-item label="标签" name="tags">
        <a-select
          v-model:value="pictureForm.tags"
          mode="tags"
          placeholder="请输入图片标签"
          allowClear
          :options="tagOptions"
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">创建</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import PictureUpload from '@/components/PictureUpload.vue'
import { onMounted, reactive, ref } from 'vue'
import {
  getPictureVoByIdUsingGet,
  getTagCategoryListUsingGet,
  updatePictureUsingPost,
} from '@/api/pictureController'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'

const picture = ref<API.PictureVO>()
const pictureForm = reactive<API.PictureUpdateRequest>({})

const router = useRouter()

/**
 * 提交表单
 * @param values
 */
const handleSubmit = async (values: any) => {
  //必须要有图片ID不然更新谁呢
  const pictureId = picture.value.id
  if (!pictureId) {
    return
  }
  const res = await updatePictureUsingPost({
    id: pictureId,
    ...values,
  })
  if (res.data.code === 20000 && res.data.data) {
    message.success('创建成功')
    // 跳转到图片详情页 TODO 图片详情页还没开发
    router.push({
      path: `/picture/${pictureId}`,
    })
  } else {
    message.error('创建失败，' + res.data.message)
  }
}
/**
 * 图片上传成功回调函数。 （由upload组件PictureUpload调过来的）
 * @param newPicture
 */
const onSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
  pictureForm.picName = newPicture.picName
}

const categoryOptions = ref<string[]>([])
const tagOptions = ref<string[]>([])

// 获取标签和分类选项
const getTagCategoryOptions = async () => {
  const res = await getTagCategoryListUsingGet()
  if (res.data.code === 20000 && res.data.data) {
    // 转换成下拉选项组件接受的格式
    tagOptions.value = (res.data.data.tagList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })
    categoryOptions.value = (res.data.data.categoryList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })
  } else {
    message.error('加载选项失败，' + res.data.message)
  }
}

onMounted(() => {
  getTagCategoryOptions()
})

//为了使这个页面变得更通用，不止创建图片，还可以更新图片。  在它路径后面可以跟？id=xxxxxx去更新图片的
const route = useRoute()

//获取老数据
const getOldPicture = async () => {
  const id = route.query?.id
  //如果id有 ，那么查找并映射到表单里
  if (id) {
    const res = await getPictureVoByIdUsingGet({ id })
    if (res.data.code === 20000 && res.data.data) {
      const data = res.data.data
      picture.value = data
      pictureForm.picName = data.picName
      pictureForm.introduction = data.introduction
      pictureForm.tags = data.tags
      pictureForm.category = data.category
    }
  }
}

onMounted(() => {
  getOldPicture()
})
</script>

<style scoped>
#addPicture {
}
</style>
