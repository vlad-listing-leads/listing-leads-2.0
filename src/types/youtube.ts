// YouTube Video Types

// Video Category
export interface VideoCategory {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

// Video Creator (YouTube Channel)
export interface VideoCreator {
  id: string
  name: string
  channel_url: string | null
  channel_id: string | null
  image_url: string | null
  subscribers: number
  location: string | null
  created_at: string
  updated_at: string
}

// Psychological Trigger
export interface PsychologicalTrigger {
  id: string
  name: string
  slug: string
  emoji: string | null
  created_at: string
}

// Power Word
export interface PowerWord {
  id: string
  name: string
  slug: string
  created_at: string
}

// Video Hook
export interface VideoHook {
  id: string
  name: string
  hook_text: string | null
  video_id: string | null
  created_at: string
  updated_at: string
  // Joined data
  triggers?: PsychologicalTrigger[]
}

// Main YouTube Video
export interface YouTubeVideo {
  id: string
  name: string
  slug: string
  youtube_url: string
  youtube_id: string
  video_runtime: number
  score: number | null
  greater_sign: string | null
  hook_id: string | null
  creator_id: string | null
  category_id: string | null
  date_posted_yt: string | null
  cta: string | null
  ai_summary: string | null
  transcript: string | null
  thumbnail_url: string | null
  view_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined data
  creator?: VideoCreator
  category?: VideoCategory
  hook?: VideoHook
  triggers?: PsychologicalTrigger[]
  power_words?: PowerWord[]
}

// Supadata API Response Types
export interface SupadataVideoMetadata {
  id: string
  title: string
  description: string
  duration: number
  channel: {
    id: string
    name: string
  }
  tags: string[]
  thumbnail: string
  uploadDate: string
  viewCount: number
  likeCount: number
  transcriptLanguages: string[]
}

export interface SupadataTranscriptSegment {
  text: string
  offset: number
  duration: number
  lang: string
}

export interface SupadataTranscriptResponse {
  content: SupadataTranscriptSegment[]
  lang: string
}

// Extracted YouTube Data (combined response)
export interface ExtractedYouTubeData {
  youtube_id: string
  title: string
  description: string
  duration: number
  channel: {
    id: string
    name: string
  }
  thumbnail: string
  uploadDate: string
  viewCount: number
  transcript: string
}

// AI Generated Fields
export interface AIGeneratedFields {
  ai_summary: string
  suggested_hook: string
  suggested_cta: string
  suggested_triggers: string[]
  suggested_power_words: string[]
}

// Form Data for Creating/Editing Videos
export interface YouTubeVideoFormData {
  youtube_url: string
  name: string
  slug: string
  youtube_id: string
  video_runtime: number
  score?: number | null
  greater_sign?: string | null
  hook_text?: string | null
  creator_id?: string | null
  category_id?: string | null
  date_posted_yt?: string | null
  cta?: string | null
  ai_summary?: string | null
  transcript?: string | null
  thumbnail_url?: string | null
  view_count?: number
  is_active: boolean
  trigger_ids: string[]
  power_word_ids: string[]
  // For auto-creating creator
  new_creator?: {
    name: string
    channel_id: string
    channel_url: string
    image_url?: string
  }
  // For auto-creating category
  new_category?: {
    name: string
  }
}

// Insert types for database operations
export interface YouTubeVideoInsert {
  name: string
  slug: string
  youtube_url: string
  youtube_id: string
  video_runtime?: number
  score?: number | null
  greater_sign?: string | null
  hook_id?: string | null
  creator_id?: string | null
  category_id?: string | null
  date_posted_yt?: string | null
  cta?: string | null
  ai_summary?: string | null
  transcript?: string | null
  thumbnail_url?: string | null
  view_count?: number
  is_active?: boolean
}

export interface YouTubeVideoUpdate extends Partial<YouTubeVideoInsert> {
  id: string
}

export interface VideoCreatorInsert {
  name: string
  channel_url?: string | null
  channel_id?: string | null
  image_url?: string | null
  subscribers?: number
  location?: string | null
}

export interface VideoCategoryInsert {
  name: string
  slug: string
}

export interface PsychologicalTriggerInsert {
  name: string
  slug: string
  emoji?: string | null
}

export interface PowerWordInsert {
  name: string
  slug: string
}

export interface VideoHookInsert {
  name: string
  hook_text?: string | null
  video_id?: string | null
}

// List response with pagination
export interface YouTubeVideosListResponse {
  videos: YouTubeVideo[]
  total: number
  page: number
  pageSize: number
}

// Filter options for listing
export interface YouTubeVideoFilters {
  category_id?: string
  creator_id?: string
  is_active?: boolean
  search?: string
}
