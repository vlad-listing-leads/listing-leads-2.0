'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, Trash2, MoreHorizontal, Video, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import type { CampaignKickoff, KickoffHost } from '@/types/kickoffs'

interface KickoffWithHosts extends CampaignKickoff {
  hosts: KickoffHost[]
  guests: KickoffHost[]
}

export default function AdminKickoffsPage() {
  const [kickoffs, setKickoffs] = useState<KickoffWithHosts[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  const fetchKickoffs = async () => {
    setIsLoading(true)

    // Fetch kickoffs
    const { data: kickoffsData, error: kickoffsError } = await supabase
      .from('campaign_kickoffs')
      .select('*')
      .order('start_date', { ascending: false })

    if (kickoffsError) {
      console.error('Error fetching kickoffs:', kickoffsError)
      setIsLoading(false)
      return
    }

    // Fetch all host assignments with host details
    const { data: assignments, error: assignmentsError } = await supabase
      .from('kickoff_host_assignments')
      .select(`
        kickoff_id,
        role,
        host:kickoff_hosts(*)
      `)

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
    }

    // Map hosts/guests to kickoffs
    const kickoffsWithHosts = kickoffsData.map((kickoff) => {
      const kickoffAssignments = assignments?.filter((a) => a.kickoff_id === kickoff.id) || []
      return {
        ...kickoff,
        hosts: kickoffAssignments
          .filter((a) => a.role === 'host')
          .map((a) => a.host as unknown as KickoffHost),
        guests: kickoffAssignments
          .filter((a) => a.role === 'guest')
          .map((a) => a.host as unknown as KickoffHost),
      }
    })

    setKickoffs(kickoffsWithHosts)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchKickoffs()
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    const { error } = await supabase
      .from('campaign_kickoffs')
      .delete()
      .eq('id', deleteId)

    if (error) {
      console.error('Error deleting kickoff:', error)
    } else {
      setKickoffs((prev) => prev.filter((k) => k.id !== deleteId))
    }

    setIsDeleting(false)
    setDeleteId(null)
  }

  const filteredKickoffs = kickoffs.filter((kickoff) =>
    kickoff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kickoff.month?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return '—'
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : null
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    if (endDate) {
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
    }
    return startDate.toLocaleDateString('en-US', options)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campaign Kickoffs</h1>
          <p className="text-muted-foreground mt-1">
            Manage weekly campaign kickoff sessions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/kickoffs/hosts">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Hosts
            </Button>
          </Link>
          <Link href="/admin/kickoffs/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Kickoff
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search kickoffs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredKickoffs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? 'No kickoffs found matching your search.' : 'No kickoffs yet.'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Kickoff</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Date Range</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Month</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Hosts</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredKickoffs.map((kickoff) => (
                <tr key={kickoff.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Video className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium line-clamp-1">{kickoff.name}</p>
                        <p className="text-sm text-muted-foreground">{kickoff.campaign_week_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDateRange(kickoff.start_date, kickoff.end_date)}
                  </td>
                  <td className="px-4 py-3 text-sm">{kickoff.month || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-2">
                      {[...kickoff.hosts, ...kickoff.guests].slice(0, 4).map((host) => (
                        <div
                          key={host.id}
                          className="w-8 h-8 rounded-full border-2 border-background overflow-hidden"
                          title={host.name}
                        >
                          {host.avatar_url ? (
                            <Image
                              src={host.avatar_url}
                              alt={host.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-medium">
                              {host.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      ))}
                      {[...kickoff.hosts, ...kickoff.guests].length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">
                          +{[...kickoff.hosts, ...kickoff.guests].length - 4}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {kickoff.is_draft ? (
                      <Badge variant="secondary">Draft</Badge>
                    ) : kickoff.is_active ? (
                      <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/kickoffs/${kickoff.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/kickoffs/${kickoff.slug}`} target="_blank">
                            <Video className="h-4 w-4 mr-2" />
                            View Live
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(kickoff.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Kickoff</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this kickoff? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
