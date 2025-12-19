'use client'

import { CampaignEditor } from '@/components/admin/CampaignEditor'
import { getCampaignEditorConfig } from '@/config/campaign-fields'

const config = getCampaignEditorConfig('social-shareables')

export default function NewSocialShareablePage() {
  return (
    <CampaignEditor
      tableName={config.tableName}
      fields={config.fields}
      title={config.title}
      backPath={config.backPath}
    />
  )
}
