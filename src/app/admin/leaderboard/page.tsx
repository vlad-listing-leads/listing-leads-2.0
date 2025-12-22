'use client'

import { useState, useEffect } from 'react'
import { LeaderboardEntryDisplay, FeaturedCreatorDisplay, LeaderboardType } from '@/types/leaderboard'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Trash2,
  GripVertical,
  RefreshCw,
  Eye,
  Heart,
  MessageCircle,
  Instagram,
  Youtube,
  ChevronDown,
  Users,
} from 'lucide-react'
import { formatEngagementNumber } from '@/lib/engagement-fetcher'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AddLeaderboardEntryModal from '@/components/admin/AddLeaderboardEntryModal'

// Generate month options for the past 12 months
function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }

  return options
}

// Sortable row component for entries
interface SortableEntryRowProps {
  entry: LeaderboardEntryDisplay
  rank: number
  onDelete: (id: string) => void
  isDeleting: boolean
}

function SortableEntryRow({ entry, rank, onDelete, isDeleting }: SortableEntryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const metrics = entry.cached_engagement || { views: null, likes: null, comments: null }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-accent/50 transition-colors ${isDragging ? 'bg-accent' : ''}`}
    >
      <td className="px-3 py-4 w-10">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <td className="px-3 py-4 w-12">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
          {rank}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-4">
          {entry.thumbnail_url && (
            <div className="flex-shrink-0 w-20 h-12 relative">
              <img
                className="w-full h-full rounded-lg object-cover"
                src={entry.thumbnail_url}
                alt=""
              />
              <div className="absolute top-1 left-1">
                {entry.video_type === 'instagram' ? (
                  <Instagram className="w-4 h-4 text-white drop-shadow" />
                ) : (
                  <Youtube className="w-4 h-4 text-white drop-shadow" />
                )}
              </div>
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate max-w-xs">
              {entry.title}
            </div>
            {entry.creator_name && (
              <div className="text-xs text-muted-foreground">
                {entry.creator_handle ? `@${entry.creator_handle}` : entry.creator_name}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1" title="Views">
            <Eye className="w-4 h-4" />
            {formatEngagementNumber(metrics.views)}
          </span>
          <span className="flex items-center gap-1" title="Likes">
            <Heart className="w-4 h-4" />
            {formatEngagementNumber(metrics.likes)}
          </span>
          <span className="flex items-center gap-1" title="Comments">
            <MessageCircle className="w-4 h-4" />
            {formatEngagementNumber(metrics.comments)}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            entry.is_active
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}
        >
          {entry.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-right">
        <button
          onClick={() => onDelete(entry.id)}
          disabled={isDeleting}
          className="p-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
        >
          {isDeleting ? (
            <Spinner size="sm" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </td>
    </tr>
  )
}

// Sortable row component for featured creators
interface SortableCreatorRowProps {
  creator: FeaturedCreatorDisplay
  onDelete: (id: string) => void
  isDeleting: boolean
}

function SortableCreatorRow({ creator, onDelete, isDeleting }: SortableCreatorRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: creator.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors ${
        isDragging ? 'bg-accent' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
        {creator.avatar_url ? (
          <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{creator.name}</div>
        {creator.handle && (
          <div className="text-xs text-muted-foreground">@{creator.handle}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {creator.creator_type === 'instagram' ? (
          <Instagram className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Youtube className="w-4 h-4 text-muted-foreground" />
        )}
        <button
          onClick={() => onDelete(creator.id)}
          disabled={isDeleting}
          className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
        >
          {isDeleting ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

export default function AdminLeaderboardPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<LeaderboardType>('monthly')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const monthOptions = getMonthOptions()

  // Entries state
  const [entries, setEntries] = useState<LeaderboardEntryDisplay[]>([])
  const [isLoadingEntries, setIsLoadingEntries] = useState(true)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [isRefreshingMetrics, setIsRefreshingMetrics] = useState(false)

  // Featured creators state
  const [creators, setCreators] = useState<FeaturedCreatorDisplay[]>([])
  const [isLoadingCreators, setIsLoadingCreators] = useState(true)
  const [deletingCreatorId, setDeletingCreatorId] = useState<string | null>(null)

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch entries
  const fetchEntries = async () => {
    setIsLoadingEntries(true)
    try {
      const params = new URLSearchParams({
        leaderboard_type: activeTab,
        include_inactive: 'true',
      })
      if (activeTab === 'monthly') {
        params.set('month_year', selectedMonth)
      }

      const response = await fetch(`/api/leaderboard/entries?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch entries')
      }

      setEntries(result.entries || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entries')
    } finally {
      setIsLoadingEntries(false)
    }
  }

  // Fetch featured creators
  const fetchCreators = async () => {
    setIsLoadingCreators(true)
    try {
      const response = await fetch('/api/leaderboard/featured-creators?include_inactive=true')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch creators')
      }

      setCreators(result.creators || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch creators')
    } finally {
      setIsLoadingCreators(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [activeTab, selectedMonth])

  useEffect(() => {
    fetchCreators()
  }, [])

  // Handle entry drag end
  const handleEntryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = entries.findIndex((e) => e.id === active.id)
      const newIndex = entries.findIndex((e) => e.id === over.id)

      const newEntries = arrayMove(entries, oldIndex, newIndex)
      setEntries(newEntries)

      setIsSavingOrder(true)
      try {
        const response = await fetch('/api/leaderboard/entries/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entry_ids: newEntries.map((e) => e.id),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to save order')
        }
      } catch (err) {
        console.error('Error saving order:', err)
        setEntries(entries) // Revert
        setError('Failed to save entry order')
      } finally {
        setIsSavingOrder(false)
      }
    }
  }

  // Handle creator drag end
  const handleCreatorDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = creators.findIndex((c) => c.id === active.id)
      const newIndex = creators.findIndex((c) => c.id === over.id)

      const newCreators = arrayMove(creators, oldIndex, newIndex)
      setCreators(newCreators)

      try {
        const response = await fetch('/api/leaderboard/featured-creators/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creator_ids: newCreators.map((c) => c.id),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to save order')
        }
      } catch (err) {
        console.error('Error saving creator order:', err)
        setCreators(creators) // Revert
        setError('Failed to save creator order')
      }
    }
  }

  // Delete entry
  const handleDeleteEntry = async (id: string) => {
    setDeletingEntryId(id)
    try {
      const response = await fetch(`/api/leaderboard/entries/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete entry')
      }

      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry')
    } finally {
      setDeletingEntryId(null)
    }
  }

  // Delete creator
  const handleDeleteCreator = async (id: string) => {
    setDeletingCreatorId(id)
    try {
      const response = await fetch(`/api/leaderboard/featured-creators/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete creator')
      }

      setCreators((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete creator')
    } finally {
      setDeletingCreatorId(null)
    }
  }

  // Refresh metrics
  const handleRefreshMetrics = async () => {
    setIsRefreshingMetrics(true)
    try {
      const response = await fetch('/api/leaderboard/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_ids: entries.map((e) => e.id),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh metrics')
      }

      // Refresh entries to get updated metrics
      await fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh metrics')
    } finally {
      setIsRefreshingMetrics(false)
    }
  }

  // Handle entry added
  const handleEntryAdded = () => {
    setIsAddModalOpen(false)
    fetchEntries()
  }

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Viral Leaderboard</h1>
            <p className="mt-1 text-muted-foreground">
              Manage featured videos. Drag to reorder rankings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSavingOrder && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Spinner size="sm" />
                Saving...
              </span>
            )}
            <Button
              variant="outline"
              onClick={handleRefreshMetrics}
              disabled={isRefreshingMetrics || entries.length === 0}
            >
              {isRefreshingMetrics ? (
                <Spinner size="sm" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Metrics
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Video
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setActiveTab('staff_picks')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'staff_picks'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Staff Picks
            </button>
          </div>

          {activeTab === 'monthly' && (
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-card border border-border rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-5 py-4 mb-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Entries table */}
        {isLoadingEntries ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground mb-4">
              No videos in {activeTab === 'monthly' ? 'this month\'s' : 'staff picks'} leaderboard
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>Add your first video</Button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleEntryDragEnd}
            >
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-4 w-10"></th>
                    <th className="px-3 py-4 w-12 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Engagement
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <SortableContext
                    items={entries.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {entries.map((entry, index) => (
                      <SortableEntryRow
                        key={entry.id}
                        entry={entry}
                        rank={index + 1}
                        onDelete={handleDeleteEntry}
                        isDeleting={deletingEntryId === entry.id}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          </div>
        )}
      </div>

      {/* Featured Creators Sidebar */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-card rounded-2xl border border-border p-4 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Featured Creators</h2>
            <Button size="sm" variant="outline" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {isLoadingCreators ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : creators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No featured creators yet
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCreatorDragEnd}
            >
              <SortableContext
                items={creators.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {creators.map((creator) => (
                    <SortableCreatorRow
                      key={creator.id}
                      creator={creator}
                      onDelete={handleDeleteCreator}
                      isDeleting={deletingCreatorId === creator.id}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Add Entry Modal */}
      {isAddModalOpen && (
        <AddLeaderboardEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleEntryAdded}
          leaderboardType={activeTab}
          monthYear={activeTab === 'monthly' ? selectedMonth : undefined}
        />
      )}
    </div>
  )
}
