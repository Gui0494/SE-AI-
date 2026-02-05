'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquarePlus,
  FolderOpen,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  Star,
  Archive,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarProps {
  user: {
    id: string;
    name?: string | null;
    image?: string | null;
    plan: string;
  };
}

interface ChatItem {
  id: string;
  title: string;
  updatedAt: Date;
  isPinned?: boolean;
}

// Mock data - will be replaced with real data
const mockChats: ChatItem[] = [
  { id: '1', title: 'API NestJS JWT Authentication', updatedAt: new Date(), isPinned: true },
  { id: '2', title: 'Bug no React useEffect', updatedAt: new Date(Date.now() - 86400000) },
  { id: '3', title: 'Design System Tailwind', updatedAt: new Date(Date.now() - 172800000) },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { href: '/projects', icon: FolderOpen, label: 'Projetos' },
    { href: '/settings', icon: Settings, label: 'Configuracoes' },
    { href: '/subscription', icon: CreditCard, label: user.plan === 'FREE' ? 'Upgrade Pro' : 'Assinatura' },
  ];

  const filteredChats = mockChats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedChats = {
    pinned: filteredChats.filter((c) => c.isPinned),
    today: filteredChats.filter(
      (c) =>
        !c.isPinned &&
        new Date(c.updatedAt).toDateString() === new Date().toDateString()
    ),
    yesterday: filteredChats.filter(
      (c) =>
        !c.isPinned &&
        new Date(c.updatedAt).toDateString() ===
          new Date(Date.now() - 86400000).toDateString()
    ),
    older: filteredChats.filter(
      (c) =>
        !c.isPinned &&
        new Date(c.updatedAt) < new Date(Date.now() - 172800000)
    ),
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 280 }}
        className={cn(
          'h-full flex flex-col border-r border-neutral-800 bg-neutral-900/50',
          'transition-all duration-300'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-lg">&#129504;</span>
              </div>
              <span className="font-semibold text-white">SE AI</span>
            </Link>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(isCollapsed && 'mx-auto')}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? 'Expandir' : 'Recolher'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/">
                <Button
                  className={cn('w-full', isCollapsed && 'px-0')}
                  leftIcon={<MessageSquarePlus className="w-4 h-4" />}
                >
                  {!isCollapsed && 'Novo Chat'}
                </Button>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">Novo Chat</TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {!isCollapsed && (
            <div className="px-3 space-y-4">
              {/* Pinned */}
              {groupedChats.pinned.length > 0 && (
                <ChatGroup
                  title="Fixados"
                  icon={<Star className="w-3 h-3" />}
                  chats={groupedChats.pinned}
                />
              )}

              {/* Today */}
              {groupedChats.today.length > 0 && (
                <ChatGroup
                  title="Hoje"
                  icon={<Clock className="w-3 h-3" />}
                  chats={groupedChats.today}
                />
              )}

              {/* Yesterday */}
              {groupedChats.yesterday.length > 0 && (
                <ChatGroup title="Ontem" chats={groupedChats.yesterday} />
              )}

              {/* Older */}
              {groupedChats.older.length > 0 && (
                <ChatGroup title="Anteriores" chats={groupedChats.older} />
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-neutral-800 p-3 space-y-1">
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    pathname === item.href
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800',
                    isCollapsed && 'justify-center px-0'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">{item.label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

function ChatGroup({
  title,
  icon,
  chats,
}: {
  title: string;
  icon?: React.ReactNode;
  chats: ChatItem[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-neutral-500 uppercase">
        {icon}
        {title}
      </div>
      <div className="space-y-0.5">
        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className="group flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <span className="flex-1 truncate">{chat.title}</span>
            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-700 rounded transition-all">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
