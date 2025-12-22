'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Megaphone,
  Plus,
  Search,
  Building2,
  Star,
  ExternalLink,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Ad, AdCompany, AdTag } from '@/types/ad'

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [companies, setCompanies] = useState<AdCompany[]>([])
  const [tags, setTags] = useState<AdTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')

  useEffect(() => {
    Promise.all([fetchAds(), fetchCompanies(), fetchTags()])
  }, [])

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/ads?pageSize=500')
      const data = await response.json()
      if (data.ads) {
        setAds(data.ads)
      }
    } catch (error) {
      console.error('Failed to fetch ads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/ads/companies')
      const data = await response.json()
      if (Array.isArray(data)) setCompanies(data)
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/ads/tags')
      const data = await response.json()
      if (Array.isArray(data)) setTags(data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const filteredAds = ads.filter(ad => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      ad.name?.toLowerCase().includes(searchLower) ||
      ad.company?.name?.toLowerCase().includes(searchLower)

    const matchesChannel =
      channelFilter === 'all' || ad.channel === channelFilter

    const matchesCompany =
      companyFilter === 'all' || ad.company_id === companyFilter

    return matchesSearch && matchesChannel && matchesCompany
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ads</h1>
          <p className="text-muted-foreground">Manage ad creative library</p>
        </div>
        <Button asChild>
          <Link href="/admin/ads/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Ad
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="w-[140px]"
        >
          <option value="all">All Channels</option>
          <option value="meta">Meta</option>
          <option value="google">Google</option>
        </Select>

        <Select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="w-[180px]"
        >
          <option value="all">All Companies</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </Select>

        <span className="text-sm text-muted-foreground">
          {filteredAds.length} ad{filteredAds.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="text-center py-20">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No ads found</h3>
          <p className="text-muted-foreground mb-4">
            {ads.length === 0 ? 'Get started by adding your first ad' : 'Try adjusting your filters'}
          </p>
          {ads.length === 0 && (
            <Button asChild>
              <Link href="/admin/ads/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Ad
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Ad</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Channel</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Rating</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.map((ad) => (
                <tr key={ad.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {ad.image_url ? (
                        <img
                          src={ad.image_url}
                          alt={ad.name}
                          className="w-12 h-12 rounded object-cover bg-muted"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Megaphone className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">{ad.name}</p>
                        {ad.tags && ad.tags.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {ad.tags.map(t => t.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {ad.company?.icon_url ? (
                        <img
                          src={ad.company.icon_url}
                          alt={ad.company.name}
                          className="w-5 h-5 rounded object-contain bg-white"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="text-sm text-foreground">{ad.company?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      ad.channel === 'meta'
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    )}>
                      {ad.channel === 'meta' ? 'Meta' : 'Google'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {ad.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{ad.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({ad.rating_count})</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      ad.is_active
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    )}>
                      {ad.is_active ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/ads/${ad.id}`}>
                          Edit
                        </Link>
                      </Button>
                      {ad.image_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(ad.image_url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
