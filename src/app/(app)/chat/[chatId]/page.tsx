'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChatView } from '@/components/chat/chat-view';
import { useChat } from '@/hooks/use-chat';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const { loadMessages, currentChatId } = useChat();

  useEffect(() => {
    if (chatId && chatId !== currentChatId) {
      loadMessages(chatId);
    }
  }, [chatId, currentChatId, loadMessages]);

  return <ChatView />;
}
