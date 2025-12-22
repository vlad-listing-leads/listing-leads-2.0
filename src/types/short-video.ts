import { PsychologicalTrigger, PowerWord } from './youtube'

export type Platform = 'instagram' | 'tiktok'

export interface ShortVideoCategory {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface ShortVideoCreator {
  id: string
  name: string
  slug: string
  platform: Platform
  handle: string
  profile_url: string | null
  avatar_url: string | null
  location: string | null
  created_at: string
}

export interface ShortVideo {
  id: string
  name: string
  slug: string
  platform: Platform
  source_url: string
  source_id: string | null
  video_url: string | null
  cover_url: string | null
  video_runtime: number | null
  description: string | null
  creator_id: string | null
  category_id: string | null
  date_posted: string | null
  transcript: string | null
  ai_summary: string | null
  hook_text: string | null
  cta: string | null
  embed_code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined data
  creator?: ShortVideoCreator | null
  category?: ShortVideoCategory | null
  triggers?: PsychologicalTrigger[]
  power_words?: PowerWord[]
}

// Form data for creating/updating videos
export interface ShortVideoFormData {
  name: string
  slug: string
  platform: Platform
  source_url: string
  source_id?: string
  video_url?: string
  cover_url?: string
  video_runtime?: number
  description?: string
  creator_id?: string
  category_id?: string
  date_posted?: string
  transcript?: string
  ai_summary?: string
  hook_text?: string
  cta?: string
  embed_code?: string
  is_active: boolean
  trigger_ids?: string[]
  power_word_ids?: string[]
}

// Database insert type
export interface ShortVideoInsert {
  name: string
  slug: string
  platform: Platform
  source_url: string
  source_id?: string | null
  video_url?: string | null
  cover_url?: string | null
  video_runtime?: number | null
  description?: string | null
  creator_id?: string | null
  category_id?: string | null
  date_posted?: string | null
  transcript?: string | null
  ai_summary?: string | null
  hook_text?: string | null
  cta?: string | null
  embed_code?: string | null
  is_active?: boolean
}

// Database update type
export interface ShortVideoUpdate extends Partial<ShortVideoInsert> {
  id: string
}

// Extracted data from Instagram/TikTok
export interface ExtractedShortVideoData {
  platform: Platform
  source_id: string
  title: string
  description: string | null
  duration: number | null
  video_url: string // ImageKit URL after upload
  cover_url: string // ImageKit URL after upload
  transcript: string | null
  creator: {
    handle: string
    name: string
    avatar_url?: string
  } | null
  date_posted: string | null
}

// AI generated fields
export interface ShortVideoAIFields {
  ai_summary: string
  suggested_hook: string
  suggested_cta: string
  suggested_triggers: string[]
  suggested_power_words: string[]
  suggested_category?: string
}

// API response types
export interface ShortVideosListResponse {
  videos: ShortVideo[]
  total: number
  page: number
  pageSize: number
}

export interface ShortVideoCreatorInsert {
  name: string
  slug: string
  platform: Platform
  handle: string
  profile_url?: string | null
  avatar_url?: string | null
  location?: string | null
}

export interface ShortVideoCategoryInsert {
  name: string
  slug: string
}
