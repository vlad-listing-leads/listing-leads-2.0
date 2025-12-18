'use client'

import { CampaignEditor, FieldConfig } from '@/components/admin/CampaignEditor'

const fields: FieldConfig[] = [
  { name: 'is_active', label: 'Active', type: 'switch', description: 'Make visible to users' },
  { name: 'name', label: 'Campaign Name', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'slug', placeholder: 'auto-generated from name', description: 'URL-friendly identifier (must be unique)' },
  { name: 'introduction', label: 'Introduction', type: 'html', rows: 3, placeholder: 'Brief description of this template' },
  { name: 'thumbnail_url', label: 'Thumbnail Image', type: 'image', folder: 'campaigns/Direct Mail' },
  { name: 'mail_type', label: 'Mail Type', type: 'select', options: [
    { value: 'postcard', label: 'Postcard' },
    { value: 'letter', label: 'Letter' },
    { value: 'flyer', label: 'Flyer' },
  ]},
  { name: 'canva_template_url', label: 'Canva Template URL', type: 'url' },
  { name: 'editor_url', label: 'Editor URL', type: 'url' },
  { name: 'example_image_url', label: 'Example Image', type: 'image', folder: 'campaigns/Direct Mail' },
  { name: 'region', label: 'Region', type: 'button-select', options: [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
  ]},
]

export default function NewDirectMailPage() {
  return (
    <CampaignEditor
      tableName="direct_mail_templates"
      fields={fields}
      title="Direct Mail"
      backPath="/admin/campaigns/direct-mail"
    />
  )
}
