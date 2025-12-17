import { Skeleton } from '@/components/ui/skeleton'

export function CampaignCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-muted/50 to-muted">
      {/* Thumbnail skeleton */}
      <div className="aspect-[4/3] relative">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>

      {/* Content skeleton */}
      <div className="px-4 pb-4 pt-1">
        {/* Category badge */}
        <Skeleton className="h-6 w-28 rounded-full" />

        {/* Title */}
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />
      </div>
    </div>
  )
}

interface CampaignGridSkeletonProps {
  count?: number
}

export function CampaignGridSkeleton({ count = 8 }: CampaignGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CampaignCardSkeleton key={i} />
      ))}
    </div>
  )
}
