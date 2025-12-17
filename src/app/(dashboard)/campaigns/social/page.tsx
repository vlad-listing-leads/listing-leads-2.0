'use client'

import { useState, useEffect, useMemo } from 'react'
import { Share2, Video, Image } from 'lucide-react'
import { CampaignCard, CampaignPreviewModal, CampaignFilters } from '@/components/campaigns'
import { CampaignCard as CampaignCardType } from '@/types/campaigns'
import { cn } from '@/lib/utils'

type ContentFilter = 'all' | 'video' | 'static'

export default function SocialShareablesPage() {
  const [campaigns, setCampaigns] = useState<(CampaignCardType & { is_video?: boolean })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignCardType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFeatured, setShowFeatured] = useState(false)
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

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const searchText = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        (campaign.name || '').toLowerCase().includes(searchText) ||
        (campaign.introduction || '').toLowerCase().includes(searchText)

      const matchesFeatured = !showFeatured || campaign.is_featured

      const matchesContent =
        contentFilter === 'all' ||
        (contentFilter === 'video' && campaign.is_video) ||
        (contentFilter === 'static' && !campaign.is_video)

      return matchesSearch && matchesFeatured && matchesContent
    })
  }, [campaigns, searchQuery, showFeatured, contentFilter])

  const handleCampaignClick = (campaign: CampaignCardType) => {
    setSelectedCampaign(campaign)
    setIsModalOpen(true)
  }

  const handleFavoriteToggle = (campaignId: string, isFavorite: boolean) => {
    setCampaigns(prev =>
      prev.map(c => c.id === campaignId ? { ...c, isFavorite } : c)
    )
    if (selectedCampaign?.id === campaignId) {
      setSelectedCampaign(prev => prev ? { ...prev, isFavorite } : null)
    }
  }

  const videoCount = campaigns.filter(c => c.is_video).length
  const staticCount = campaigns.filter(c => !c.is_video).length

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
              onClick={() => setContentFilter('static')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                contentFilter === 'static'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Image className="w-4 h-4" />
              Static ({staticCount})
            </button>
            <button
              onClick={() => setContentFilter('video')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                contentFilter === 'video'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Video className="w-4 h-4" />
              Video ({videoCount})
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
            placeholder="Search content..."
          />
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          </div>
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
          /* Campaign Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCampaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={handleCampaignClick}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      <CampaignPreviewModal
        campaign={selectedCampaign}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedCampaign(null)
        }}
        onFavoriteToggle={handleFavoriteToggle}
      />
    </div>
  )
}
