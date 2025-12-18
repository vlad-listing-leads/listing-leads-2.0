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
    key: 'subject_line',
    label: 'Subject Line',
    render: (value) => (
      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
        {value || '-'}
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

export default function EmailCampaignsPage() {
  return (
    <CampaignList
      title="Email Campaigns"
      description="Manage email campaign templates and content"
      tableName="email_campaigns"
      columns={columns}
      basePath="/admin/campaigns/email"
      createPath="/admin/campaigns/email/new"
    />
  )
}
