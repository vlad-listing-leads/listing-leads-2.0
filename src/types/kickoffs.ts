// Kickoff host (can be host or guest)
export interface KickoffHost {
  id: string
  name: string
  slug: string
  avatar_url: string | null
  created_at: string
}

// Host assignment with role
export interface KickoffHostAssignment {
  kickoff_id: string
  host_id: string
  role: 'host' | 'guest'
  host?: KickoffHost
}

// Campaign kickoff
export interface CampaignKickoff {
  id: string
  name: string
  slug: string
  overview: string | null
  start_date: string | null
  end_date: string | null
  month: string | null
  campaign_week_name: string | null
  social_campaign_slug: string | null
  text_campaign_slug: string | null
  email_campaign_slug: string | null
  video_url: string | null
  cta_url: string | null
  resources: string[] | null
  is_active: boolean
  is_draft: boolean
  created_at: string
  updated_at: string
}

// Kickoff with hosts and guests populated
export interface CampaignKickoffWithHosts extends CampaignKickoff {
  hosts: KickoffHost[]
  guests: KickoffHost[]
}

// Kickoff with linked campaign details
export interface CampaignKickoffFull extends CampaignKickoffWithHosts {
  social_campaign?: {
    id: string
    name: string
    slug: string
    thumbnail_url: string | null
  } | null
  text_campaign?: {
    id: string
    name: string
    slug: string
    thumbnail_url: string | null
  } | null
  email_campaign?: {
    id: string
    name: string
    slug: string
    thumbnail_url: string | null
  } | null
}
