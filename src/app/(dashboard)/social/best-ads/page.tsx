'use client'

import { Megaphone } from 'lucide-react'

export default function BestAdsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Megaphone className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Best Ads</h1>
        <p className="text-muted-foreground">
          Coming soon! Curated collection of the best performing ads.
        </p>
      </div>
    </div>
  )
}
