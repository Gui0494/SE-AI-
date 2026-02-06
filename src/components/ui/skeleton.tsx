import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-800',
        className
      )}
    />
  );
}

export function ChatSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn('flex gap-4 px-4 py-6 md:px-8', i % 2 === 0 && 'bg-zinc-900/50')}>
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            {i % 2 === 0 && <Skeleton className="h-4 w-1/2" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="p-2 space-y-4">
      <div className="px-3 py-1">
        <Skeleton className="h-3 w-12" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="px-3 py-2">
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
      <div className="px-3 py-1 mt-4">
        <Skeleton className="h-3 w-16" />
      </div>
      {[1, 2].map((i) => (
        <div key={`old-${i}`} className="px-3 py-2">
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
