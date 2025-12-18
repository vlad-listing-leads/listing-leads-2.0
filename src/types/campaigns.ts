// Campaign Categories
export type CampaignCategory =
  | 'phone-text-scripts'
  | 'email-campaigns'
  | 'direct-mail'
  | 'social-shareables'

export const categoryConfig: Record<CampaignCategory, { label: string; color: string; darkColor: string }> = {
  'phone-text-scripts': {
    label: 'Phone & Text Scripts',
    color: 'bg-green-100 text-green-700',
    darkColor: 'dark:bg-green-900/30 dark:text-green-300'
  },
  'email-campaigns': {
    label: 'Email Campaigns',
    color: 'bg-blue-100 text-blue-700',
    darkColor: 'dark:bg-blue-900/30 dark:text-blue-300'
  },
  'direct-mail': {
    label: 'Direct Mail Templates',
    color: 'bg-orange-100 text-orange-700',
    darkColor: 'dark:bg-orange-900/30 dark:text-orange-300'
  },
  'social-shareables': {
    label: 'Social Shareables',
    color: 'bg-purple-100 text-purple-700',
    darkColor: 'dark:bg-purple-900/30 dark:text-purple-300'
  },
}

// Base campaign interface with common fields
export interface BaseCampaign {
  id: string
  name: string
  slug: string
  introduction: string | null
  thumbnail_url: string | null
  region: string
  is_featured: boolean
  is_active: boolean
  display_order: number
  week_start_date: string | null
  day_of_week: number | null
  created_at: string
  updated_at: string
  // Added by API
  category?: CampaignCategory
  isFavorite?: boolean
}

// Phone & Text Scripts
export interface PhoneTextScript extends BaseCampaign {
  category: 'phone-text-scripts'
  script_type: 'call' | 'text' | 'both'
  target_audience: string | null
  text_message_1: string | null
  text_message_2: string | null
  text_message_3: string | null
  call_script_pdf_url: string | null
  call_script_content: string | null
  example_image_url: string | null
  full_script_image_url: string | null
  execution_steps: Record<string, unknown> | null
}

// Email Campaigns
export interface EmailCampaign extends BaseCampaign {
  category: 'email-campaigns'
  subject_line: string
  email_body: string
  preview_text: string | null
  target_audience: string | null
  tags: string[]
  recommended_audience: string | null
  example_image_url: string | null
  full_email_image_url: string | null
  execution_steps: Record<string, unknown> | null
}

// Direct Mail Templates
export interface DirectMailTemplate extends BaseCampaign {
  category: 'direct-mail'
  mail_type: 'postcard' | 'letter' | 'flyer'
  canva_template_url: string | null
  editor_url: string | null
  target_audience: string | null
  channel: string
  example_image_url: string | null
  example_images: string[]
  execution_steps: Record<string, unknown> | null
}

// Social Shareables
export interface SocialShareable extends BaseCampaign {
  category: 'social-shareables'
  is_video: boolean
  content_type: 'static_image' | 'reel' | 'carousel' | 'video'
  canva_template_url: string | null
  video_flow_pdf_title: string | null
  video_flow_pdf_url: string | null
  audio_transcription_url: string | null
  video_script: string | null
  video_title: string | null
  video_description: string | null
  hashtags: string[]
  example_image_url: string | null
  example_images: string[]
  execution_steps: Record<string, unknown> | null
}

// Union type for any campaign
export type Campaign = PhoneTextScript | EmailCampaign | DirectMailTemplate | SocialShareable

// Simplified type for backwards compatibility and card display
export interface CampaignCard {
  id: string
  name: string
  slug: string
  introduction: string | null
  thumbnail_url: string | null
  category: CampaignCategory
  is_featured: boolean
  region: string
  week_start_date: string | null
  day_of_week: number | null
  isFavorite?: boolean
  // Legacy fields for compatibility
  title?: string
  description?: string | null
  // Optional fields for modal display
  html_content?: string | null
  content_url?: string | null
}

// Week data for calendar view
export interface WeekData {
  weekStart: string
  isCurrentWeek: boolean
  campaigns: CampaignCard[]
}

// API response types
export interface WeeklyCampaignsResponse {
  weeks: WeekData[]
}

// Favorites
export interface CampaignFavorite {
  id: string
  user_id: string
  category: CampaignCategory
  item_id: string
  created_at: string
}

// Legacy type for backwards compatibility
export interface UserFavorite {
  id: string
  campaign_id: string
  category: CampaignCategory
  created_at: string
}

// Calendar week for 52-week calendar view
export interface CalendarWeek {
  id: string
  week_start_date: string
  year: number
  week_number: number
  is_available: boolean
  theme: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Computed counts per category
  campaign_counts?: {
    'email-campaigns': number
    'phone-text-scripts': number
    'social-shareables': number
    'direct-mail': number
  }
}

// Campaign assignment to a calendar week
export interface CampaignWeekAssignment {
  id: string
  week_id: string
  campaign_id: string
  category: CampaignCategory
  day_of_week: number
  display_order: number
  created_at: string
  // Joined campaign data
  campaign?: CampaignCard
}

// ImageKit folder mapping for campaign categories
export const categoryImageKitFolders: Record<CampaignCategory, string> = {
  'email-campaigns': 'campaigns/Email',
  'phone-text-scripts': 'campaigns/Text & Voice',
  'social-shareables': 'campaigns/Social Shareables',
  'direct-mail': 'campaigns/Direct Mail',
}
