'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  Clock,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { YouTubeVideo, VideoCategory, VideoCreator } from '@/types/youtube'
import { formatDuration } from '@/lib/supadata'

export default function YouTubeVideosPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [categories, setCategories] = useState<VideoCategory[]>([])
  const [creators, setCreators] = useState<VideoCreator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [creatorFilter, setCreatorFilter] = useState<string>('all')
  const [sortColumn, setSortColumn] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    Promise.all([fetchVideos(), fetchCategories(), fetchCreators()])
  }, [])

  const fetchVideos = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/youtube/videos?includeInactive=true')
      const data = await response.json()
      if (data.videos) {
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/youtube/categories')
      const data = await response.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchCreators = async () => {
    try {
      const response = await fetch('/api/youtube/creators')
      const data = await response.json()
      if (data.creators) {
        setCreators(data.creators)
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    try {
      const response = await fetch(`/api/youtube/videos/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setVideos(videos.filter(v => v.id !== id))
      } else {
        alert('Failed to delete video')
      }
    } catch (error) {
      console.error('Failed to delete video:', error)
      alert('Failed to delete video')
    }
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Filter and sort videos
  const filteredVideos = videos
    .filter(video => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        if (
          !video.name?.toLowerCase().includes(searchLower) &&
          !video.creator?.name?.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }
      if (categoryFilter !== 'all' && video.category_id !== categoryFilter) {
        return false
      }
      if (creatorFilter !== 'all' && video.creator_id !== creatorFilter) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortColumn) {
        case 'name':
          aVal = a.name || ''
          bVal = b.name || ''
          break
        case 'view_count':
          aVal = a.view_count || 0
          bVal = b.view_count || 0
          break
        case 'created_at':
          aVal = a.created_at || ''
          bVal = b.created_at || ''
          break
        default:
          aVal = a.created_at || ''
          bVal = b.created_at || ''
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">YouTube Videos</h1>
          <p className="text-muted-foreground mt-1">
            Manage YouTube video library with AI-powered content extraction
          </p>
        </div>
        <Link href="/admin/youtube/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Video
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-[180px]"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </Select>

        <Select
          value={creatorFilter}
          onChange={(e) => setCreatorFilter(e.target.value)}
          className="w-[180px]"
        >
          <option value="all">All Creators</option>
          {creators.map(creator => (
            <option key={creator.id} value={creator.id}>{creator.name}</option>
          ))}
        </Select>

        <p className="text-sm text-muted-foreground ml-auto">
          {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12 bg-background rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">
            {searchQuery || categoryFilter !== 'all' || creatorFilter !== 'all'
              ? 'No videos match your filters'
              : 'No videos yet'}
          </p>
          {!searchQuery && categoryFilter === 'all' && creatorFilter === 'all' && (
            <Link href="/admin/youtube/new">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add your first video
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Video
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('view_count')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Views
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Added
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVideos.map((video) => (
                <TableRow key={video.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.name}
                          className="w-16 h-10 rounded object-cover bg-muted"
                        />
                      ) : (
                        <div className="w-16 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                      <span className="font-medium truncate max-w-[250px]">{video.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{video.creator?.name || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{video.category?.name || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.video_runtime || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      {video.view_count?.toLocaleString() || '0'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        video.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {video.is_active ? 'Active' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {video.created_at
                        ? new Date(video.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/youtube/${video.id}/edit`)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(video.youtube_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on YouTube
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(video.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
