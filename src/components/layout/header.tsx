'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  Search,
  Bell,
  Settings,
  Moon,
  Sun,
  LogOut,
  User,
  CreditCard,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    plan: string;
  };
}

export function Header({ user }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  return (
    <TooltipProvider delayDuration={0}>
      <header className="h-14 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl flex items-center justify-between px-4">
        {/* Left side - could show current chat title */}
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Search className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Buscar (Ctrl+K)</TooltipContent>
          </Tooltip>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsDark(!isDark)}
              >
                {isDark ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isDark ? 'Modo claro' : 'Modo escuro'}
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notificacoes</TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/settings">
                <Button variant="ghost" size="icon-sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Configuracoes</TooltipContent>
          </Tooltip>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                <AvatarFallback>{getInitials(user.name || 'U')}</AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {/* User info */}
                  <div className="p-4 border-b border-neutral-700">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                        <AvatarFallback>{getInitials(user.name || 'U')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-sm text-neutral-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.plan === 'PRO'
                            ? 'bg-primary-500/20 text-primary-400'
                            : user.plan === 'ENTERPRISE'
                            ? 'bg-secondary-500/20 text-secondary-400'
                            : 'bg-neutral-700 text-neutral-400'
                        }`}
                      >
                        {user.plan === 'FREE' ? 'Free' : user.plan}
                      </span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    <DropdownItem href="/profile" icon={<User className="w-4 h-4" />}>
                      Meu Perfil
                    </DropdownItem>
                    <DropdownItem href="/settings" icon={<Settings className="w-4 h-4" />}>
                      Configuracoes
                    </DropdownItem>
                    <DropdownItem href="/subscription" icon={<CreditCard className="w-4 h-4" />}>
                      {user.plan === 'FREE' ? 'Upgrade para Pro' : 'Assinatura'}
                    </DropdownItem>
                    <DropdownItem href="/help" icon={<HelpCircle className="w-4 h-4" />}>
                      Ajuda
                    </DropdownItem>
                  </div>

                  {/* Logout */}
                  <div className="p-2 border-t border-neutral-700">
                    <button
                      onClick={() => signOut({ callbackUrl: '/auth/login' })}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}

function DropdownItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
