'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignCard } from '@/components/campaigns'
import { WeekData } from '@/types/campaigns'
import { createClient } from '@/lib/supabase/client'

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
  onFavoriteToggle
}: {
  weekData: WeekData
  onFavoriteToggle: (campaignId: string, isFavorite: boolean) => void
}) {
  const dates = getWeekDates(weekData.weekStart)

  return (
    <div>
      {/* Days Grid */}
      <div className="grid grid-cols-5 gap-3">
        {dates.map((day, index) => (
          <div
            key={day.dayName}
            className="min-w-0 bg-muted/50 rounded-xl p-4 flex flex-col"
          >
            {/* Day Header */}
            <div className="mb-3">
              <p className="text-sm font-medium text-foreground">{day.dayName}</p>
              <p className="text-xs text-muted-foreground">{day.month} {day.date}</p>
            </div>

            {/* Campaign Cards for this day */}
            <div className="space-y-3 flex-1">
              {weekData.campaigns
                .filter(campaign => campaign.day_of_week === index)
                .map(campaign => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
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
  const [userRegion, setUserRegion] = useState<string | null>(null)
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)

  // Fetch user's region from profile
  useEffect(() => {
    async function fetchUserRegion() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('region')
          .eq('id', user.id)
          .single()

        setUserRegion(profile?.region || 'US')
      } else {
        setUserRegion('US')
      }
    }

    fetchUserRegion()
  }, [])

  // Fetch campaigns once we have the user's region
  const fetchCampaigns = useCallback(async () => {
    if (!userRegion) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/campaigns/weekly?region=${userRegion}&weeks=8`)
      const data = await response.json()

      if (data.weeks) {
        setWeeks(data.weeks)

        // Find current week index or default to first
        const currentIdx = data.weeks.findIndex((w: WeekData) => w.isCurrentWeek)
        setCurrentWeekIndex(currentIdx >= 0 ? currentIdx : 0)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userRegion])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

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
  }

  // Get current week data
  const currentWeek = weeks[currentWeekIndex]

  // Navigation handlers
  const goToPreviousWeek = () => {
    if (currentWeekIndex < weeks.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1)
    }
  }

  const goToNextWeek = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1)
    }
  }

  // Can always go to older weeks (previous)
  const canGoPrevious = currentWeekIndex < weeks.length - 1

  // Can only go to newer weeks (next) if that week has campaigns
  const nextWeek = currentWeekIndex > 0 ? weeks[currentWeekIndex - 1] : null
  const canGoNext = currentWeekIndex > 0 && nextWeek && nextWeek.campaigns.length > 0

  // Find the index of the current week
  const currentWeekIdx = weeks.findIndex(w => w.isCurrentWeek)
  const isOnCurrentWeek = currentWeekIndex === currentWeekIdx

  const goToThisWeek = () => {
    if (currentWeekIdx >= 0) {
      setCurrentWeekIndex(currentWeekIdx)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Page Content */}
      <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Listing Attraction Plan</h1>
            <p className="text-muted-foreground">
              Here's your weekly marketing plan to help you get listings now and build your pipeline for the future.
            </p>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {/* Navigation Arrows */}
              <div className="flex items-center">
                <button
                  onClick={goToPreviousWeek}
                  disabled={!canGoPrevious}
                  className={cn(
                    'p-2 rounded-l-lg border border-border transition-colors',
                    canGoPrevious
                      ? 'hover:bg-accent text-foreground'
                      : 'opacity-40 cursor-not-allowed text-muted-foreground'
                  )}
                  title="Previous week"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNextWeek}
                  disabled={!canGoNext}
                  className={cn(
                    'p-2 rounded-r-lg border border-border border-l-0 transition-colors',
                    canGoNext
                      ? 'hover:bg-accent text-foreground'
                      : 'opacity-40 cursor-not-allowed text-muted-foreground'
                  )}
                  title="Next week"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Week Date Range */}
              {currentWeek && (
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-lg font-semibold text-foreground">
                    {formatWeekRange(currentWeek.weekStart)}
                  </span>
                  {currentWeek.isCurrentWeek && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-sm font-medium text-green-600 dark:text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Current
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* This Week Button */}
            <button
              onClick={goToThisWeek}
              disabled={isOnCurrentWeek || currentWeekIdx < 0}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isOnCurrentWeek || currentWeekIdx < 0
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              This Week
            </button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading campaigns...</p>
              </div>
            </div>
          ) : !currentWeek || currentWeek.campaigns.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No campaigns this week</h3>
                <p className="text-muted-foreground">
                  Check back later for new content
                </p>
              </div>
            </div>
          ) : (
            /* Current Week Section */
            <WeekSection
              weekData={currentWeek}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}
      </main>
    </div>
  )
}
