import { FieldConfig } from '@/components/admin/CampaignEditor'
import { CampaignCategory, categoryImageKitFolders } from '@/types/campaigns'
import { CATEGORY_TABLE_MAP } from '@/lib/campaign-utils'

/**
 * Base fields that appear at the start of all campaign editors
 * The thumbnail folder varies by category
 */
function getBaseFields(thumbnailFolder: string): FieldConfig[] {
  return [
    { name: 'is_active', label: 'Active', type: 'switch', description: 'Make visible to users' },
    { name: 'name', label: 'Campaign Name', type: 'text', required: true },
    { name: 'slug', label: 'Slug', type: 'slug', placeholder: 'auto-generated from name', description: 'URL-friendly identifier (must be unique)' },
    { name: 'introduction', label: 'Introduction', type: 'richtext', rows: 3, placeholder: 'Brief description (HTML supported)' },
    { name: 'thumbnail_url', label: 'Thumbnail Image', type: 'image', folder: thumbnailFolder },
  ]
}

/**
 * Region field that appears at the end of all campaign editors
 */
const REGION_FIELD: FieldConfig = {
  name: 'region',
  label: 'Region',
  type: 'button-select',
  options: [
    { value: 'US', label: '🇺🇸 US' },
    { value: 'CA', label: '🇨🇦 CA' },
    { value: 'US,CA', label: '🌎 Both' },
  ],
}

/**
 * Email campaign specific fields
 */
const EMAIL_FIELDS: FieldConfig[] = [
  { name: 'subject_line', label: 'Subject Line', type: 'text', required: true, placeholder: 'Email subject line' },
  { name: 'preview_text', label: 'Preview Text', type: 'text', placeholder: 'Text shown in email preview' },
  { name: 'email_body', label: 'Email Body', type: 'richtext', rows: 12, required: true, placeholder: 'Email content (HTML supported)' },
  { name: 'example_image_url', label: 'Example Image', type: 'image', folder: 'campaigns/Email' },
  { name: 'full_email_image_url', label: 'Full Email Image', type: 'image', folder: 'campaigns/Email' },
]

/**
 * Phone/Text script specific fields
 */
const PHONE_TEXT_FIELDS: FieldConfig[] = [
  { name: 'script_type', label: 'Script Type', type: 'select', options: [
    { value: 'call', label: 'Call Script' },
    { value: 'text', label: 'Text Message' },
    { value: 'both', label: 'Both' },
  ]},
  { name: 'text_message_1', label: 'Text Message 1', type: 'textarea', rows: 3 },
  { name: 'text_message_2', label: 'Text Message 2', type: 'textarea', rows: 3 },
  { name: 'text_message_3', label: 'Text Message 3', type: 'textarea', rows: 3 },
  { name: 'call_script_content', label: 'Call Script Content', type: 'textarea', rows: 10 },
  { name: 'call_script_pdf_url', label: 'Call Script PDF URL', type: 'url' },
  { name: 'example_image_url', label: 'Example Image', type: 'image', folder: 'campaigns/Text & Voice' },
  { name: 'full_script_image_url', label: 'Full Script Image', type: 'image', folder: 'campaigns/Text & Voice' },
]

/**
 * Social shareable specific fields
 */
const SOCIAL_FIELDS: FieldConfig[] = [
  { name: 'is_video', label: 'Is Video', type: 'switch' },
  { name: 'content_type', label: 'Content Type', type: 'select', options: [
    { value: 'static_image', label: 'Static Image' },
    { value: 'reel', label: 'Reel' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'video', label: 'Video' },
  ]},
  { name: 'canva_template_url', label: 'Canva Template URL', type: 'url' },
  { name: 'video_title', label: 'Video Title', type: 'text' },
  { name: 'video_description', label: 'Video Description', type: 'textarea', rows: 3 },
  { name: 'video_script', label: 'Video Script', type: 'textarea', rows: 8 },
  { name: 'video_flow_pdf_title', label: 'Video Flow PDF Title', type: 'text' },
  { name: 'video_flow_pdf_url', label: 'Video Flow PDF URL', type: 'url' },
  { name: 'audio_transcription_url', label: 'Audio Transcription URL', type: 'url' },
  { name: 'example_image_url', label: 'Example Image', type: 'image', folder: 'campaigns/Social Shareables' },
]

/**
 * Direct mail specific fields
 */
const DIRECT_MAIL_FIELDS: FieldConfig[] = [
  { name: 'mail_type', label: 'Mail Type', type: 'select', options: [
    { value: 'postcard', label: 'Postcard' },
    { value: 'letter', label: 'Letter' },
    { value: 'flyer', label: 'Flyer' },
  ]},
  { name: 'canva_template_url', label: 'Canva Template URL', type: 'url' },
  { name: 'editor_url', label: 'Editor URL', type: 'url' },
  { name: 'example_image_url', label: 'Example Image', type: 'image', folder: 'campaigns/Direct Mail' },
]

/**
 * Get all fields for a specific campaign category
 */
export function getCampaignFields(category: CampaignCategory): FieldConfig[] {
  const thumbnailFolder = categoryImageKitFolders[category]
  const baseFields = getBaseFields(thumbnailFolder)

  let categoryFields: FieldConfig[]
  switch (category) {
    case 'email-campaigns':
      categoryFields = EMAIL_FIELDS
      break
    case 'phone-text-scripts':
      categoryFields = PHONE_TEXT_FIELDS
      break
    case 'social-shareables':
      categoryFields = SOCIAL_FIELDS
      break
    case 'direct-mail':
      categoryFields = DIRECT_MAIL_FIELDS
      break
    default:
      categoryFields = []
  }

  return [...baseFields, ...categoryFields, REGION_FIELD]
}

/**
 * Campaign editor configuration for each category
 */
export interface CampaignEditorConfig {
  tableName: string
  title: string
  backPath: string
  fields: FieldConfig[]
}

/**
 * Get complete editor configuration for a campaign category
 */
export function getCampaignEditorConfig(category: CampaignCategory): CampaignEditorConfig {
  const titles: Record<CampaignCategory, string> = {
    'email-campaigns': 'Email Campaign',
    'phone-text-scripts': 'Phone/Text Script',
    'social-shareables': 'Social Shareable',
    'direct-mail': 'Direct Mail',
  }

  const backPaths: Record<CampaignCategory, string> = {
    'email-campaigns': '/admin/campaigns/email',
    'phone-text-scripts': '/admin/campaigns/phone-text-scripts',
    'social-shareables': '/admin/campaigns/social',
    'direct-mail': '/admin/campaigns/direct-mail',
  }

  return {
    tableName: CATEGORY_TABLE_MAP[category],
    title: titles[category],
    backPath: backPaths[category],
    fields: getCampaignFields(category),
  }
}
