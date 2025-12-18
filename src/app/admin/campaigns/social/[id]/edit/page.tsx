'use client'

import { use } from 'react'
import { CampaignEditor, FieldConfig } from '@/components/admin/CampaignEditor'

const fields: FieldConfig[] = [
  { name: 'is_active', label: 'Active', type: 'switch', description: 'Make visible to users' },
  { name: 'name', label: 'Campaign Name', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'slug', placeholder: 'auto-generated from name', description: 'URL-friendly identifier (must be unique)' },
  { name: 'introduction', label: 'Introduction', type: 'html', rows: 3, placeholder: 'Brief description of this content' },
  { name: 'thumbnail_url', label: 'Thumbnail Image', type: 'image', folder: 'campaigns/Social Shareables' },
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
  { name: 'region', label: 'Region', type: 'button-select', options: [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
  ]},
]

export default function EditSocialShareablePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <CampaignEditor
      tableName="social_shareables"
      campaignId={id}
      fields={fields}
      title="Social Shareable"
      backPath="/admin/campaigns/social"
    />
  )
}
