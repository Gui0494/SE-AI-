'use client';

import React, { useState, useEffect } from 'react';
import { MemoryManager } from '@/components/settings/memory-manager';
import { CreditCard, BarChart3, ArrowUpRight } from 'lucide-react';

interface UsageData {
  messagesUsed: number;
  tokensUsed: number;
  totalCost: number;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

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
            <div className="text-sm text-zinc-500">Loading...</div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full ${
                    usage?.plan === 'ENTERPRISE'
                      ? 'bg-purple-900/50 text-purple-400'
                      : usage?.plan === 'PRO'
                        ? 'bg-blue-900/50 text-blue-400'
                        : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {usage?.plan || 'FREE'}
                </span>
                <span className="text-sm text-zinc-500">
                  {usage?.status === 'ACTIVE'
                    ? 'Active'
                    : usage?.status === 'PAST_DUE'
                      ? 'Payment past due'
                      : usage?.status || 'Active'}
                </span>
                {usage?.currentPeriodEnd && (
                  <span className="text-xs text-zinc-600">
                    Next billing: {new Date(usage.currentPeriodEnd).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                {(!usage?.plan || usage.plan === 'FREE') && (
                  <>
                    <button
                      onClick={() => handleUpgrade('PRO')}
                      disabled={upgrading}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Upgrade to Pro <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpgrade('ENTERPRISE')}
                      disabled={upgrading}
                      className="flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Upgrade to Enterprise <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                {usage?.plan && usage.plan !== 'FREE' && (
                  <button
                    onClick={handleManageBilling}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    Manage Billing
                  </button>
                )}
              </div>
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
            <div className="text-sm text-zinc-500">Loading...</div>
          ) : (
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
