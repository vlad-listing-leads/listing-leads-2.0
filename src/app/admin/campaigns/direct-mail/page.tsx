'use client'

import {
  CampaignList,
  CampaignColumn,
  ThumbnailCell,
  StatusCell,
  DateCell,
  WeekCell,
} from '@/components/admin/CampaignList'

const columns: CampaignColumn[] = [
  {
    key: 'name',
    label: 'Campaign',
    sortable: true,
    render: (value, row) => <ThumbnailCell url={row.thumbnail_url} name={value} />,
  },
  {
    key: 'mail_type',
    label: 'Type',
    render: (value) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 capitalize">
        {value || 'postcard'}
      </span>
    ),
  },
  {
    key: 'week_start_date',
    label: 'Week',
    sortable: true,
    render: (value, row) => <WeekCell weekStart={value} dayOfWeek={row.day_of_week} />,
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

export default function DirectMailPage() {
  return (
    <CampaignList
      title="Direct Mail"
      description="Manage postcards, letters, and flyers"
      tableName="direct_mail_templates"
      columns={columns}
      basePath="/admin/campaigns/direct-mail"
      createPath="/admin/campaigns/direct-mail/new"
    />
  )
}
