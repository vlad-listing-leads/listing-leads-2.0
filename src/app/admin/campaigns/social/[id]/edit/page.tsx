'use client'

import { use } from 'react'
import { CampaignEditor } from '@/components/admin/CampaignEditor'
import { getCampaignEditorConfig } from '@/config/campaign-fields'

const config = getCampaignEditorConfig('social-shareables')

export default function EditSocialShareablePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <CampaignEditor
      tableName={config.tableName}
      campaignId={id}
      fields={config.fields}
      title={config.title}
      backPath={config.backPath}
    />
  )
}
