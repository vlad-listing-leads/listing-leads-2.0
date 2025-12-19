export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'user' | 'admin'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          memberstack_id: string | null
          role: UserRole
          region: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          memberstack_id?: string | null
          role?: UserRole
          region?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          memberstack_id?: string | null
          role?: UserRole
          region?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
    }
  }
}

// Profile types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// System prompt type
export interface SystemPrompt {
  id: string
  name: string
  description: string | null
  prompt_content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// DEPRECATED TYPES - These are for the old templates/customizations feature
// that has been removed. Keeping temporarily for backwards compatibility.
// TODO: Remove these types and their usages in a future cleanup.
// ============================================================================

/** @deprecated Templates feature has been removed */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'image'
  | 'color'
  | 'url'
  | 'email'
  | 'phone'

/** @deprecated Templates feature has been removed */
export type CustomizationStatus = 'draft' | 'published'

/** @deprecated Templates feature has been removed */
export interface Template {
  id: string
  name: string
  description: string | null
  html_content: string
  thumbnail_url: string | null
  is_active: boolean
  size: string | null
  campaign_id: string | null
  system_prompt_id: string | null
  template_prompt: string | null
  artifact_url: string | null
  created_at: string
  updated_at: string
}

/** @deprecated Templates feature has been removed */
export type TemplateInsert = Partial<Template> & { name: string; html_content: string }

/** @deprecated Templates feature has been removed */
export type TemplateUpdate = Partial<Template>

/** @deprecated Templates feature has been removed */
export interface TemplateField {
  id: string
  template_id: string
  field_key: string
  field_type: FieldType
  label: string
  placeholder: string | null
  default_value: string | null
  options: Json | null
  is_required: boolean
  display_order: number
  created_at: string
  updated_at: string
}

/** @deprecated Templates feature has been removed */
export type TemplateFieldInsert = Partial<TemplateField> & { template_id: string; field_key: string; field_type: FieldType; label: string }

/** @deprecated Templates feature has been removed */
export type TemplateFieldUpdate = Partial<TemplateField>

/** @deprecated Templates feature has been removed */
export interface Customization {
  id: string
  user_id: string
  template_id: string
  name: string
  status: CustomizationStatus
  created_at: string
  updated_at: string
  published_at: string | null
  published_url: string | null
  thumbnail_url: string | null
}

/** @deprecated Templates feature has been removed */
export type CustomizationInsert = Partial<Customization> & { user_id: string; template_id: string; name: string }

/** @deprecated Templates feature has been removed */
export type CustomizationUpdate = Partial<Customization>

/** @deprecated Templates feature has been removed */
export interface FieldValue {
  id: string
  customization_id: string
  field_id: string
  value: string | null
  created_at: string
  updated_at: string
}

/** @deprecated Templates feature has been removed */
export type FieldValueInsert = Partial<FieldValue> & { customization_id: string; field_id: string }

/** @deprecated Templates feature has been removed */
export type FieldValueUpdate = Partial<FieldValue>

/** @deprecated Templates feature has been removed */
export interface TemplateWithFields extends Template {
  template_fields: TemplateField[]
}

/** @deprecated Templates feature has been removed */
export interface TemplateWithSystemPrompt extends Template {
  system_prompt: { name: string } | null
}

/** @deprecated Templates feature has been removed */
export interface CustomizationWithDetails extends Customization {
  template: Template
  field_values: (FieldValue & { template_field: TemplateField })[]
}

/** @deprecated Templates feature has been removed */
export interface FieldValueWithField extends FieldValue {
  template_field: TemplateField
}

/**
 * @deprecated This was for user campaign collections in the old templates feature.
 * For actual campaign types, use Campaign from @/types/campaigns instead.
 */
export interface UserCampaignCollection {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
  template_count?: number
}

/** @deprecated Use UserCampaignCollection instead */
export interface CampaignInsert {
  name: string
  description?: string | null
  color?: string
}

/** @deprecated Use UserCampaignCollection instead */
export interface CampaignUpdate {
  name?: string
  description?: string | null
  color?: string
  is_active?: boolean
}
