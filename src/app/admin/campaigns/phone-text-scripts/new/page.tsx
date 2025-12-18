'use client'

import { CampaignEditor, FieldConfig } from '@/components/admin/CampaignEditor'

const fields: FieldConfig[] = [
  { name: 'is_active', label: 'Active', type: 'switch', description: 'Make visible to users' },
  { name: 'name', label: 'Campaign Name', type: 'text', required: true, placeholder: 'e.g., Expired Marketing - Call Script' },
  { name: 'slug', label: 'Slug', type: 'slug', placeholder: 'auto-generated from name', description: 'URL-friendly identifier (must be unique)' },
  { name: 'introduction', label: 'Introduction', type: 'html', rows: 3, placeholder: 'Brief description of this script' },
  { name: 'thumbnail_url', label: 'Thumbnail Image', type: 'image', folder: 'campaigns/Text & Voice' },
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
  { name: 'region', label: 'Region', type: 'button-select', options: [
    { value: 'US', label: '🇺🇸 US' },
    { value: 'CA', label: '🇨🇦 CA' },
    { value: 'US,CA', label: '🌎 Both' },
  ]},
]

export default function NewPhoneTextScriptPage() {
  return (
    <CampaignEditor
      tableName="phone_text_scripts"
      fields={fields}
      title="Phone/Text Script"
      backPath="/admin/campaigns/phone-text-scripts"
    />
  )
}
