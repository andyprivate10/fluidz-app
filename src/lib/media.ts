import imageCompression from 'browser-image-compression'

/**
 * Compress an image file before upload
 * Target: max 1200px, quality 0.8, ~200KB output
 */
export async function compressImage(file: File): Promise<File> {
  // Skip if already small enough (<300KB)
  if (file.size < 300 * 1024) return file

  const options = {
    maxSizeMB: 0.3, // 300KB max
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.8,
  }

  try {
    const compressed = await imageCompression(file, options)
    return compressed
  } catch (err) {
    console.warn('[media] Compression failed, using original:', err)
    return file
  }
}

/**
 * Generate a thumbnail URL from Supabase Storage
 * Uses Supabase Image Transformations
 */
export function thumbnailUrl(url: string, width = 200, height = 200): string {
  if (!url) return ''
  // Supabase storage transform: add ?width=X&height=Y
  if (url.includes('supabase.co/storage/')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}width=${width}&height=${height}&resize=cover`
  }
  return url
}

/**
 * Check if a file is a video
 */
export function isVideo(file: File): boolean {
  return file.type.startsWith('video/')
}

/**
 * Generate a unique filename for upload
 */
export function uploadFilename(userId: string, file: File, prefix = ''): string {
  const ext = file.name.split('.').pop() || (isVideo(file) ? 'mp4' : 'jpg')
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 6)
  return `${userId}/${prefix}${ts}-${rand}.${ext}`
}
