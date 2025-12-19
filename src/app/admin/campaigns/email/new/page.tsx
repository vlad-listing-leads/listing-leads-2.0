'use client'

import { CampaignEditor } from '@/components/admin/CampaignEditor'
import { getCampaignEditorConfig } from '@/config/campaign-fields'

const config = getCampaignEditorConfig('email-campaigns')

export default function NewEmailCampaignPage() {
  return (
    <CampaignEditor
      tableName={config.tableName}
      fields={config.fields}
      title={config.title}
      backPath={config.backPath}
    />
  )
}
