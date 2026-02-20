'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, MessageSquare, BarChart3, DollarSign, Activity, Search } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  activeUsersToday: number;
  messagesLast24h: number;
  messagesLast7d: number;
  planDistribution: Record<string, number>;
  topModels: { model: string; count: number }[];
  revenueTotal: number;
  signupsLast7d: number;
}

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  emailVerified: string | null;
  createdAt: string;
  plan: string;
  messagesUsed: number;
  totalCost: number;
  chatCount: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-100 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(async (r) => {
        if (r.status === 403) { router.push('/'); return null; }
        if (!r.ok) throw new Error('Failed to load stats');
        return r.json();
      }),
      fetch('/api/admin/users').then(async (r) => {
        if (!r.ok) throw new Error('Failed to load users');
        return r.json();
      }),
    ])
      .then(([statsData, usersData]) => {
        if (statsData) setStats(statsData);
        if (usersData) {
          setUsers(usersData.users);
          setUsersTotal(usersData.total);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSearch = async () => {
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setUsers(data.users);
      setUsersTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-100 mb-6">Admin Dashboard</h1>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub={`+${stats.signupsLast7d} last 7d`} />
            <StatCard icon={MessageSquare} label="Total Messages" value={stats.totalMessages.toLocaleString()} sub={`${stats.messagesLast24h} last 24h`} />
            <StatCard icon={Activity} label="Active Today" value={stats.activeUsersToday} />
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${stats.revenueTotal.toFixed(2)}`} />
          </div>
        )}

        {/* Plan Distribution + Top Models */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Plan Distribution</h3>
              <div className="space-y-2">
                {Object.entries(stats.planDistribution).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{plan}</span>
                    <span className="text-sm font-medium text-zinc-200 tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Top Models</h3>
              <div className="space-y-2">
                {stats.topModels.map((m) => (
                  <div key={m.model} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400 truncate">{m.model}</span>
                    <span className="text-sm font-medium text-zinc-200 tabular-nums">{m.count}</span>
                  </div>
                ))}
                {stats.topModels.length === 0 && (
                  <p className="text-sm text-zinc-600">No messages yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-300">
              Users ({usersTotal})
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by email or name..."
                  className="pl-9 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 w-64"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-right px-4 py-3">Messages</th>
                  <th className="text-right px-4 py-3">Chats</th>
                  <th className="text-right px-4 py-3">Cost</th>
                  <th className="text-left px-4 py-3">Verified</th>
                  <th className="text-left px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-zinc-200">{u.name || '—'}</p>
                        <p className="text-zinc-500 text-xs">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        u.plan === 'ENTERPRISE' ? 'bg-purple-900/50 text-purple-400' :
                        u.plan === 'PRO' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{u.messagesUsed}</td>
                    <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{u.chatCount}</td>
                    <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">${u.totalCost.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={u.emailVerified ? 'text-emerald-400' : 'text-zinc-600'}>
                        {u.emailVerified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-600">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
