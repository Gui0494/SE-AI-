'use client';

import React, { useState, useEffect } from 'react';
import { MemoryManager } from '@/components/settings/memory-manager';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, BarChart3, ArrowUpRight, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageData {
  messagesUsed: number;
  tokensUsed: number;
  totalCost: number;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

const PLAN_LIMITS: Record<string, { messages: number; label: string }> = {
  FREE: { messages: 50, label: 'Free' },
  PRO: { messages: 1000, label: 'Pro' },
  ENTERPRISE: { messages: 10000, label: 'Enterprise' },
};

const PLAN_FEATURES: Record<string, string[]> = {
  FREE: ['50 messages/month', 'Basic models', 'Web search tool'],
  PRO: ['1,000 messages/month', 'All models including GPT-4.1 & Claude', 'All tools', 'Memory system', 'File uploads'],
  ENTERPRISE: ['10,000 messages/month', 'All Pro features', 'Priority support', 'Custom system prompts'],
};

export default function SettingsPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetch('/api/usage')
      .then((res) => res.json())
      .then(setUsage)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleUpgrade = async (plan: 'PRO' | 'ENTERPRISE') => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Billing portal error:', err);
    }
  };

  const planKey = usage?.plan || 'FREE';
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.FREE;
  const messagesPercent = Math.min(100, ((usage?.messagesUsed || 0) / limits.messages) * 100);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-zinc-200">Settings</h1>

        {/* Plan Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-zinc-200">Plan</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-64" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'text-sm font-bold px-3 py-1 rounded-full',
                    planKey === 'ENTERPRISE' ? 'bg-purple-900/50 text-purple-400' :
                    planKey === 'PRO' ? 'bg-blue-900/50 text-blue-400' :
                    'bg-zinc-800 text-zinc-400'
                  )}
                >
                  {limits.label}
                </span>
                <span className="text-sm text-zinc-500">
                  {usage?.status === 'ACTIVE' ? 'Active' :
                   usage?.status === 'PAST_DUE' ? 'Payment past due' :
                   usage?.status || 'Active'}
                </span>
                {usage?.currentPeriodEnd && (
                  <span className="text-xs text-zinc-600">
                    Renews {new Date(usage.currentPeriodEnd).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Plan comparison cards for free users */}
              {planKey === 'FREE' && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-zinc-800/50 border border-blue-800/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-sm text-zinc-200">Pro</span>
                    </div>
                    <ul className="space-y-1">
                      {PLAN_FEATURES.PRO.map((f) => (
                        <li key={f} className="text-xs text-zinc-400 flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-blue-400 rounded-full flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleUpgrade('PRO')}
                      disabled={upgrading}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Upgrade <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="bg-zinc-800/50 border border-purple-800/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-sm text-zinc-200">Enterprise</span>
                    </div>
                    <ul className="space-y-1">
                      {PLAN_FEATURES.ENTERPRISE.map((f) => (
                        <li key={f} className="text-xs text-zinc-400 flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-purple-400 rounded-full flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleUpgrade('ENTERPRISE')}
                      disabled={upgrading}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Upgrade <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {planKey !== 'FREE' && (
                <button
                  onClick={handleManageBilling}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Manage Billing
                </button>
              )}
            </>
          )}
        </section>

        {/* Usage Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-zinc-200">Usage</h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </div>
          ) : (
            <>
              {/* Message usage progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Messages this period</span>
                  <span className="text-zinc-300">
                    {(usage?.messagesUsed || 0).toLocaleString()} / {limits.messages.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      messagesPercent > 90 ? 'bg-red-500' :
                      messagesPercent > 70 ? 'bg-yellow-500' :
                      'bg-emerald-500'
                    )}
                    style={{ width: `${messagesPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-1">Messages</p>
                  <p className="text-xl font-bold text-zinc-200">
                    {usage?.messagesUsed?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-1">Tokens</p>
                  <p className="text-xl font-bold text-zinc-200">
                    {usage?.tokensUsed?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-1">Total Cost</p>
                  <p className="text-xl font-bold text-zinc-200">
                    ${usage?.totalCost?.toFixed(4) || '0.00'}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Memories Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <MemoryManager />
        </section>
      </div>
    </div>
  );
}
