'use client'

import { useState, useEffect, useMemo } from 'react'
import { Phone, MessageSquare } from 'lucide-react'
import { LazyGrid, CampaignFilters, CampaignGridSkeleton, SortOption } from '@/components/campaigns'
import { CampaignCard as CampaignCardType } from '@/types/campaigns'
import { cn } from '@/lib/utils'

type ScriptType = 'all' | 'voice' | 'text'

export default function PhoneTextScriptsPage() {
  const [campaigns, setCampaigns] = useState<(CampaignCardType & { script_type?: string; created_at?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [scriptType, setScriptType] = useState<ScriptType>('all')

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch('/api/campaigns/phone-text-scripts')
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

  const voiceCount = campaigns.filter(c => c.script_type === 'voice').length
  const textCount = campaigns.filter(c => c.script_type === 'text').length

  const filteredCampaigns = useMemo(() => {
    const filtered = campaigns.filter(campaign => {
      const searchText = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        (campaign.name || '').toLowerCase().includes(searchText) ||
        (campaign.introduction || '').toLowerCase().includes(searchText)

      const matchesType =
        scriptType === 'all' ||
        (scriptType === 'voice' && campaign.script_type === 'voice') ||
        (scriptType === 'text' && campaign.script_type === 'text')

      return matchesSearch && matchesType
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
  }, [campaigns, searchQuery, sortBy, scriptType])

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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Voice Call & Text Scripts</h1>
            </div>
          </div>
          <p className="text-muted-foreground">
            Ready-to-use voice call and text message scripts to connect with leads and clients.
          </p>
        </div>

        {/* Category Tabs */}
        {!isLoading && campaigns.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setScriptType('all')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                scriptType === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              All ({campaigns.length})
            </button>
            <button
              onClick={() => setScriptType('voice')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                scriptType === 'voice'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Phone className="w-4 h-4" />
              Voice Call ({voiceCount})
            </button>
            <button
              onClick={() => setScriptType('text')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                scriptType === 'text'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <MessageSquare className="w-4 h-4" />
              Text ({textCount})
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
            placeholder="Search scripts..."
          />
        )}

        {/* Loading State */}
        {isLoading ? (
          <CampaignGridSkeleton count={8} />
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {campaigns.length === 0 ? 'No scripts found' : 'No matching scripts'}
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
