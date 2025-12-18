'use client'

import { Video, Image } from 'lucide-react'
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
    key: 'content_type',
    label: 'Type',
    render: (value, row) => (
      <div className="flex items-center gap-2">
        {row.is_video ? (
          <Video className="w-4 h-4 text-purple-500" />
        ) : (
          <Image className="w-4 h-4 text-blue-500" />
        )}
        <span className="text-sm capitalize">{value?.replace('_', ' ') || 'static image'}</span>
      </div>
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

export default function SocialShareablesPage() {
  return (
    <CampaignList
      title="Social Shareables"
      description="Manage social media posts, reels, and videos"
      tableName="social_shareables"
      columns={columns}
      basePath="/admin/campaigns/social"
      createPath="/admin/campaigns/social/new"
    />
  )
}
