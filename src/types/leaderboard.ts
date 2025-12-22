import { ShortVideo, ShortVideoCreator } from './short-video'
import { YouTubeVideo, VideoCreator } from './youtube'

// Leaderboard tab types
export type LeaderboardType = 'monthly' | 'staff_picks'

// Engagement metrics stored as JSON
export interface EngagementMetrics {
  views: number
  likes: number
  comments: number
  shares?: number
}

// Leaderboard entry from database
export interface LeaderboardEntry {
  id: string
  short_video_id: string | null
  youtube_video_id: string | null
  leaderboard_type: LeaderboardType
  month_year: string | null // '2025-01' for monthly, null for staff_picks
  display_order: number
  cached_engagement: EngagementMetrics
  metrics_updated_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined data
  short_video?: ShortVideo | null
  youtube_video?: YouTubeVideo | null
}

// Entry with computed fields for display
export interface LeaderboardEntryDisplay extends LeaderboardEntry {
  // Computed fields for easier access
  video_type: 'instagram' | 'youtube'
  title: string
  thumbnail_url: string | null
  creator_name: string | null
  creator_avatar: string | null
  creator_handle: string | null
  creator_location: string | null
  source_url: string | null
  date_posted: string | null
}

// Insert type for creating entries
export interface LeaderboardEntryInsert {
  short_video_id?: string | null
  youtube_video_id?: string | null
  leaderboard_type: LeaderboardType
  month_year?: string | null
  display_order?: number
  is_active?: boolean
}

// Update type
export interface LeaderboardEntryUpdate {
  id: string
  display_order?: number
  cached_engagement?: EngagementMetrics
  metrics_updated_at?: string
  is_active?: boolean
}

// Featured creator from database
export interface FeaturedCreator {
  id: string
  short_video_creator_id: string | null
  video_creator_id: string | null
  display_order: number
  is_active: boolean
  created_at: string
  // Joined data
  short_video_creator?: ShortVideoCreator | null
  video_creator?: VideoCreator | null
}

// Featured creator with computed fields for display
export interface FeaturedCreatorDisplay extends FeaturedCreator {
  // Computed fields for easier access
  creator_type: 'instagram' | 'youtube'
  name: string
  avatar_url: string | null
  location: string | null
  handle: string | null
}

// Insert type for featured creators
export interface FeaturedCreatorInsert {
  short_video_creator_id?: string | null
  video_creator_id?: string | null
  display_order?: number
  is_active?: boolean
}

// API response types
export interface LeaderboardResponse {
  entries: LeaderboardEntryDisplay[]
  total: number
}

export interface FeaturedCreatorsResponse {
  creators: FeaturedCreatorDisplay[]
}

// Filters for fetching leaderboard
export interface LeaderboardFilters {
  leaderboard_type: LeaderboardType
  month_year?: string // For monthly tab, e.g., '2025-01'
  is_active?: boolean
}

// Reorder request body
export interface ReorderRequest {
  entry_ids: string[]
}

// Video search result for adding to leaderboard
export interface VideoSearchResult {
  id: string
  type: 'instagram' | 'youtube'
  title: string
  thumbnail_url: string | null
  creator_name: string | null
  platform: string
  source_url: string | null
  already_in_leaderboard: boolean
}

// Creator search result for featuring
export interface CreatorSearchResult {
  id: string
  type: 'instagram' | 'youtube'
  name: string
  avatar_url: string | null
  handle: string | null
  location: string | null
  already_featured: boolean
}
