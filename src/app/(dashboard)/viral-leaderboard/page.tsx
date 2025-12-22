'use client'

import { Trophy } from 'lucide-react'

export default function ViralLeaderboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Viral Leaderboard</h1>
        <p className="text-muted-foreground">
          Coming soon! Track and compete with top-performing campaigns.
        </p>
      </div>
    </div>
  )
}
