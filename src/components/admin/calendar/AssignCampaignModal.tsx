'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CampaignCategory, CampaignCard, categoryConfig } from '@/types/campaigns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { X, Search, Plus, Mail, Phone, Share2, FileBox } from 'lucide-react'

interface AssignCampaignModalProps {
  weekId: string
  dayOfWeek: number
  dayName: string
  onAssign: (campaignId: string, category: CampaignCategory) => void
  onClose: () => void
}

const categoryIcons = {
  'email-campaigns': Mail,
  'phone-text-scripts': Phone,
  'social-shareables': Share2,
  'direct-mail': FileBox,
}

export function AssignCampaignModal({
  weekId,
  dayOfWeek,
  dayName,
  onAssign,
  onClose,
}: AssignCampaignModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CampaignCategory | 'all'>('all')
  const [campaigns, setCampaigns] = useState<CampaignCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          limit: '30',
          excludeWeekId: weekId,
        })
        if (debouncedQuery) params.append('q', debouncedQuery)
        if (selectedCategory !== 'all') params.append('category', selectedCategory)

        const response = await fetch(`/api/admin/campaigns/search?${params}`)
        if (response.ok) {
          const data = await response.json()
          setCampaigns(data.campaigns)
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCampaigns()
  }, [debouncedQuery, selectedCategory, weekId])

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold">Add Campaign to {dayName}</h3>
            <p className="text-sm text-muted-foreground">
              Search and select a campaign to add
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="pl-9"
              />
            </div>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as typeof selectedCategory)}
              className="w-[180px]"
            >
              <option value="all">All categories</option>
              <option value="email-campaigns">Email Campaigns</option>
              <option value="phone-text-scripts">Phone & Text Scripts</option>
              <option value="social-shareables">Social Shareables</option>
              <option value="direct-mail">Direct Mail</option>
            </Select>
          </div>

          {/* Create new links */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-muted-foreground">Create new:</span>
            <Link href="/admin/campaigns/email/new" className="text-primary hover:underline">
              Email
            </Link>
            <Link href="/admin/campaigns/phone-text-scripts/new" className="text-primary hover:underline">
              Phone/Text
            </Link>
            <Link href="/admin/campaigns/social/new" className="text-primary hover:underline">
              Social
            </Link>
            <Link href="/admin/campaigns/direct-mail/new" className="text-primary hover:underline">
              Direct Mail
            </Link>
          </div>
        </div>

        {/* Campaign list */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Spinner />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {debouncedQuery
                ? `No campaigns found matching "${debouncedQuery}"`
                : 'No campaigns available'}
            </div>
          ) : (
            <div className="space-y-2">
              {campaigns.map((campaign) => {
                const Icon = categoryIcons[campaign.category]
                const config = categoryConfig[campaign.category]

                return (
                  <div
                    key={`${campaign.category}-${campaign.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors group"
                    onClick={() => onAssign(campaign.id, campaign.category)}
                  >
                    {/* Thumbnail */}
                    {campaign.thumbnail_url ? (
                      <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={campaign.thumbnail_url}
                          alt={campaign.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{campaign.name}</div>
                      <div className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs w-fit mt-1',
                        config.color,
                        config.darkColor
                      )}>
                        <Icon className="w-3 h-3" />
                        <span>{config.label}</span>
                      </div>
                    </div>

                    {/* Add button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
