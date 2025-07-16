// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** deletePictureById POST /api/picture/deletePictureById */
export async function deletePictureByIdUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/picture/deletePictureById', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** userFavoritePicture POST /api/picture/favoritePicture */
export async function userFavoritePictureUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.userFavoritePictureUsingPOSTParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/picture/favoritePicture', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** getFavoritePicturePages POST /api/picture/getFavoritePicturePages */
export async function getFavoritePicturePagesUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getFavoritePicturePagesUsingPOSTParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePagePicturePagesVO_>('/api/picture/getFavoritePicturePages', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** getPictureByIdForAdmin GET /api/picture/getPictureByIdForAdmin */
export async function getPictureByIdForAdminUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPictureByIdForAdminUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePicture_>('/api/picture/getPictureByIdForAdmin', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** getPicturePages POST /api/picture/getPicturePages */
export async function getPicturePagesUsingPost(
  body: API.PicturePagesRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePagePicture_>('/api/picture/getPicturePages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** getPicturePagesVO POST /api/picture/getPicturePagesVO */
export async function getPicturePagesVoUsingPost(
  body: API.PictureVOPagesRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePagePicturePagesVO_>('/api/picture/getPicturePagesVO', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** getPictureVOById GET /api/picture/getPictureVOById */
export async function getPictureVoByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPictureVOByIdUsingGETParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePictureVO_>('/api/picture/getPictureVOById', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** getTagCategoryList GET /api/picture/getTagCategoryList */
export async function getTagCategoryListUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponsePictureTagCategoryVO_>('/api/picture/getTagCategoryList', {
    method: 'GET',
    ...(options || {}),
  })
}

/** doPictureReview POST /api/picture/pictureReview */
export async function doPictureReviewUsingPost(
  body: API.PictureReviewRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/picture/pictureReview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** userUnfavoritePicture POST /api/picture/unfavoritePicture */
export async function userUnfavoritePictureUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.userUnfavoritePictureUsingPOSTParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/picture/unfavoritePicture', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

/** updatePicture POST /api/picture/update */
export async function updatePictureUsingPost(
  body: API.PictureUpdateRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean_>('/api/picture/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

/** uploadPicture POST /api/picture/upload */
export async function uploadPictureUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.uploadPictureUsingPOSTParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData()

  if (file) {
    formData.append('file', file)
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele]

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''))
        } else {
          formData.append(ele, JSON.stringify(item))
        }
      } else {
        formData.append(ele, item)
      }
    }
  })

  return request<API.BaseResponsePictureVO_>('/api/picture/upload', {
    method: 'POST',
    params: {
      ...params,
    },
    data: formData,
    requestType: 'form',
    ...(options || {}),
  })
}
