'use client'

import { CampaignEditor } from '@/components/admin/CampaignEditor'
import { getCampaignEditorConfig } from '@/config/campaign-fields'

const config = getCampaignEditorConfig('phone-text-scripts')

export default function NewPhoneTextScriptPage() {
  return (
    <CampaignEditor
      tableName={config.tableName}
      fields={config.fields}
      title={config.title}
      backPath={config.backPath}
    />
  )
}
