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
  Eye,
  Star,
  ArrowUpDown
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
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export interface CampaignColumn {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface CampaignListProps {
  title: string
  description: string
  tableName: string
  columns: CampaignColumn[]
  basePath: string
  createPath: string
}

export function CampaignList({
  title,
  description,
  tableName,
  columns,
  basePath,
  createPath,
}: CampaignListProps) {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchCampaigns()
  }, [sortColumn, sortDirection])

  const fetchCampaigns = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(sortColumn, { ascending: sortDirection === 'asc' })
        .limit(100)

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) throw error
      setCampaigns(campaigns.filter(c => c.id !== id))
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      alert('Failed to delete campaign')
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

  const filteredCampaigns = campaigns.filter(campaign => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      campaign.name?.toLowerCase().includes(searchLower) ||
      campaign.title?.toLowerCase().includes(searchLower) ||
      campaign.slug?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Link href={createPath}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 bg-background rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No campaigns match your search' : 'No campaigns yet'}
          </p>
          {!searchQuery && (
            <Link href={createPath}>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create your first campaign
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {column.label}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id} className="group">
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(campaign[column.key], campaign)
                        : campaign[column.key] || '-'}
                    </TableCell>
                  ))}
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
                          onClick={() => router.push(`${basePath}/${campaign.id}/edit`)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`/campaigns/${tableName.replace('_', '-')}/${campaign.slug}`, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Live
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(campaign.id)}
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

// Helper components for common column renders
export function ThumbnailCell({ url, name }: { url?: string; name: string }) {
  return (
    <div className="flex items-center gap-3">
      {url ? (
        <img
          src={url}
          alt={name}
          className="w-10 h-10 rounded-md object-cover bg-muted"
        />
      ) : (
        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
          No img
        </div>
      )}
      <span className="font-medium truncate max-w-[200px]">{name}</span>
    </div>
  )
}

export function StatusCell({ isActive, isFeatured }: { isActive?: boolean; isFeatured?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
          isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        )}
      >
        {isActive ? 'Active' : 'Inactive'}
      </span>
      {isFeatured && (
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
      )}
    </div>
  )
}

export function DateCell({ date }: { date?: string }) {
  if (!date) return <span className="text-muted-foreground">-</span>
  return (
    <span className="text-sm text-muted-foreground">
      {new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </span>
  )
}
