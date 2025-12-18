'use client'

import {
  CampaignList,
  CampaignColumn,
  ThumbnailCell,
  StatusCell,
  DateCell,
} from '@/components/admin/CampaignList'

const columns: CampaignColumn[] = [
  {
    key: 'name',
    label: 'Campaign',
    sortable: true,
    render: (value, row) => <ThumbnailCell url={row.thumbnail_url} name={value} />,
  },
  {
    key: 'script_type',
    label: 'Type',
    render: (value) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
        {value || 'text'}
      </span>
    ),
  },
  {
    key: 'region',
    label: 'Region',
    render: (value) => <span className="text-sm">{value || 'US'}</span>,
  },
  {
    key: 'is_active',
    label: 'Status',
    render: (value, row) => <StatusCell isActive={value} isFeatured={row.is_featured} />,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    render: (value) => <DateCell date={value} />,
  },
]

export default function PhoneTextScriptsPage() {
  return (
    <CampaignList
      title="Phone & Text Scripts"
      description="Manage call scripts and text message templates"
      tableName="phone_text_scripts"
      columns={columns}
      basePath="/admin/campaigns/phone-text-scripts"
      createPath="/admin/campaigns/phone-text-scripts/new"
    />
  )
}
