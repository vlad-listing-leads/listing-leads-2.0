'use client'

import { useState, useEffect, useMemo } from 'react'
import { Mail } from 'lucide-react'
import { LazyGrid, CampaignFilters, CampaignGridSkeleton, SortOption } from '@/components/campaigns'
import { CampaignCard as CampaignCardType } from '@/types/campaigns'

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<(CampaignCardType & { created_at?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('latest')

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch('/api/campaigns/email')
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
    const filtered = campaigns.filter(campaign => {
      const searchText = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        (campaign.name || '').toLowerCase().includes(searchText) ||
        (campaign.introduction || '').toLowerCase().includes(searchText)

      return matchesSearch
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
  }, [campaigns, searchQuery, sortBy])

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
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Email Campaigns</h1>
          </div>
          <p className="text-muted-foreground">
            Professional email templates to nurture leads and stay top-of-mind with your database.
          </p>
        </div>

        {/* Filters */}
        {!isLoading && campaigns.length > 0 && (
          <CampaignFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalCount={campaigns.length}
            filteredCount={filteredCampaigns.length}
            placeholder="Search emails..."
          />
        )}

        {/* Loading State */}
        {isLoading ? (
          <CampaignGridSkeleton count={8} />
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {campaigns.length === 0 ? 'No campaigns found' : 'No matching campaigns'}
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
