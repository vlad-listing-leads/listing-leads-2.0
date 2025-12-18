'use client'

import { CampaignEditor, FieldConfig } from '@/components/admin/CampaignEditor'

const fields: FieldConfig[] = [
  { name: 'is_active', label: 'Active', type: 'switch', description: 'Make visible to users' },
  { name: 'name', label: 'Campaign Name', type: 'text', required: true, placeholder: 'e.g., New Listings Up 14%' },
  { name: 'slug', label: 'Slug', type: 'slug', placeholder: 'auto-generated from name', description: 'URL-friendly identifier (must be unique)' },
  { name: 'introduction', label: 'Introduction', type: 'richtext', rows: 4, placeholder: 'Brief description of this campaign (HTML supported)' },
  { name: 'thumbnail_url', label: 'Thumbnail Image', type: 'image', folder: 'campaigns/Email' },
  { name: 'subject_line', label: 'Subject Line', type: 'text', required: true, placeholder: 'Email subject line' },
  { name: 'preview_text', label: 'Preview Text', type: 'text', placeholder: 'Text shown in email preview' },
  { name: 'email_body', label: 'Email Body', type: 'richtext', rows: 12, required: true, placeholder: 'Email content (HTML supported)' },
  { name: 'example_image_url', label: 'Example Image', type: 'image', folder: 'campaigns/Email' },
  { name: 'full_email_image_url', label: 'Full Email Image', type: 'image', folder: 'campaigns/Email' },
  { name: 'region', label: 'Region', type: 'button-select', options: [
    { value: 'US', label: '🇺🇸 US' },
    { value: 'CA', label: '🇨🇦 CA' },
    { value: 'US,CA', label: '🌎 Both' },
  ]},
]

export default function NewEmailCampaignPage() {
  return (
    <CampaignEditor
      tableName="email_campaigns"
      fields={fields}
      title="Email Campaign"
      backPath="/admin/campaigns/email"
    />
  )
}
