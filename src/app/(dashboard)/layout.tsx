'use client'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar, GlobalSearch } from '@/components/campaigns'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        {/* Global Header with Search */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 flex-shrink-0 gap-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1 flex justify-center">
            <GlobalSearch />
          </div>
          <div className="w-8" /> {/* Spacer for balance */}
        </header>
        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
