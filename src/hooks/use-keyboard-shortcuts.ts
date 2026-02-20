'use client';

import { useEffect } from 'react';

interface ShortcutHandlers {
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onFocusInput: () => void;
}

/**
 * Global keyboard shortcuts:
 * - Ctrl/Cmd + Shift + O  → New chat
 * - Ctrl/Cmd + B          → Toggle sidebar
 * - Ctrl/Cmd + /          → Focus input
 */
export function useKeyboardShortcuts({
  onNewChat,
  onToggleSidebar,
  onFocusInput,
}: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.shiftKey && e.key === 'O') {
        e.preventDefault();
        onNewChat();
      } else if (e.key === 'b') {
        e.preventDefault();
        onToggleSidebar();
      } else if (e.key === '/') {
        e.preventDefault();
        onFocusInput();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onNewChat, onToggleSidebar, onFocusInput]);
}
