'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: Date;
  messageCount: number;
}

// Mock data - will be replaced with real data
const mockChats: Chat[] = [
  {
    id: '1',
    title: 'API NestJS JWT Authentication',
    lastMessage: 'Vou te ajudar a implementar autenticacao JWT...',
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    messageCount: 15,
  },
  {
    id: '2',
    title: 'Bug no React useEffect',
    lastMessage: 'O problema esta no array de dependencias...',
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    messageCount: 8,
  },
  {
    id: '3',
    title: 'Design System com Tailwind',
    lastMessage: 'Recomendo usar CVA para variantes...',
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    messageCount: 23,
  },
  {
    id: '4',
    title: 'Otimizacao de Performance',
    lastMessage: 'Use React.memo para componentes pesados...',
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    messageCount: 12,
  },
];

export function RecentChats() {
  if (mockChats.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-neutral-400" />
          Conversas Recentes
        </h2>
        <Link
          href="/history"
          className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
        >
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mockChats.map((chat, index) => (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <Link
              href={`/chat/${chat.id}`}
              className="block p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-xl hover:bg-neutral-800 hover:border-neutral-600 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center shrink-0 group-hover:bg-primary-500/20 transition-colors">
                  <MessageSquare className="w-5 h-5 text-neutral-400 group-hover:text-primary-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate group-hover:text-primary-400 transition-colors">
                    {chat.title}
                  </h3>
                  <p className="text-sm text-neutral-400 truncate mt-0.5">
                    {chat.lastMessage}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                    <span>{formatRelativeTime(chat.updatedAt)}</span>
                    <span>•</span>
                    <span>{chat.messageCount} mensagens</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
