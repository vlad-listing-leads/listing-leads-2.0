'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Mail, Phone, FileBox, Share2, Star, Video, Image } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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
}

interface GroupedResults {
  'phone-text-scripts': SearchResult[]
  email: SearchResult[]
  'direct-mail': SearchResult[]
  social: SearchResult[]
}

const categoryConfig = {
  'phone-text-scripts': {
    label: 'Text Scripts',
    icon: Phone,
    color: 'text-green-500',
    path: '/campaigns/phone-text-scripts',
  },
  email: {
    label: 'Email Campaigns',
    icon: Mail,
    color: 'text-blue-500',
    path: '/campaigns/email',
  },
  'direct-mail': {
    label: 'Direct Mail',
    icon: FileBox,
    color: 'text-orange-500',
    path: '/campaigns/direct-mail',
  },
  social: {
    label: 'Social Shareables',
    icon: Share2,
    color: 'text-purple-500',
    path: '/campaigns/social',
  },
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<GroupedResults | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

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
      // Navigate to the category page (you could also navigate to a specific campaign detail page)
      router.push(config.path)
      setOpen(false)
      setQuery('')
    }
  }

  const hasResults =
    results &&
    (results['phone-text-scripts'].length > 0 ||
      results.email.length > 0 ||
      results['direct-mail'].length > 0 ||
      results.social.length > 0)

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-muted/50 hover:bg-muted border border-border',
          'text-muted-foreground text-sm',
          'transition-colors w-full max-w-xs'
        )}
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search campaigns...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Campaigns"
        description="Search across all campaign types"
      >
        <CommandInput
          placeholder="Search all campaigns..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[400px]">
          {isLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching...
            </div>
          )}

          {!isLoading && query.length >= 2 && !hasResults && (
            <CommandEmpty>No campaigns found for "{query}"</CommandEmpty>
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
                <CommandGroup key={key} heading={config.label}>
                  {categoryResults.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={`${result.name}-${result.id}`}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3 py-3"
                    >
                      {/* Thumbnail or Icon */}
                      {result.thumbnail_url ? (
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
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
                          {key === 'social' && result.is_video && (
                            <Video className="w-3 h-3 text-purple-500 flex-shrink-0" />
                          )}
                          {key === 'social' && !result.is_video && (
                            <Image className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          )}
                        </div>
                        {result.introduction && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.introduction}
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
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
        </CommandList>
      </CommandDialog>
    </>
  )
}
