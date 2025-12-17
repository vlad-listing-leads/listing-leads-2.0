'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignCard, CampaignPreviewModal } from '@/components/campaigns'
import { CampaignCard as CampaignCardType, WeekData, categoryConfig, CampaignCategory } from '@/types/campaigns'

// Region options
const regions = [
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'UK', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
]

// Get week dates helper
const getWeekDates = (startDateStr: string) => {
  const startDate = new Date(startDateStr)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const dates = []

  for (let i = 0; i < 5; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push({
      dayName: days[i],
      date: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
    })
  }

  return dates
}

// Format week range
const formatWeekRange = (startDateStr: string) => {
  const startDate = new Date(startDateStr)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 4)

  const startMonth = startDate.toLocaleString('default', { month: 'short' })
  const endMonth = endDate.toLocaleString('default', { month: 'short' })

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}`
  }
  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`
}

// Week Section Component
function WeekSection({
  weekData,
  onCampaignClick,
  onFavoriteToggle
}: {
  weekData: WeekData
  onCampaignClick: (campaign: CampaignCardType) => void
  onFavoriteToggle: (campaignId: string, isFavorite: boolean) => void
}) {
  const dates = getWeekDates(weekData.weekStart)
  const weekRange = formatWeekRange(weekData.weekStart)

  return (
    <div className="mb-10">
      {/* Week Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">{weekRange}</h3>
        </div>
        {weekData.isCurrentWeek && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            This Week
          </span>
        )}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-5 gap-4">
        {dates.map((day, index) => (
          <div key={day.dayName} className="min-w-0">
            {/* Day Header */}
            <div className="mb-3">
              <p className="text-sm text-muted-foreground">{day.dayName}</p>
              <p className="text-sm font-medium text-foreground">{day.month} {day.date}</p>
            </div>

            {/* Campaign Cards for this day */}
            <div className="space-y-3">
              {weekData.campaigns
                .filter(campaign => campaign.day_of_week === index)
                .map(campaign => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onClick={onCampaignClick}
                    onFavoriteToggle={onFavoriteToggle}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ListingAttractionPlanPage() {
  const [weeks, setWeeks] = useState<WeekData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState('US')
  const [regionMenuOpen, setRegionMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignCardType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState<CampaignCategory | 'all'>('all')

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/campaigns/weekly?region=${selectedRegion}&weeks=4`)
      const data = await response.json()

      if (data.weeks) {
        setWeeks(data.weeks)

        // Count favorites
        const totalFavorites = data.weeks.reduce((count: number, week: WeekData) =>
          count + week.campaigns.filter(c => c.isFavorite).length, 0
        )
        setFavoritesCount(totalFavorites)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedRegion])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleCampaignClick = (campaign: CampaignCardType) => {
    setSelectedCampaign(campaign)
    setIsModalOpen(true)
  }

  const handleFavoriteToggle = (campaignId: string, isFavorite: boolean) => {
    // Update local state
    setWeeks(prevWeeks =>
      prevWeeks.map(week => ({
        ...week,
        campaigns: week.campaigns.map(c =>
          c.id === campaignId ? { ...c, isFavorite } : c
        )
      }))
    )

    // Update count
    setFavoritesCount(prev => isFavorite ? prev + 1 : prev - 1)

    // Update selected campaign if open
    if (selectedCampaign?.id === campaignId) {
      setSelectedCampaign(prev => prev ? { ...prev, isFavorite } : null)
    }
  }

  const handleRegionChange = (regionCode: string) => {
    setSelectedRegion(regionCode)
    setRegionMenuOpen(false)
  }

  const currentRegion = regions.find(r => r.code === selectedRegion) || regions[0]

  // Filter campaigns by search and category
  const filteredWeeks = weeks.map(week => ({
    ...week,
    campaigns: week.campaigns.filter(campaign => {
      const searchText = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        (campaign.name || campaign.title || '').toLowerCase().includes(searchText) ||
        (campaign.introduction || campaign.description || '').toLowerCase().includes(searchText)

      const matchesCategory = categoryFilter === 'all' || campaign.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  })).filter(week => week.campaigns.length > 0)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Page Content */}
      <main className="flex-1 p-8 overflow-y-auto">
          {/* Page Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Listing Attraction Plan</h1>
              <p className="text-muted-foreground">
                Here's your weekly marketing plan to help you get listings now and build your pipeline for the future.
              </p>
            </div>

            {/* Region Selector */}
            <div className="relative">
              <button
                onClick={() => setRegionMenuOpen(!regionMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <span className="text-lg">{currentRegion.flag}</span>
                <span className="text-sm font-medium text-foreground">{currentRegion.code}</span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  regionMenuOpen && "rotate-180"
                )} />
              </button>

              {regionMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setRegionMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-20 bg-card border border-border rounded-lg shadow-lg overflow-hidden min-w-[160px]">
                    {regions.map(region => (
                      <button
                        key={region.code}
                        onClick={() => handleRegionChange(region.code)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                          region.code === selectedRegion
                            ? 'bg-accent text-accent-foreground'
                            : 'text-foreground hover:bg-accent/50'
                        )}
                      >
                        <span>{region.flag}</span>
                        <span>{region.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                categoryFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              All
            </button>
            {(Object.keys(categoryConfig) as CampaignCategory[]).map(category => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                  categoryFilter === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {categoryConfig[category].label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading campaigns...</p>
              </div>
            </div>
          ) : filteredWeeks.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No campaigns found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Check back later for new content'}
                </p>
              </div>
            </div>
          ) : (
            /* Week Sections */
            filteredWeeks.map((week, index) => (
              <WeekSection
                key={week.weekStart}
                weekData={week}
                onCampaignClick={handleCampaignClick}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))
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
