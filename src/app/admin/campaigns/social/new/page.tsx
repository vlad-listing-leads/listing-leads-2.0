'use client'

import { CampaignEditor, FieldConfig } from '@/components/admin/CampaignEditor'

const fields: FieldConfig[] = [
  { name: 'name', label: 'Campaign Name', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'text', placeholder: 'auto-generated from name if empty' },
  { name: 'introduction', label: 'Introduction', type: 'textarea', rows: 3 },
  { name: 'thumbnail_url', label: 'Thumbnail URL', type: 'url' },
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

export default function NewSocialShareablePage() {
  return (
    <CampaignEditor
      tableName="social_shareables"
      fields={fields}
      title="Social Shareable"
      backPath="/admin/campaigns/social"
    />
  )
}
