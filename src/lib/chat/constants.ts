/**
 * Shared constants for the Internal Communication (chat) feature.
 * Import these in server actions, components, and validation schemas.
 */

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
]

export const MAX_ATTACHMENTS = 5

export const CHAT_BUCKET = 'chat-attachments'
