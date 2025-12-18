'use client'

import { useState, useEffect, useMemo } from 'react'
import { CalendarWeek, categoryConfig } from '@/types/campaigns'
import { WeekDetailPanel } from '@/components/admin/calendar/WeekDetailPanel'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ChevronLeft, ChevronRight, Calendar, Mail, Phone, Share2, FileBox } from 'lucide-react'
import { cn } from '@/lib/utils'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const categoryIcons = {
  'email-campaigns': Mail,
  'phone-text-scripts': Phone,
  'social-shareables': Share2,
  'direct-mail': FileBox,
}

export default function CalendarPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [weeks, setWeeks] = useState<CalendarWeek[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<CalendarWeek | null>(null)

  // Get current week number
  const getCurrentWeekNumber = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    const oneWeek = 604800000
    return Math.ceil(diff / oneWeek)
  }

  const currentWeekNumber = getCurrentWeekNumber()

  // Fetch weeks for selected year
  useEffect(() => {
    const fetchWeeks = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/calendar/weeks?year=${selectedYear}`)
        if (response.ok) {
          const data = await response.json()
          setWeeks(data.weeks || [])
        }
      } catch (error) {
        console.error('Error fetching weeks:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeeks()
  }, [selectedYear])

  // Group weeks by month (based on start date)
  const weeksByMonth = useMemo(() => {
    const grouped: Record<number, CalendarWeek[]> = {}

    for (const week of weeks) {
      const startDate = new Date(week.week_start_date)
      const month = startDate.getMonth()

      if (!grouped[month]) {
        grouped[month] = []
      }
      grouped[month].push(week)
    }

    return grouped
  }, [weeks])

  const handleToggleAvailability = async (weekId: string, isAvailable: boolean) => {
    try {
      const response = await fetch('/api/admin/calendar/weeks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_id: weekId, is_available: isAvailable }),
      })

      if (response.ok) {
        setWeeks(prev => prev.map(w =>
          w.id === weekId ? { ...w, is_available: isAvailable } : w
        ))
        if (selectedWeek?.id === weekId) {
          setSelectedWeek(prev => prev ? { ...prev, is_available: isAvailable } : null)
        }
      }
    } catch (error) {
      console.error('Error updating availability:', error)
    }
  }

  const handleUpdateTheme = async (weekId: string, theme: string) => {
    try {
      const response = await fetch('/api/admin/calendar/weeks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_id: weekId, theme }),
      })

      if (response.ok) {
        setWeeks(prev => prev.map(w =>
          w.id === weekId ? { ...w, theme } : w
        ))
        if (selectedWeek?.id === weekId) {
          setSelectedWeek(prev => prev ? { ...prev, theme } : null)
        }
      }
    } catch (error) {
      console.error('Error updating theme:', error)
    }
  }

  const handleRefresh = async () => {
    try {
      const response = await fetch(`/api/admin/calendar/weeks?year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setWeeks(data.weeks || [])
        if (selectedWeek) {
          const updatedWeek = data.weeks?.find((w: CalendarWeek) => w.id === selectedWeek.id)
          if (updatedWeek) setSelectedWeek(updatedWeek)
        }
      }
    } catch (error) {
      console.error('Error refreshing:', error)
    }
  }

  // Stats
  const availableWeeks = weeks.filter(w => w.is_available).length
  const weeksWithCampaigns = weeks.filter(w => {
    if (!w.campaign_counts) return false
    return Object.values(w.campaign_counts).some(c => c > 0)
  }).length

  const formatDateRange = (weekStartDate: string) => {
    const start = new Date(weekStartDate)
    const end = new Date(start)
    end.setDate(end.getDate() + 4)

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    return `${startStr} - ${endStr}`
  }

  const getTotalCampaigns = (week: CalendarWeek) => {
    if (!week.campaign_counts) return 0
    return Object.values(week.campaign_counts).reduce((sum, count) => sum + count, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Campaign Calendar
          </h1>
          <p className="text-muted-foreground">
            Schedule and manage campaigns by week
          </p>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear(y => y - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Select
            value={selectedYear.toString()}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-[120px]"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear(y => y + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold">{weeks.length}</div>
          <div className="text-sm text-muted-foreground">Total Weeks</div>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold text-green-600">{availableWeeks}</div>
          <div className="text-sm text-muted-foreground">Available on Site</div>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold">{weeksWithCampaigns}</div>
          <div className="text-sm text-muted-foreground">With Campaigns</div>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold text-primary">Week {currentWeekNumber}</div>
          <div className="text-sm text-muted-foreground">Current Week</div>
        </div>
      </div>

      {/* Calendar list by month */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : weeks.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No weeks found for {selectedYear}.
        </div>
      ) : (
        <div className="space-y-8">
          {monthNames.map((monthName, monthIndex) => {
            const monthWeeks = weeksByMonth[monthIndex]
            if (!monthWeeks || monthWeeks.length === 0) return null

            return (
              <div key={monthIndex}>
                {/* Month header */}
                <h2 className="text-lg font-semibold mb-3 sticky top-0 bg-muted/30 backdrop-blur-sm py-2 -mx-2 px-2">
                  {monthName} {selectedYear}
                </h2>

                {/* Week rows */}
                <div className="space-y-2">
                  {monthWeeks.map((week) => {
                    const isCurrentWeek = selectedYear === currentYear && week.week_number === currentWeekNumber
                    const totalCampaigns = getTotalCampaigns(week)

                    return (
                      <div
                        key={week.id}
                        onClick={() => setSelectedWeek(week)}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                          isCurrentWeek
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:border-primary/50',
                          week.is_available && 'ring-2 ring-green-500/30'
                        )}
                      >
                        {/* Week number */}
                        <div className="w-16 text-center">
                          <div className="text-xs text-muted-foreground">Week</div>
                          <div className="text-xl font-bold">{week.week_number}</div>
                        </div>

                        {/* Date range */}
                        <div className="w-40">
                          <div className="font-medium">{formatDateRange(week.week_start_date)}</div>
                          {isCurrentWeek && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>

                        {/* Campaign counts */}
                        <div className="flex-1 flex items-center gap-2 flex-wrap">
                          {week.campaign_counts && Object.entries(week.campaign_counts).map(([category, count]) => {
                            if (count === 0) return null
                            const Icon = categoryIcons[category as keyof typeof categoryIcons]
                            const config = categoryConfig[category as keyof typeof categoryConfig]

                            return (
                              <div
                                key={category}
                                className={cn(
                                  'flex items-center gap-1 px-2 py-1 rounded text-xs',
                                  config.color,
                                  config.darkColor
                                )}
                                title={config.label}
                              >
                                <Icon className="w-3 h-3" />
                                <span>{count}</span>
                              </div>
                            )
                          })}
                          {totalCampaigns === 0 && (
                            <span className="text-sm text-muted-foreground">No campaigns</span>
                          )}
                        </div>

                        {/* Theme */}
                        {week.theme && (
                          <div className="text-sm text-muted-foreground max-w-[150px] truncate" title={week.theme}>
                            {week.theme}
                          </div>
                        )}

                        {/* Available toggle */}
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs text-muted-foreground">Live</span>
                          <Switch
                            checked={week.is_available}
                            onCheckedChange={(checked) => handleToggleAvailability(week.id, checked)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Week detail panel */}
      {selectedWeek && (
        <WeekDetailPanel
          week={selectedWeek}
          onClose={() => setSelectedWeek(null)}
          onToggleAvailability={handleToggleAvailability}
          onUpdateTheme={handleUpdateTheme}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  )
}
