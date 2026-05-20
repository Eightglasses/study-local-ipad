/**
 * 图片存储 - 简化版：图片直接上传到服务器，通过 API URL 访问
 * 不再需要 IndexedDB 或本地 Blob 操作
 */

export const IMAGE_BASE = '/api/images'

export function getImageUrl(path: string): string {
    return `${IMAGE_BASE}/${path}`
}
