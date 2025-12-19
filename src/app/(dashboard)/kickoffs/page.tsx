'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Video, Calendar, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import type { KickoffHost, CampaignKickoff } from '@/types/kickoffs'

interface KickoffWithHosts extends CampaignKickoff {
  hosts: KickoffHost[]
  guests: KickoffHost[]
}

export default function KickoffsPage() {
  const [kickoffs, setKickoffs] = useState<KickoffWithHosts[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const fetchKickoffs = async () => {
      setIsLoading(true)

      // Fetch active kickoffs
      const { data: kickoffsData, error: kickoffsError } = await supabase
        .from('campaign_kickoffs')
        .select('*')
        .eq('is_active', true)
        .eq('is_draft', false)
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

    fetchKickoffs()
  }, [])

  const filteredKickoffs = useMemo(() => {
    if (!searchQuery) return kickoffs

    const query = searchQuery.toLowerCase()
    return kickoffs.filter(
      (kickoff) =>
        kickoff.name.toLowerCase().includes(query) ||
        kickoff.month?.toLowerCase().includes(query) ||
        kickoff.campaign_week_name?.toLowerCase().includes(query)
    )
  }, [kickoffs, searchQuery])

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return ''
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : null
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    if (endDate) {
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
    }
    return startDate.toLocaleDateString('en-US', options)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Video className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Campaign Kickoffs</h1>
          </div>
          <p className="text-muted-foreground">
            Weekly training sessions to help you launch and execute your campaigns effectively.
          </p>
        </div>

        {/* Search */}
        {!isLoading && kickoffs.length > 0 && (
          <div className="mb-6">
            <Input
              placeholder="Search kickoffs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredKickoffs.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {kickoffs.length === 0 ? 'No kickoffs available' : 'No matching kickoffs'}
              </h3>
              <p className="text-muted-foreground">
                {kickoffs.length === 0
                  ? 'Check back later for upcoming training sessions'
                  : 'Try adjusting your search'}
              </p>
            </div>
          </div>
        ) : (
          /* Kickoffs List */
          <div className="space-y-4">
            {filteredKickoffs.map((kickoff) => (
              <Link
                key={kickoff.id}
                href={`/kickoffs/${kickoff.slug}`}
                className="group block"
              >
                <div className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-primary/50 flex">
                  {/* Thumbnail */}
                  <div className="w-48 flex-shrink-0 bg-gradient-to-br from-orange-500 to-amber-500 relative flex items-center justify-center">
                    <Video className="w-10 h-10 text-white/80" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {kickoff.month && (
                          <Badge variant="secondary" className="text-xs">
                            {kickoff.month}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {kickoff.name}
                      </h3>
                      {kickoff.start_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDateRange(kickoff.start_date, kickoff.end_date)}</span>
                        </div>
                      )}
                    </div>

                    {/* Hosts */}
                    {(kickoff.hosts.length > 0 || kickoff.guests.length > 0) && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex -space-x-2">
                          {[...kickoff.hosts, ...kickoff.guests].slice(0, 4).map((host) => (
                            <div
                              key={host.id}
                              className="w-8 h-8 rounded-full border-2 border-card overflow-hidden"
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
                            <div className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs">
                              +{[...kickoff.hosts, ...kickoff.guests].length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
