'use client'

import { useState, useEffect, useMemo } from 'react'
import { Share2, Film, Square, Youtube } from 'lucide-react'
import { LazyGrid, CampaignFilters, CampaignGridSkeleton, SortOption } from '@/components/campaigns'
import { CampaignCard as CampaignCardType } from '@/types/campaigns'
import { cn } from '@/lib/utils'

type ContentFilter = 'all' | 'reels' | 'stories' | 'youtube'

export default function SocialShareablesPage() {
  const [campaigns, setCampaigns] = useState<(CampaignCardType & { content_type?: string; created_at?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all')

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch('/api/campaigns/social')
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

  const reelsCount = campaigns.filter(c => c.content_type === 'reels').length
  const storiesCount = campaigns.filter(c => c.content_type === 'stories').length
  const youtubeCount = campaigns.filter(c => c.content_type === 'youtube').length

  const filteredCampaigns = useMemo(() => {
    const filtered = campaigns.filter(campaign => {
      const searchText = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        (campaign.name || '').toLowerCase().includes(searchText) ||
        (campaign.introduction || '').toLowerCase().includes(searchText)

      const matchesContent =
        contentFilter === 'all' ||
        campaign.content_type === contentFilter

      return matchesSearch && matchesContent
    })

    // Sort the filtered campaigns
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        case 'a-z':
          return (a.name || '').localeCompare(b.name || '')
        case 'z-a':
          return (b.name || '').localeCompare(a.name || '')
        default:
          return 0
      }
    })
  }, [campaigns, searchQuery, sortBy, contentFilter])

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
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Social Shareables</h1>
          </div>
          <p className="text-muted-foreground">
            Eye-catching social media content and video scripts to grow your online presence.
          </p>
        </div>

        {/* Content Type Tabs */}
        {!isLoading && campaigns.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setContentFilter('all')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                contentFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              All ({campaigns.length})
            </button>
            <button
              onClick={() => setContentFilter('reels')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                contentFilter === 'reels'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Film className="w-4 h-4" />
              Reels ({reelsCount})
            </button>
            <button
              onClick={() => setContentFilter('stories')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                contentFilter === 'stories'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Square className="w-4 h-4" />
              Stories ({storiesCount})
            </button>
            <button
              onClick={() => setContentFilter('youtube')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                contentFilter === 'youtube'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Youtube className="w-4 h-4" />
              YouTube ({youtubeCount})
            </button>
          </div>
        )}

        {/* Filters */}
        {!isLoading && campaigns.length > 0 && (
          <CampaignFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalCount={campaigns.length}
            filteredCount={filteredCampaigns.length}
            placeholder="Search content..."
          />
        )}

        {/* Loading State */}
        {isLoading ? (
          <CampaignGridSkeleton count={8} />
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {campaigns.length === 0 ? 'No content found' : 'No matching content'}
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
