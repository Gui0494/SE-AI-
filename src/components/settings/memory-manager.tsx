'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Memory {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  personal: 'bg-blue-900/50 text-blue-400',
  preferences: 'bg-purple-900/50 text-purple-400',
  work: 'bg-amber-900/50 text-amber-400',
  technical: 'bg-emerald-900/50 text-emerald-400',
  projects: 'bg-pink-900/50 text-pink-400',
  general: 'bg-zinc-800 text-zinc-400',
};

export function MemoryManager() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [error, setError] = useState<string | null>(null);

  const loadMemories = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/memory');
      if (!res.ok) throw new Error('Failed to load memories');
      const data = await res.json();
      setMemories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) return;

    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newKey.trim().toLowerCase().replace(/\s+/g, '_'),
          value: newValue.trim(),
          category: newCategory,
        }),
      });
      if (!res.ok) throw new Error('Failed to save memory');

      setNewKey('');
      setNewValue('');
      setNewCategory('general');
      setShowAddForm(false);
      loadMemories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save memory');
    }
  };

  const handleDelete = async (memoryId: string) => {
    try {
      const res = await fetch('/api/memory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId }),
      });
      if (!res.ok) throw new Error('Failed to delete memory');
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-zinc-200">Memories</h3>
          <span className="text-xs text-zinc-500">({memories.length})</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'Add'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-300 hover:text-red-200">
            Dismiss
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Key (e.g., favorite_language)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <textarea
            placeholder="Value (e.g., Prefers TypeScript over JavaScript)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:border-blue-500"
            rows={2}
          />
          <div className="flex items-center gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              <option value="general">General</option>
              <option value="personal">Personal</option>
              <option value="preferences">Preferences</option>
              <option value="work">Work</option>
              <option value="technical">Technical</option>
              <option value="projects">Projects</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={!newKey.trim() || !newValue.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save Memory
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        SE AI automatically remembers facts about you from conversations. You can also add memories manually.
      </p>

      {isLoading ? (
        <div className="text-sm text-zinc-500 text-center py-8">Loading memories...</div>
      ) : memories.length === 0 ? (
        <div className="text-sm text-zinc-500 text-center py-8">
          No memories yet. As you chat, SE AI will learn about your preferences.
        </div>
      ) : (
        <div className="space-y-2">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="group flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded font-medium',
                      CATEGORY_COLORS[memory.category] || CATEGORY_COLORS.general
                    )}
                  >
                    {memory.category}
                  </span>
                  <span className="text-xs text-zinc-600 font-mono">{memory.key}</span>
                </div>
                <p className="text-sm text-zinc-300">{memory.value}</p>
              </div>
              <button
                onClick={() => handleDelete(memory.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all"
                aria-label="Delete memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
