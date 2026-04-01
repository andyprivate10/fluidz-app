/**
 * Strip all HTML tags from a string.
 * Use on user-generated text (display_name, bio, messages, notes) before rendering.
 */
export function stripHtml(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(/<[^>]*>/g, '')
}

/** Accepted media MIME types */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ACCEPTED_VIDEO_TYPES = ['video/mp4']
export const ACCEPTED_MEDIA_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES]

/** Max file sizes in bytes */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10 MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024  // 50 MB

/**
 * Validate a media file for upload.
 * Returns null if valid, or an i18n error key if invalid.
 */
export function validateMediaFile(file: File): string | null {
  const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type)
  const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type)

  if (!isImage && !isVideo) {
    return 'media.invalid_type'
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return 'media.image_too_large'
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return 'media.video_too_large'
  }

  return null
}
