'use client'

import { Search, Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CampaignFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  showFeatured: boolean
  onFeaturedChange: (show: boolean) => void
  totalCount: number
  filteredCount: number
  placeholder?: string
}

export function CampaignFilters({
  searchQuery,
  onSearchChange,
  showFeatured,
  onFeaturedChange,
  totalCount,
  filteredCount,
  placeholder = 'Search campaigns...'
}: CampaignFiltersProps) {
  const hasActiveFilters = searchQuery || showFeatured

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
      {/* Search */}
      <div className="relative flex-1 w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onFeaturedChange(!showFeatured)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            showFeatured
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <Star className={cn('w-4 h-4', showFeatured && 'fill-current')} />
          Featured
        </button>

        {hasActiveFilters && (
          <button
            onClick={() => {
              onSearchChange('')
              onFeaturedChange(false)
            }}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground ml-auto">
        {filteredCount === totalCount ? (
          <span>{totalCount} items</span>
        ) : (
          <span>{filteredCount} of {totalCount} items</span>
        )}
      </div>
    </div>
  )
}
