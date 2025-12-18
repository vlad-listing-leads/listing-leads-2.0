'use client'

import { useState, useEffect, useMemo } from 'react'
import { FileBox, Mail, FileText } from 'lucide-react'
import { LazyGrid, CampaignFilters, CampaignGridSkeleton } from '@/components/campaigns'
import { CampaignCard as CampaignCardType } from '@/types/campaigns'
import { cn } from '@/lib/utils'

type MailType = 'all' | 'postcard' | 'letter'

export default function DirectMailPage() {
  const [campaigns, setCampaigns] = useState<(CampaignCardType & { mail_type?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFeatured, setShowFeatured] = useState(false)
  const [mailType, setMailType] = useState<MailType>('all')

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch('/api/campaigns/direct-mail')
        const data = await response.json()
        if (data.campaigns) {
          setCampaigns(data.campaigns)
        }
      } catch (error) {
        console.error('Failed to fetch campaigns:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCampaigns()
  }, [])

  const postcardCount = campaigns.filter(c => c.mail_type === 'postcard').length
  const letterCount = campaigns.filter(c => c.mail_type === 'letter').length

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const searchText = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        (campaign.name || '').toLowerCase().includes(searchText) ||
        (campaign.introduction || '').toLowerCase().includes(searchText)

      const matchesFeatured = !showFeatured || campaign.is_featured

      const matchesType =
        mailType === 'all' ||
        (mailType === 'postcard' && campaign.mail_type === 'postcard') ||
        (mailType === 'letter' && campaign.mail_type === 'letter')

      return matchesSearch && matchesFeatured && matchesType
    })
  }, [campaigns, searchQuery, showFeatured, mailType])

  const handleFavoriteToggle = (campaignId: string, isFavorite: boolean) => {
    setCampaigns(prev =>
      prev.map(c => c.id === campaignId ? { ...c, isFavorite } : c)
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Page Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <FileBox className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Direct Mail Templates</h1>
          </div>
          <p className="text-muted-foreground">
            High-converting postcard and letter designs to reach homeowners in your farm area.
          </p>
        </div>

        {/* Category Tabs */}
        {!isLoading && campaigns.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setMailType('all')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                mailType === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              All ({campaigns.length})
            </button>
            <button
              onClick={() => setMailType('postcard')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                mailType === 'postcard'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Mail className="w-4 h-4" />
              Postcards ({postcardCount})
            </button>
            <button
              onClick={() => setMailType('letter')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                mailType === 'letter'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <FileText className="w-4 h-4" />
              Letters ({letterCount})
            </button>
          </div>
        )}

        {/* Filters */}
        {!isLoading && campaigns.length > 0 && (
          <CampaignFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showFeatured={showFeatured}
            onFeaturedChange={setShowFeatured}
            totalCount={campaigns.length}
            filteredCount={filteredCampaigns.length}
            placeholder="Search templates..."
          />
        )}

        {/* Loading State */}
        {isLoading ? (
          <CampaignGridSkeleton count={8} />
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileBox className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {campaigns.length === 0 ? 'No templates found' : 'No matching templates'}
              </h3>
              <p className="text-muted-foreground">
                {campaigns.length === 0 ? 'Check back later for new content' : 'Try adjusting your search or filters'}
              </p>
            </div>
          </div>
        ) : (
          /* Campaign Grid with Lazy Loading */
          <LazyGrid
            campaigns={filteredCampaigns}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}
      </main>
    </div>
  )
}
