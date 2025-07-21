declare namespace API {
  type BaseResponseBoolean_ = {
    code?: number
    data?: boolean
    message?: string
  }

  type BaseResponseLoginUserVO_ = {
    code?: number
    data?: LoginUserVO
    message?: string
  }

  type BaseResponseLong_ = {
    code?: number
    data?: number
    message?: string
  }

  type BaseResponsePagePicture_ = {
    code?: number
    data?: PagePicture_
    message?: string
  }

  type BaseResponsePagePicturePagesVO_ = {
    code?: number
    data?: PagePicturePagesVO_
    message?: string
  }

  type BaseResponsePageUserVO_ = {
    code?: number
    data?: PageUserVO_
    message?: string
  }

  type BaseResponsePicture_ = {
    code?: number
    data?: Picture
    message?: string
  }

  type BaseResponsePictureTagCategoryVO_ = {
    code?: number
    data?: PictureTagCategoryVO
    message?: string
  }

  type BaseResponsePictureVO_ = {
    code?: number
    data?: PictureVO
    message?: string
  }

  type BaseResponsePutObjectResult_ = {
    code?: number
    data?: PutObjectResult
    message?: string
  }

  type BaseResponseUserVO_ = {
    code?: number
    data?: UserVO
    message?: string
  }

  type CIObject = {
    codeStatus?: number
    etag?: string
    format?: string
    frameCount?: number
    height?: number
    key?: string
    location?: string
    qrcodeInfoList?: QRcodeInfo[]
    quality?: number
    size?: number
    watermarkStatus?: number
    width?: number
  }

  type CIUploadResult = {
    face?: FailedMessage
    faceDetailInfos?: FaceDetailInfos
    originalInfo?: OriginalInfo
    plate?: FailedMessage
    plateDetailInfos?: PlateDetailInfos
    processResults?: ProcessResults
    requestId?: string
  }

  type CodeLocation = {
    points?: string[]
  }

  type DeleteRequest = {
    id?: number
  }

  type FaceDetailInfos = {
    faceRectList?: FaceRect[]
  }

  type FaceRect = {
    height?: number
    width?: number
    x?: number
    y?: number
  }

  type FailedMessage = {
    errorCode?: string
    errorMsg?: string
    state?: string
  }

  type getFavoritePicturePagesUsingPOSTParams = {
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    userId?: number
  }

  type getPictureByIdForAdminUsingGETParams = {
    /** id */
    id: number
  }

  type getPictureVOByIdUsingGETParams = {
    /** id */
    id: number
  }

  type getUserVoByIdUsingGETParams = {
    /** id */
    id?: number
  }

  type ImageInfo = {
    ave?: string
    format?: string
    frameCount?: number
    height?: number
    orientation?: number
    quality?: number
    width?: number
  }

  type LoginUserVO = {
    createTime?: string
    favoriteCount?: number
    id?: number
    updateTime?: string
    userAccount?: string
    userAvatar?: string
    userEmail?: string
    userName?: string
    userProfile?: string
    userRole?: string
  }

  type ObjectMetadata = {
    cacheControl?: string
    ciUploadResult?: CIUploadResult
    contentDisposition?: string
    contentEncoding?: string
    contentLanguage?: string
    contentLength?: number
    contentMD5?: string
    contentType?: string
    crc64Ecma?: string
    deleteMarker?: boolean
    etag?: string
    expirationTime?: string
    expirationTimeRuleId?: string
    fileModeDir?: boolean
    httpExpiresDate?: string
    instanceLength?: number
    lastModified?: string
    ongoingRestore?: boolean
    rawMetadata?: Record<string, any>
    requestId?: string
    restoreExpirationTime?: string
    serverSideEncryption?: string
    ssealgorithm?: string
    ssecoskmsKeyId?: string
    ssecustomerAlgorithm?: string
    ssecustomerKeyMd5?: string
    storageClass?: string
    storageClassEnum?:
      | 'Standard'
      | 'Standard_IA'
      | 'Archive'
      | 'Deep_Archive'
      | 'Intelligent_Tiering'
      | 'Maz_Standard'
      | 'Maz_Standard_IA'
      | 'Maz_Archive'
      | 'Maz_Deep_Archive'
      | 'Maz_Intelligent_Tiering'
    userMetadata?: Record<string, any>
    versionId?: string
  }

  type OriginalInfo = {
    etag?: string
    imageInfo?: ImageInfo
    key?: string
    location?: string
  }

  type PagePicture_ = {
    current?: number
    pages?: number
    records?: Picture[]
    size?: number
    total?: number
  }

  type PagePicturePagesVO_ = {
    current?: number
    pages?: number
    records?: PicturePagesVO[]
    size?: number
    total?: number
  }

  type PageUserVO_ = {
    current?: number
    pages?: number
    records?: UserVO[]
    size?: number
    total?: number
  }

  type Picture = {
    category?: string
    createTime?: string
    id?: number
    introduction?: string
    isDelete?: number
    originUrl?: string
    picFormat?: string
    picHeight?: number
    picName?: string
    picScale?: number
    picSize?: number
    picUrl?: string
    picWidth?: number
    reviewMessage?: string
    reviewStatus?: number
    reviewTime?: string
    reviewerId?: number
    tags?: string
    updateTime?: string
    userId?: number
  }

  type PicturePagesRequest = {
    category?: string
    endTime?: string
    id?: number
    introduction?: string
    pageNum?: number
    pageSize?: number
    picName?: string
    picUrl?: string
    reviewMessage?: string
    reviewStatus?: number
    searchText?: string
    sortField?: string
    sortOrder?: string
    startTime?: string
    tags?: string[]
    userId?: number
  }

  type PicturePagesVO = {
    category?: string
    id?: number
    introduction?: string
    isFavorite?: boolean
    picName?: string
    picUrl?: string
    tags?: string[]
    userId?: number
    userName?: string
  }

  type PictureReviewRequest = {
    id?: number
    reviewMessage?: string
    reviewStatus?: number
  }

  type PictureTagCategoryVO = {
    categoryList?: string[]
    tagList?: string[]
  }

  type PictureUpdateRequest = {
    category?: string
    id?: number
    introduction?: string
    picName?: string
    picUrl?: string
    tags?: string[]
  }

  type PictureVO = {
    category?: string
    createTime?: string
    id?: number
    introduction?: string
    picFormat?: string
    picHeight?: number
    picName?: string
    picScale?: number
    picSize?: number
    picUrl?: string
    picWidth?: number
    reviewMessage?: string
    reviewStatus?: number
    reviewTime?: string
    reviewerId?: number
    tags?: string[]
    updateTime?: string
    uploadUser?: User
  }

  type PictureVOPagesRequest = {
    category?: string
    endTime?: string
    introduction?: string
    pageNum?: number
    pageSize?: number
    picName?: string
    searchText?: string
    sortField?: string
    sortOrder?: string
    startTime?: string
    tags?: string[]
    userId?: number
  }

  type PlateDetail = {
    bottomLeftX?: number
    bottomLeftY?: number
    bottomRightX?: number
    bottomRightY?: number
    upperLeftX?: number
    upperLeftY?: number
    upperRightX?: number
    upperRightY?: number
  }

  type PlateDetailInfos = {
    plateDetailInfos?: PlateDetail[]
  }

  type ProcessResults = {
    objectList?: CIObject[]
  }

  type PutObjectResult = {
    ciUploadResult?: CIUploadResult
    contentMd5?: string
    crc64Ecma?: string
    dateStr?: string
    etag?: string
    expirationTime?: string
    expirationTimeRuleId?: string
    metadata?: ObjectMetadata
    requestId?: string
    serverSideEncryption?: string
    ssealgorithm?: string
    ssecustomerAlgorithm?: string
    ssecustomerKeyMd5?: string
    versionId?: string
  }

  type QRcodeInfo = {
    codeLocation?: CodeLocation
    codeUrl?: string
  }

  type testDownloadFileUsingPOSTParams = {
    /** filePath */
    filePath?: string
  }

  type uploadPictureUsingPOSTParams = {
    id?: number
  }

  type User = {
    createTime?: string
    favoriteCount?: number
    favoriteLimit?: number
    id?: number
    isDelete?: number
    updateTime?: string
    userAccount?: string
    userAvatar?: string
    userEmail?: string
    userName?: string
    userPassword?: string
    userProfile?: string
    userRole?: string
  }

  type UserAddRequest = {
    userAccount?: string
    userName?: string
    userPassword?: string
    userProfile?: string
    userRole?: string
  }

  type userFavoritePictureUsingPOSTParams = {
    picId?: number
    userId?: number
  }

  type UserLoginRequest = {
    userAccount?: string
    userPassword?: string
  }

  type UserPageListRequest = {
    id?: number
    pageNum?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    userAccount?: string
    userEmail?: string
    userName?: string
    userProfile?: string
    userRole?: string
  }

  type UserRegisterRequest = {
    checkPassword?: string
    userAccount?: string
    userPassword?: string
  }

  type userUnfavoritePictureUsingPOSTParams = {
    picId?: number
    userId?: number
  }

  type UserUpdateRequest = {
    favoriteCount?: number
    id?: number
    userAccount?: string
    userAvatar?: string
    userEmail?: string
    userName?: string
    userProfile?: string
    userRole?: string
  }

  type UserVO = {
    createTime?: string
    favoriteCount?: number
    favoriteLimit?: number
    id?: number
    userAccount?: string
    userAvatar?: string
    userEmail?: string
    userName?: string
    userProfile?: string
    userRole?: string
  }
}
