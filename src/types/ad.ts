export type AdChannel = 'meta' | 'google'

export interface AdCompany {
  id: string
  name: string
  slug: string
  icon_url: string | null
  created_at: string
}

export interface AdTag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Ad {
  id: string
  name: string
  slug: string
  channel: AdChannel
  image_url: string | null
  company_id: string | null
  rating: number
  rating_count: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined relations
  company?: AdCompany
  tags?: AdTag[]
}

export interface AdInsert {
  name: string
  slug: string
  channel?: AdChannel
  image_url?: string | null
  company_id?: string | null
  rating?: number
  rating_count?: number
  description?: string | null
  is_active?: boolean
}

export interface AdUpdate {
  name?: string
  slug?: string
  channel?: AdChannel
  image_url?: string | null
  company_id?: string | null
  rating?: number
  rating_count?: number
  description?: string | null
  is_active?: boolean
  updated_at?: string
}

export interface AdCompanyInsert {
  name: string
  slug: string
  icon_url?: string | null
}

export interface AdTagInsert {
  name: string
  slug: string
}
