'use client';

import { useCallback } from 'react';
import { useChatStore } from '@/store/chat-store';
import { StreamChunk } from '@/lib/ai/types';

export function useChat() {
  const store = useChatStore();

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (!res.ok) throw new Error('Failed to load chats');
      const data = await res.json();
      store.setChats(data);
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to load chats');
    }
  }, [store]);

  const loadMessages = useCallback(
    async (chatId: string) => {
      try {
        store.setIsLoading(true);
        const res = await fetch(`/api/chat/${chatId}`);
        if (!res.ok) throw new Error('Failed to load messages');
        const data = await res.json();
        store.setMessages(data.messages || []);
        store.setCurrentChatId(chatId);
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to load messages');
      } finally {
        store.setIsLoading(false);
      }
    },
    [store]
  );

  const createChat = useCallback(
    async (model?: string) => {
      try {
        const res = await fetch('/api/chat/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model || store.selectedModel }),
        });
        if (!res.ok) throw new Error('Failed to create chat');
        const chat = await res.json();
        store.addChat(chat);
        store.setCurrentChatId(chat.id);
        store.setMessages([]);
        return chat.id;
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to create chat');
        return null;
      }
    },
    [store]
  );

  const sendMessage = useCallback(
    async (content: string, chatId?: string) => {
      const targetChatId = chatId || store.currentChatId;
      if (!targetChatId) {
        const newId = await createChat();
        if (!newId) return;
        return sendMessage(content, newId);
      }

      // Add user message optimistically
      const userMessage = {
        id: `temp-${Date.now()}`,
        role: 'user' as const,
        content,
        createdAt: new Date().toISOString(),
      };
      store.addMessage(userMessage);
      store.setIsStreaming(true);
      store.setStreamingContent('');
      store.setError(null);

      try {
        const res = await fetch(`/api/chat/${targetChatId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            model: store.selectedModel,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to send message');
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);

            try {
              const chunk: StreamChunk = JSON.parse(data);

              if (chunk.type === 'text' && chunk.content) {
                fullContent += chunk.content;
                store.setStreamingContent(fullContent);
              } else if (chunk.type === 'error') {
                store.setError(chunk.error || 'Streaming error');
              } else if (chunk.type === 'done') {
                // Streaming complete
              }
            } catch {
              // Skip malformed SSE data
            }
          }
        }

        // Add assistant message
        if (fullContent) {
          store.addMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            model: store.selectedModel,
            createdAt: new Date().toISOString(),
          });
        }

        // Refresh chat list to update titles
        loadChats();
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to send message');
      } finally {
        store.setIsStreaming(false);
        store.setStreamingContent('');
      }
    },
    [store, createChat, loadChats]
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        const res = await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete chat');
        store.removeChat(chatId);
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to delete chat');
      }
    },
    [store]
  );

  return {
    ...store,
    loadChats,
    loadMessages,
    createChat,
    sendMessage,
    deleteChat,
  };
}
