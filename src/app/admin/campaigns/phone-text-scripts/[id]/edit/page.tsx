'use client'

import { use } from 'react'
import { CampaignEditor, FieldConfig } from '@/components/admin/CampaignEditor'

const fields: FieldConfig[] = [
  { name: 'name', label: 'Campaign Name', type: 'text', required: true, placeholder: 'e.g., Expired Marketing - Call Script' },
  { name: 'slug', label: 'Slug', type: 'text', placeholder: 'auto-generated from name if empty' },
  { name: 'introduction', label: 'Introduction', type: 'textarea', rows: 3 },
  { name: 'thumbnail_url', label: 'Thumbnail URL', type: 'url' },
  { name: 'script_type', label: 'Script Type', type: 'select', options: [
    { value: 'call', label: 'Call Script' },
    { value: 'text', label: 'Text Message' },
    { value: 'both', label: 'Both' },
  ]},
  { name: 'target_audience', label: 'Target Audience', type: 'text' },
  { name: 'text_message_1', label: 'Text Message 1', type: 'textarea', rows: 3 },
  { name: 'text_message_2', label: 'Text Message 2', type: 'textarea', rows: 3 },
  { name: 'text_message_3', label: 'Text Message 3', type: 'textarea', rows: 3 },
  { name: 'call_script_content', label: 'Call Script Content', type: 'textarea', rows: 10 },
  { name: 'call_script_pdf_url', label: 'Call Script PDF URL', type: 'url' },
  { name: 'example_image_url', label: 'Example Image URL', type: 'url' },
  { name: 'full_script_image_url', label: 'Full Script Image URL', type: 'url' },
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

export default function EditPhoneTextScriptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <CampaignEditor
      tableName="phone_text_scripts"
      campaignId={id}
      fields={fields}
      title="Phone/Text Script"
      backPath="/admin/campaigns/phone-text-scripts"
    />
  )
}
