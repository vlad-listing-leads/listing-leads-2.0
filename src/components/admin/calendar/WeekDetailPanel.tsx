'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarWeek, CampaignWeekAssignment, CampaignCategory, categoryConfig } from '@/types/campaigns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { X, Plus, Trash2, ExternalLink, Mail, Phone, Share2, FileBox } from 'lucide-react'
import { AssignCampaignModal } from './AssignCampaignModal'

interface WeekDetailPanelProps {
  week: CalendarWeek
  onClose: () => void
  onToggleAvailability: (weekId: string, isAvailable: boolean) => void
  onUpdateTheme: (weekId: string, theme: string) => void
  onRefresh: () => void
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const categoryTableMap: Record<CampaignCategory, string> = {
  'email-campaigns': 'email',
  'phone-text-scripts': 'phone-text-scripts',
  'social-shareables': 'social',
  'direct-mail': 'direct-mail',
}

const categoryIcons = {
  'email-campaigns': Mail,
  'phone-text-scripts': Phone,
  'social-shareables': Share2,
  'direct-mail': FileBox,
}

export function WeekDetailPanel({
  week,
  onClose,
  onToggleAvailability,
  onUpdateTheme,
  onRefresh,
}: WeekDetailPanelProps) {
  const [assignments, setAssignments] = useState<CampaignWeekAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'all' | CampaignCategory>('all')
  const [theme, setTheme] = useState(week.theme || '')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const weekStart = new Date(week.week_start_date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 4)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/calendar/weeks/${week.id}/assignments`)
        if (response.ok) {
          const data = await response.json()
          setAssignments(data.assignments)
        }
      } catch (error) {
        console.error('Error fetching assignments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignments()
  }, [week.id])

  // Filter assignments by category
  const filteredAssignments = selectedCategory === 'all'
    ? assignments
    : assignments.filter(a => a.category === selectedCategory)

  // Group assignments by day
  const assignmentsByDay: Record<number, CampaignWeekAssignment[]> = {
    0: [], 1: [], 2: [], 3: [], 4: [],
  }
  for (const assignment of filteredAssignments) {
    assignmentsByDay[assignment.day_of_week].push(assignment)
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Remove this campaign from this week?')) return

    try {
      const response = await fetch(
        `/api/admin/calendar/weeks/${week.id}/assignments?assignmentId=${assignmentId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId))
        onRefresh()
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
    }
  }

  const handleAssignCampaign = async (campaignId: string, category: CampaignCategory) => {
    if (selectedDay === null) return

    try {
      const response = await fetch(`/api/admin/calendar/weeks/${week.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          category,
          day_of_week: selectedDay,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Refetch to get full campaign data
        const assignmentsResponse = await fetch(`/api/admin/calendar/weeks/${week.id}/assignments`)
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json()
          setAssignments(assignmentsData.assignments)
        }
        onRefresh()
      }
    } catch (error) {
      console.error('Error assigning campaign:', error)
    }

    setShowAssignModal(false)
    setSelectedDay(null)
  }

  const handleThemeBlur = () => {
    if (theme !== week.theme) {
      onUpdateTheme(week.id, theme)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">
              Week {week.week_number}: {formatDate(weekStart)} - {formatDate(weekEnd)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {week.year}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Available on site:</span>
              <Switch
                checked={week.is_available}
                onCheckedChange={(checked) => onToggleAvailability(week.id, checked)}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Theme input */}
        <div className="px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Theme:</label>
            <Input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onBlur={handleThemeBlur}
              placeholder="e.g., Spring Market, Holiday Rush..."
              className="max-w-xs h-8"
            />
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="px-4 py-2 border-b border-border">
          <div className="flex gap-1">
            {[
              { value: 'all', label: 'All', icon: null },
              { value: 'email-campaigns', label: 'Email', icon: Mail },
              { value: 'phone-text-scripts', label: 'Phone', icon: Phone },
              { value: 'social-shareables', label: 'Social', icon: Share2 },
              { value: 'direct-mail', label: 'Direct Mail', icon: FileBox },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = selectedCategory === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedCategory(tab.value as typeof selectedCategory)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Day columns */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4 min-h-[400px]">
              {dayNames.map((dayName, dayIndex) => {
                const dayDate = new Date(weekStart)
                dayDate.setDate(dayDate.getDate() + dayIndex)

                return (
                  <div key={dayIndex} className="flex flex-col">
                    {/* Day header */}
                    <div className="text-sm font-medium mb-2 pb-2 border-b border-border">
                      <div>{dayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    {/* Campaign cards */}
                    <div className="flex-1 space-y-2">
                      {assignmentsByDay[dayIndex].map((assignment) => {
                        const campaign = assignment.campaign
                        if (!campaign) return null
                        const Icon = categoryIcons[assignment.category]
                        const config = categoryConfig[assignment.category]

                        return (
                          <div
                            key={assignment.id}
                            className="group relative p-2 rounded-md border border-border bg-card hover:border-primary/50 transition-colors"
                          >
                            {/* Thumbnail */}
                            {campaign.thumbnail_url && (
                              <div className="relative w-full aspect-video rounded overflow-hidden mb-2">
                                <Image
                                  src={campaign.thumbnail_url}
                                  alt={campaign.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}

                            {/* Category badge */}
                            <div className={cn(
                              'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs w-fit mb-1',
                              config.color,
                              config.darkColor
                            )}>
                              <Icon className="w-3 h-3" />
                              <span>{config.label}</span>
                            </div>

                            {/* Campaign name */}
                            <div className="text-sm font-medium truncate" title={campaign.name}>
                              {campaign.name}
                            </div>

                            {/* Actions */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Link
                                href={`/admin/campaigns/${categoryTableMap[assignment.category]}/${campaign.id}/edit`}
                                className="p-1 rounded bg-background/80 hover:bg-accent"
                                title="Edit campaign"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className="p-1 rounded bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                                title="Remove from week"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      {/* Add campaign button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                        onClick={() => {
                          setSelectedDay(dayIndex)
                          setShowAssignModal(true)
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign Campaign Modal */}
      {showAssignModal && selectedDay !== null && (
        <AssignCampaignModal
          weekId={week.id}
          dayOfWeek={selectedDay}
          dayName={dayNames[selectedDay]}
          onAssign={handleAssignCampaign}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedDay(null)
          }}
        />
      )}
    </div>
  )
}
