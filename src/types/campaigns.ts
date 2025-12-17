export type CampaignCategory =
  | 'social-shareables'
  | 'email-campaigns'
  | 'phone-text-scripts'
  | 'direct-mail'

export interface Campaign {
  id: string
  title: string
  description: string | null
  category: CampaignCategory
  thumbnail_url: string | null
  content_url: string | null
  html_content: string | null
  week_start_date: string
  day_of_week: number
  region: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  isFavorite?: boolean
}

export interface WeekData {
  weekStart: string
  isCurrentWeek: boolean
  campaigns: Campaign[]
}

export interface UserFavorite {
  id: string
  campaign_id: string
  created_at: string
  weekly_campaigns?: Campaign
}

export const categoryConfig: Record<CampaignCategory, { label: string; color: string; darkColor: string }> = {
  'social-shareables': {
    label: 'Social Shareables',
    color: 'bg-purple-100 text-purple-700',
    darkColor: 'dark:bg-purple-900/30 dark:text-purple-300'
  },
  'email-campaigns': {
    label: 'Email Campaigns',
    color: 'bg-blue-100 text-blue-700',
    darkColor: 'dark:bg-blue-900/30 dark:text-blue-300'
  },
  'phone-text-scripts': {
    label: 'Phone & Text Scripts',
    color: 'bg-green-100 text-green-700',
    darkColor: 'dark:bg-green-900/30 dark:text-green-300'
  },
  'direct-mail': {
    label: 'Direct Mail Templates',
    color: 'bg-orange-100 text-orange-700',
    darkColor: 'dark:bg-orange-900/30 dark:text-orange-300'
  },
}
