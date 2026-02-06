'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { useChat } from '@/hooks/use-chat';
import { ToastProvider } from '@/components/ui/toast';
import { WelcomeModal } from '@/components/onboarding/welcome-modal';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    chats,
    currentChatId,
    sidebarOpen,
    setSidebarOpen,
    loadChats,
    loadMessages,
    createChat,
    deleteChat,
  } = useChat();

  const [sidebarLoading, setSidebarLoading] = useState(true);

  useEffect(() => {
    loadChats().finally(() => setSidebarLoading(false));
  }, [loadChats]);

  const handleSelectChat = (id: string) => {
    loadMessages(id);
  };

  const handleNewChat = async () => {
    await createChat();
  };

  const handleFocusInput = useCallback(() => {
    const textarea = document.querySelector('textarea');
    textarea?.focus();
  }, []);

  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onToggleSidebar: () => setSidebarOpen(!sidebarOpen),
    onFocusInput: handleFocusInput,
  });

  return (
    <ToastProvider>
      <div className="flex h-screen bg-zinc-950 text-zinc-200">
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          isOpen={sidebarOpen}
          loading={sidebarLoading}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={deleteChat}
        />
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </div>
      <WelcomeModal />
    </ToastProvider>
  );
}
