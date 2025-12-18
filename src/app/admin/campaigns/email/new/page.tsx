'use client'

import { CampaignEditor, FieldConfig } from '@/components/admin/CampaignEditor'

const fields: FieldConfig[] = [
  { name: 'name', label: 'Campaign Name', type: 'text', required: true, placeholder: 'e.g., New Listings Up 14%' },
  { name: 'slug', label: 'Slug', type: 'text', placeholder: 'auto-generated from name if empty', description: 'URL-friendly identifier' },
  { name: 'introduction', label: 'Introduction', type: 'textarea', rows: 3, placeholder: 'Brief description of this campaign' },
  { name: 'thumbnail_url', label: 'Thumbnail URL', type: 'url', placeholder: 'https://...' },
  { name: 'subject_line', label: 'Subject Line', type: 'text', required: true, placeholder: 'Email subject line' },
  { name: 'preview_text', label: 'Preview Text', type: 'text', placeholder: 'Text shown in email preview' },
  { name: 'email_body', label: 'Email Body', type: 'textarea', rows: 12, required: true, placeholder: 'Email content...' },
  { name: 'target_audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., First-time homebuyers' },
  { name: 'recommended_audience', label: 'Recommended Audience', type: 'textarea', rows: 2 },
  { name: 'example_image_url', label: 'Example Image URL', type: 'url' },
  { name: 'full_email_image_url', label: 'Full Email Image URL', type: 'url' },
  { name: 'execution_steps', label: 'Execution Steps (JSON)', type: 'json', rows: 6, placeholder: '[{"step": 1, "title": "...", "description": "..."}]' },
  { name: 'region', label: 'Region', type: 'select', options: [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
  ]},
  { name: 'week_start_date', label: 'Week Start Date', type: 'date', description: 'Monday of the week to show this campaign' },
  { name: 'day_of_week', label: 'Day of Week', type: 'select', options: [
    { value: '0', label: 'Monday' },
    { value: '1', label: 'Tuesday' },
    { value: '2', label: 'Wednesday' },
    { value: '3', label: 'Thursday' },
    { value: '4', label: 'Friday' },
  ]},
  { name: 'is_featured', label: 'Featured', type: 'switch', description: 'Show as featured campaign' },
  { name: 'is_active', label: 'Active', type: 'switch', description: 'Make visible to users' },
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
