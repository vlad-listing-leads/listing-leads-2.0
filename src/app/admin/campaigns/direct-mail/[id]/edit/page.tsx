'use client'

import { use } from 'react'
import { CampaignEditor, FieldConfig } from '@/components/admin/CampaignEditor'

const fields: FieldConfig[] = [
  { name: 'name', label: 'Campaign Name', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'text', placeholder: 'auto-generated from name if empty' },
  { name: 'introduction', label: 'Introduction', type: 'textarea', rows: 3 },
  { name: 'thumbnail_url', label: 'Thumbnail URL', type: 'url' },
  { name: 'mail_type', label: 'Mail Type', type: 'select', options: [
    { value: 'postcard', label: 'Postcard' },
    { value: 'letter', label: 'Letter' },
    { value: 'flyer', label: 'Flyer' },
  ]},
  { name: 'target_audience', label: 'Target Audience', type: 'text' },
  { name: 'canva_template_url', label: 'Canva Template URL', type: 'url' },
  { name: 'editor_url', label: 'Editor URL', type: 'url' },
  { name: 'example_image_url', label: 'Example Image URL', type: 'url' },
  { name: 'execution_steps', label: 'Execution Steps (JSON)', type: 'json', rows: 6 },
  { name: 'region', label: 'Region', type: 'select', options: [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
  ]},
  { name: 'week_start_date', label: 'Week Start Date', type: 'date' },
  { name: 'day_of_week', label: 'Day of Week', type: 'select', options: [
    { value: '0', label: 'Monday' },
    { value: '1', label: 'Tuesday' },
    { value: '2', label: 'Wednesday' },
    { value: '3', label: 'Thursday' },
    { value: '4', label: 'Friday' },
  ]},
  { name: 'is_featured', label: 'Featured', type: 'switch' },
  { name: 'is_active', label: 'Active', type: 'switch' },
]

export default function EditDirectMailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <CampaignEditor
      tableName="direct_mail_templates"
      campaignId={id}
      fields={fields}
      title="Direct Mail"
      backPath="/admin/campaigns/direct-mail"
    />
  )
}
