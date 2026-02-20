'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, X } from 'lucide-react';

interface UpgradePromptProps {
  onDismiss: () => void;
}

export function UpgradePrompt({ onDismiss }: UpgradePromptProps) {
  return (
    <div className="mx-4 my-3 p-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/50 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-600/20 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-200 mb-1">
            You&apos;ve reached your message limit
          </h3>
          <p className="text-xs text-amber-300/70 mb-3">
            Upgrade your plan to continue chatting with higher limits, access premium models, and unlock advanced tools.
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade Plan
            </Link>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs text-amber-300/70 hover:text-amber-200 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-amber-400/50 hover:text-amber-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
