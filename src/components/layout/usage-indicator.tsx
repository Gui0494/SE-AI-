'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const PLAN_LIMITS: Record<string, number> = {
  FREE: 20,
  PRO: 500,
  ENTERPRISE: 10000,
};

export function UsageIndicator() {
  const [data, setData] = useState<{ messagesUsed: number; plan: string } | null>(null);

  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.json())
      .then((d) => setData({ messagesUsed: d.messagesUsed || 0, plan: d.plan || 'FREE' }))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const limit = PLAN_LIMITS[data.plan] || PLAN_LIMITS.FREE;
  const percent = Math.min(100, (data.messagesUsed / limit) * 100);

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-500">Messages</span>
        <span className="text-xs text-zinc-500 tabular-nums">
          {data.messagesUsed}/{limit}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            percent > 90 ? 'bg-red-500' :
            percent > 70 ? 'bg-yellow-500' :
            'bg-blue-500'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
