'use client'

import { useState } from 'react'
import {
  Calendar,
  Trophy,
  FileEdit,
  Sparkles,
  FileText,
  Rocket,
  Phone,
  Mail,
  FileBox,
  Share2,
  Megaphone,
  Instagram,
  Youtube,
  ChevronLeft,
  ChevronRight,
  Heart,
  Search,
  HelpCircle,
  User
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// Types
interface CampaignItem {
  id: string
  title: string
  category: 'social-shareables' | 'email-campaigns' | 'phone-text-scripts' | 'direct-mail'
  thumbnail: string
  day: number // 0-4 for Mon-Fri
}

interface WeekData {
  startDate: Date
  items: CampaignItem[]
  isCurrentWeek?: boolean
}

// Sidebar navigation items
const sidebarItems = [
  { icon: Calendar, label: 'Listing Attraction Plan', href: '/listing-attraction-plan', active: true },
  { icon: Trophy, label: 'Viral Leaderboard', href: '/viral-leaderboard' },
  { icon: FileEdit, label: 'Expired Editor', href: '/expired-editor' },
  { icon: Sparkles, label: 'AI Mode', href: '/ai-mode' },
  { icon: FileText, label: 'Blueprints', href: '/blueprints' },
  { icon: Rocket, label: 'Campaign Kickoff', href: '/campaign-kickoff' },
]

const campaignItems = [
  { icon: Phone, label: 'Phone & Text Scripts', href: '/phone-text-scripts' },
  { icon: Mail, label: 'Email Campaigns', href: '/email-campaigns' },
  { icon: FileBox, label: 'Direct Mail Templates', href: '/direct-mail' },
  { icon: Share2, label: 'Social Shareables', href: '/social-shareables' },
]

const socialItems = [
  { icon: Megaphone, label: 'Best Ads', href: '/best-ads' },
  { icon: Instagram, label: 'Best Instagram Reels', href: '/best-instagram-reels' },
  { icon: Youtube, label: 'Best Youtube Videos', href: '/best-youtube-videos' },
]

// Category config
const categoryConfig = {
  'social-shareables': { label: 'Social Shareables', color: 'bg-purple-100 text-purple-700' },
  'email-campaigns': { label: 'Email Campaigns', color: 'bg-blue-100 text-blue-700' },
  'phone-text-scripts': { label: 'Phone & Text Scripts', color: 'bg-green-100 text-green-700' },
  'direct-mail': { label: 'Direct Mail Templates', color: 'bg-orange-100 text-orange-700' },
}

// Mock data for demo
const generateMockWeekData = (startDate: Date, isCurrentWeek: boolean = false): WeekData => {
  const mockTitles = {
    'social-shareables': ['Deal of the Week: AirDrop', 'The Ultimate Lead Gen IG Story Series', 'Why Clients Choose [Your Team]...'],
    'email-campaigns': ['Stuck?', 'Deal of the Week: You know what\'s...', 'Market Insights Newsletter'],
    'phone-text-scripts': ['Market Update Text', 'New Listing Alert Script', 'Follow-up Call Script'],
    'direct-mail': ['Just Listed Postcard', 'Market Report Mailer', 'Neighborhood Update'],
  }

  const items: CampaignItem[] = [
    { id: '1', title: mockTitles['social-shareables'][0], category: 'social-shareables', thumbnail: '/preview.png', day: 0 },
    { id: '2', title: mockTitles['email-campaigns'][0], category: 'email-campaigns', thumbnail: '/preview.png', day: 0 },
    { id: '3', title: mockTitles['email-campaigns'][1], category: 'email-campaigns', thumbnail: '/preview.png', day: 1 },
    { id: '4', title: mockTitles['phone-text-scripts'][0], category: 'phone-text-scripts', thumbnail: '/preview.png', day: 2 },
    { id: '5', title: mockTitles['social-shareables'][1], category: 'social-shareables', thumbnail: '/preview.png', day: 3 },
    { id: '6', title: mockTitles['social-shareables'][2], category: 'social-shareables', thumbnail: '/preview.png', day: 4 },
  ]

  return { startDate, items, isCurrentWeek }
}

// Get week dates
const getWeekDates = (startDate: Date) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const dates = []

  for (let i = 0; i < 5; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push({
      dayName: days[i],
      dayShort: days[i].slice(0, 3),
      date: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      full: date,
    })
  }

  return dates
}

// Format week range
const formatWeekRange = (startDate: Date) => {
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 4)

  const startMonth = startDate.toLocaleString('default', { month: 'short' })
  const endMonth = endDate.toLocaleString('default', { month: 'short' })

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}`
  }
  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`
}

// Campaign Card Component
function CampaignCard({ item }: { item: CampaignItem }) {
  const config = categoryConfig[item.category]

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer">
      <div className="aspect-[4/3] relative bg-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="w-3/4 h-3/4 bg-white rounded-lg shadow-sm flex items-center justify-center">
            <span className="text-gray-400 text-sm">Preview</span>
          </div>
        </div>
        <button className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
          <Heart className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="p-3">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.color)}>
          {config.label}
        </span>
        <h4 className="mt-2 text-sm font-medium text-gray-900 line-clamp-2">
          {item.title}
        </h4>
      </div>
    </div>
  )
}

// Week Section Component
function WeekSection({ weekData }: { weekData: WeekData }) {
  const dates = getWeekDates(weekData.startDate)
  const weekRange = formatWeekRange(weekData.startDate)

  return (
    <div className="mb-10">
      {/* Week Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">{weekRange}</h3>
        </div>
        {weekData.isCurrentWeek && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            This Week
          </span>
        )}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-5 gap-4">
        {dates.map((day, index) => (
          <div key={day.dayName} className="min-w-0">
            {/* Day Header */}
            <div className="mb-3">
              <p className="text-sm text-gray-500">{day.dayName}</p>
              <p className="text-sm font-medium text-gray-900">{day.month} {day.date}</p>
            </div>

            {/* Campaign Cards for this day */}
            <div className="space-y-3">
              {weekData.items
                .filter(item => item.day === index)
                .map(item => (
                  <CampaignCard key={item.id} item={item} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Sidebar Link Component
function SidebarLink({
  icon: Icon,
  label,
  href,
  active = false
}: {
  icon: React.ElementType
  label: string
  href: string
  active?: boolean
}) {
  return (
    <a
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <Icon className="w-5 h-5" />
      {label}
    </a>
  )
}

export default function ListingAttractionPlanPage() {
  // Generate mock weeks
  const today = new Date()
  const currentMonday = new Date(today)
  currentMonday.setDate(today.getDate() - today.getDay() + 1) // Get Monday of current week

  const lastMonday = new Date(currentMonday)
  lastMonday.setDate(currentMonday.getDate() - 7)

  const weeks = [
    generateMockWeekData(currentMonday, true),
    generateMockWeekData(lastMonday, false),
  ]

  return (
    <div className="flex min-h-screen -mx-6 -my-8 bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LL</span>
            </div>
            <span className="font-semibold text-gray-900">Listing Leads</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map(item => (
            <SidebarLink key={item.label} {...item} />
          ))}

          {/* Campaigns Section */}
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Campaigns
            </p>
            {campaignItems.map(item => (
              <SidebarLink key={item.label} {...item} />
            ))}
          </div>

          {/* Social Section */}
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Social
            </p>
            {socialItems.map(item => (
              <SidebarLink key={item.label} {...item} />
            ))}
          </div>
        </nav>

        {/* Bottom section with preview thumbnail */}
        <div className="p-3 border-t border-gray-100">
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-8 h-8 mx-auto mb-1 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-sm">LL</span>
                </div>
                <p className="text-xs opacity-90">Marketing Genius</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-sm font-medium text-gray-600">Listing Attraction Plan</h1>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Listing Leads"
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Page Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Listing Attraction Plan</h1>
              <p className="text-gray-600">
                Here's your weekly marketing plan to help you get listings now and build your pipeline for the future.
              </p>
            </div>

            {/* Region Selector */}
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-lg">🇺🇸</span>
              <span className="text-sm font-medium text-gray-700">US</span>
            </button>
          </div>

          {/* Week Sections */}
          {weeks.map((week, index) => (
            <WeekSection key={index} weekData={week} />
          ))}
        </main>
      </div>
    </div>
  )
}
