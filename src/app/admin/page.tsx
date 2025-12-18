'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Phone, Share2, FileBox, Users, ArrowRight } from 'lucide-react'

interface CampaignStats {
  emailCampaigns: number
  phoneTextScripts: number
  socialShareables: number
  directMail: number
  users: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      try {
        const [emailRes, phoneRes, socialRes, directMailRes, usersRes] = await Promise.all([
          supabase.from('email_campaigns').select('id', { count: 'exact', head: true }),
          supabase.from('phone_text_scripts').select('id', { count: 'exact', head: true }),
          supabase.from('social_shareables').select('id', { count: 'exact', head: true }),
          supabase.from('direct_mail_templates').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ])

        setStats({
          emailCampaigns: emailRes.count || 0,
          phoneTextScripts: phoneRes.count || 0,
          socialShareables: socialRes.count || 0,
          directMail: directMailRes.count || 0,
          users: usersRes.count || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const campaignCards = [
    {
      title: 'Email Campaigns',
      count: stats?.emailCampaigns || 0,
      href: '/admin/campaigns/email',
      icon: Mail,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    },
    {
      title: 'Phone & Text Scripts',
      count: stats?.phoneTextScripts || 0,
      href: '/admin/campaigns/phone-text-scripts',
      icon: Phone,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      title: 'Social Shareables',
      count: stats?.socialShareables || 0,
      href: '/admin/campaigns/social',
      icon: Share2,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    },
    {
      title: 'Direct Mail',
      count: stats?.directMail || 0,
      href: '/admin/campaigns/direct-mail',
      icon: FileBox,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to the Listing Leads CMS</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Campaign Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {campaignCards.map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.title} href={card.href}>
                  <Card className="hover:bg-accent transition-colors cursor-pointer group h-full">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-3xl font-light text-foreground mb-1">{card.count}</p>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Users Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/users">
              <Card className="hover:bg-accent transition-colors cursor-pointer group">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-light text-foreground">{stats?.users || 0}</p>
                      <p className="text-sm text-muted-foreground">Registered Users</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Tips */}
          <div className="mt-8 p-6 bg-background rounded-lg border border-border">
            <h2 className="font-medium text-foreground mb-4">Quick Tips</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use the sidebar to navigate between campaign types</li>
              <li>• Click on any campaign to edit its content</li>
              <li>• Set <strong>week_start_date</strong> and <strong>day_of_week</strong> to schedule campaigns</li>
              <li>• Mark campaigns as <strong>featured</strong> to highlight them</li>
              <li>• Set <strong>is_active</strong> to false to hide campaigns from users</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
