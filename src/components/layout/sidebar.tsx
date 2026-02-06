'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageSquarePlus,
  Trash2,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Brain,
} from 'lucide-react';
import { cn, groupChatsByDate } from '@/lib/utils';

interface Chat {
  id: string;
  title: string;
  model: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export function Sidebar({
  chats,
  currentChatId,
  isOpen,
  onToggle,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}: SidebarProps) {
  const grouped = groupChatsByDate(chats);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        aria-label="Open sidebar"
      >
        <PanelLeft className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside className="w-72 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-zinc-200">SE AI</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewChat}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="New chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {grouped.length === 0 && (
          <p className="text-sm text-zinc-500 text-center mt-8 px-4">
            No conversations yet. Start a new chat!
          </p>
        )}
        {grouped.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="px-3 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {group.label}
            </div>
            {group.chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                  chat.id === currentChatId
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                )}
                onClick={() => onSelectChat(chat.id)}
              >
                <span className="flex-1 text-sm truncate">{chat.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                  aria-label="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-3 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
