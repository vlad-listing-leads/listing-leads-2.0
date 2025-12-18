'use client'

import { CalendarWeek, categoryConfig } from '@/types/campaigns'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Mail, Phone, Share2, FileBox } from 'lucide-react'

interface WeekCardProps {
  week: CalendarWeek
  isCurrentWeek?: boolean
  onToggleAvailability: (weekId: string, isAvailable: boolean) => void
  onClick: () => void
}

const categoryIcons = {
  'email-campaigns': Mail,
  'phone-text-scripts': Phone,
  'social-shareables': Share2,
  'direct-mail': FileBox,
}

export function WeekCard({ week, isCurrentWeek, onToggleAvailability, onClick }: WeekCardProps) {
  const weekStart = new Date(week.week_start_date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 4) // Mon-Fri

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const totalCampaigns = week.campaign_counts
    ? Object.values(week.campaign_counts).reduce((sum, count) => sum + count, 0)
    : 0

  return (
    <div
      className={cn(
        'relative p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md',
        isCurrentWeek
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50',
        week.is_available && 'ring-2 ring-green-500/30'
      )}
      onClick={onClick}
    >
      {/* Week number and date range */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-muted-foreground">
            Week {week.week_number}
          </span>
          {isCurrentWeek && (
            <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              Current
            </span>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={week.is_available}
            onCheckedChange={(checked) => {
              onToggleAvailability(week.id, checked)
            }}
            className="scale-75"
          />
        </div>
      </div>

      {/* Date range */}
      <div className="text-sm font-medium mb-2">
        {formatDate(weekStart)} - {formatDate(weekEnd)}
      </div>

      {/* Campaign count badges */}
      <div className="flex flex-wrap gap-1">
        {week.campaign_counts && Object.entries(week.campaign_counts).map(([category, count]) => {
          if (count === 0) return null
          const Icon = categoryIcons[category as keyof typeof categoryIcons]
          const config = categoryConfig[category as keyof typeof categoryConfig]

          return (
            <div
              key={category}
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
                config.color,
                config.darkColor
              )}
              title={`${count} ${config.label}`}
            >
              <Icon className="w-3 h-3" />
              <span>{count}</span>
            </div>
          )
        })}
        {totalCampaigns === 0 && (
          <span className="text-xs text-muted-foreground">No campaigns</span>
        )}
      </div>

      {/* Theme badge if set */}
      {week.theme && (
        <div className="mt-2 text-xs text-muted-foreground truncate" title={week.theme}>
          {week.theme}
        </div>
      )}

      {/* Available indicator */}
      {week.is_available && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500" title="Available on site" />
      )}
    </div>
  )
}
