'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Mail, Phone, FileBox, Share2, Star, Video, Image, Megaphone, Instagram, Youtube, Building2 } from 'lucide-react'
import { Command as CommandPrimitive } from 'cmdk'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  name: string
  slug: string
  introduction: string | null
  thumbnail_url: string | null
  category: string
  is_featured: boolean
  is_video?: boolean
  type: 'campaign' | 'creator'
  // Creator-specific fields
  company?: { name: string; icon_url: string | null }
  creator?: { name: string; handle?: string }
  platform?: string
  channel?: string
}

interface GroupedResults {
  'phone-text-scripts': SearchResult[]
  'email-campaigns': SearchResult[]
  'direct-mail': SearchResult[]
  'social-shareables': SearchResult[]
  ads: SearchResult[]
  'short-videos': SearchResult[]
  'youtube-videos': SearchResult[]
}

const categoryConfig = {
  'phone-text-scripts': {
    label: 'Text Scripts',
    icon: Phone,
    color: 'text-green-500',
    path: '/campaigns/phone-text-scripts',
    type: 'campaign',
  },
  'email-campaigns': {
    label: 'Email Campaigns',
    icon: Mail,
    color: 'text-blue-500',
    path: '/campaigns/email-campaigns',
    type: 'campaign',
  },
  'direct-mail': {
    label: 'Direct Mail',
    icon: FileBox,
    color: 'text-orange-500',
    path: '/campaigns/direct-mail',
    type: 'campaign',
  },
  'social-shareables': {
    label: 'Social Shareables',
    icon: Share2,
    color: 'text-purple-500',
    path: '/campaigns/social-shareables',
    type: 'campaign',
  },
  ads: {
    label: 'Best Ads',
    icon: Megaphone,
    color: 'text-blue-600',
    path: '/social/best-ads',
    type: 'creator',
  },
  'short-videos': {
    label: 'Instagram Reels',
    icon: Instagram,
    color: 'text-pink-500',
    path: '/social/instagram-reels',
    type: 'creator',
  },
  'youtube-videos': {
    label: 'YouTube Videos',
    icon: Youtube,
    color: 'text-red-500',
    path: '/social/youtube-videos',
    type: 'creator',
  },
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<GroupedResults | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Focus input when opened
  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Click outside to close
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  // Keyboard shortcut to open search
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Debounced search
  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
        const data = await response.json()
        setResults(data.grouped || null)
      } catch (error) {
        console.error('Search failed:', error)
        setResults(null)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    const config = categoryConfig[result.category as keyof typeof categoryConfig]
    if (config) {
      // For creator content, just navigate to the list page
      // For campaigns, navigate to the specific campaign detail page
      if (config.type === 'creator') {
        router.push(config.path)
      } else {
        router.push(`${config.path}/${result.slug}`)
      }
      setOpen(false)
      setQuery('')
    }
  }

  const hasResults =
    results &&
    (results['phone-text-scripts']?.length > 0 ||
      results['email-campaigns']?.length > 0 ||
      results['direct-mail']?.length > 0 ||
      results['social-shareables']?.length > 0 ||
      results.ads?.length > 0 ||
      results['short-videos']?.length > 0 ||
      results['youtube-videos']?.length > 0)

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg w-full',
          'bg-muted/50 hover:bg-muted border border-border',
          'text-muted-foreground text-sm',
          'transition-opacity duration-200',
          open && 'opacity-0 pointer-events-none'
        )}
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dropdown - positioned over the trigger, animates width */}
      <div
        className={cn(
          'absolute top-0 left-1/2 z-50',
          'transition-all duration-300 ease-out',
          open
            ? 'opacity-100 w-[480px] -translate-x-1/2'
            : 'opacity-0 w-full -translate-x-1/2 pointer-events-none'
        )}
      >
        <CommandPrimitive
          className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
          shouldFilter={false}
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 h-10 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search campaigns, ads, videos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">esc</span>
            </kbd>
          </div>

          {/* Results List */}
          <CommandPrimitive.List className="max-h-[400px] overflow-y-auto">
            {isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Searching...
              </div>
            )}

            {!isLoading && query.length >= 2 && !hasResults && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {!isLoading && query.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}

            {!isLoading &&
              results &&
              Object.entries(categoryConfig).map(([key, config]) => {
                const categoryResults = results[key as keyof GroupedResults]
                if (!categoryResults || categoryResults.length === 0) return null

                const Icon = config.icon

                return (
                  <CommandPrimitive.Group
                    key={key}
                    heading={config.label}
                    className="p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {categoryResults.map((result) => (
                      <CommandPrimitive.Item
                        key={result.id}
                        value={`${result.name}-${result.id}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3 py-3 px-2 rounded-md cursor-pointer data-[selected=true]:bg-accent"
                      >
                        {/* Thumbnail or Icon */}
                        {result.thumbnail_url ? (
                          <div className={cn(
                            "rounded-md overflow-hidden bg-muted flex-shrink-0",
                            key === 'short-videos' ? "w-8 h-14" : "w-10 h-10"
                          )}>
                            <img
                              src={result.thumbnail_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              'w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0',
                              'bg-muted'
                            )}
                          >
                            <Icon className={cn('w-5 h-5', config.color)} />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{result.name}</span>
                            {result.is_featured && (
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                            {key === 'social-shareables' && result.is_video && (
                              <Video className="w-3 h-3 text-purple-500 flex-shrink-0" />
                            )}
                            {key === 'social-shareables' && !result.is_video && (
                              <Image className="w-3 h-3 text-purple-400 flex-shrink-0" />
                            )}
                          </div>
                          {/* Campaign introduction */}
                          {result.introduction && (
                            <p className="text-xs text-muted-foreground truncate">
                              {result.introduction}
                            </p>
                          )}
                          {/* Creator content meta */}
                          {key === 'ads' && result.company && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              {result.company.icon_url && (
                                <img src={result.company.icon_url} alt="" className="w-3 h-3 rounded" />
                              )}
                              {result.company.name}
                              {result.channel && ` · ${result.channel === 'meta' ? 'Meta' : 'Google'}`}
                            </p>
                          )}
                          {key === 'short-videos' && result.creator && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{result.creator.handle || result.creator.name}
                            </p>
                          )}
                          {key === 'youtube-videos' && result.creator && (
                            <p className="text-xs text-muted-foreground truncate">
                              {result.creator.name}
                            </p>
                          )}
                        </div>

                        {/* Category Badge */}
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                            'bg-muted text-muted-foreground'
                          )}
                        >
                          {config.label}
                        </span>
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                )
              })}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </div>
    </div>
  )
}
