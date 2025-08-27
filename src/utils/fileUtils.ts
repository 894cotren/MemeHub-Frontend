/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 将文件大小转换为字节数
 * @param size 文件大小字符串 (如: "500 MB")
 * @returns 字节数
 */
export const parseFileSize = (size: string): number => {
  const units: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  }
  
  const match = size.match(/^([\d.]+)\s*([KMGT]?B)$/i)
  if (!match) return 0
  
  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  
  return value * (units[unit] || 1)
}

/**
 * 检查文件大小是否超过限制
 * @param fileSize 文件大小（字节）
 * @param maxSize 最大限制（字节）
 * @returns 是否超过限制
 */
export const isFileSizeExceeded = (fileSize: number, maxSize: number): boolean => {
  return fileSize > maxSize
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 文件扩展名（小写）
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * 检查是否为图片文件
 * @param filename 文件名
 * @returns 是否为图片文件
 */
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  const ext = getFileExtension(filename)
  return imageExtensions.includes(ext)
}
