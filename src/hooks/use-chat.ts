'use client';

import { useCallback, useRef } from 'react';
import { useChatStore } from '@/store/chat-store';
import { StreamChunk } from '@/lib/ai/types';

export function useChat() {
  // Use individual selectors to avoid infinite re-render (Bug 8 fix)
  const chats = useChatStore((s) => s.chats);
  const currentChatId = useChatStore((s) => s.currentChatId);
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const selectedModel = useChatStore((s) => s.selectedModel);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const error = useChatStore((s) => s.error);
  const toolActivity = useChatStore((s) => s.toolActivity);

  const setChats = useChatStore((s) => s.setChats);
  const addChat = useChatStore((s) => s.addChat);
  const removeChat = useChatStore((s) => s.removeChat);
  const setCurrentChatId = useChatStore((s) => s.setCurrentChatId);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const setIsLoading = useChatStore((s) => s.setIsLoading);
  const setIsStreaming = useChatStore((s) => s.setIsStreaming);
  const setStreamingContent = useChatStore((s) => s.setStreamingContent);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const setError = useChatStore((s) => s.setError);
  const setToolActivity = useChatStore((s) => s.setToolActivity);

  // Use ref for selectedModel inside callbacks to avoid stale closures
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;

  const currentChatIdRef = useRef(currentChatId);
  currentChatIdRef.current = currentChatId;

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (!res.ok) throw new Error('Failed to load chats');
      const data = await res.json();
      setChats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    }
  }, [setChats, setError]);

  const loadMessages = useCallback(
    async (chatId: string) => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/chat/${chatId}`);
        if (!res.ok) throw new Error('Failed to load messages');
        const data = await res.json();
        setMessages(data.messages || []);
        setCurrentChatId(chatId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setMessages, setCurrentChatId, setError]
  );

  const createChat = useCallback(
    async (model?: string) => {
      try {
        const res = await fetch('/api/chat/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model || selectedModelRef.current }),
        });
        if (!res.ok) throw new Error('Failed to create chat');
        const chat = await res.json();
        addChat(chat);
        setCurrentChatId(chat.id);
        setMessages([]);
        return chat.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create chat');
        return null;
      }
    },
    [addChat, setCurrentChatId, setMessages, setError]
  );

  const sendMessage = useCallback(
    async (content: string, chatId?: string) => {
      const targetChatId = chatId || currentChatIdRef.current;
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
      addMessage(userMessage);
      setIsStreaming(true);
      setStreamingContent('');
      setToolActivity(null);
      setError(null);

      try {
        const res = await fetch(`/api/chat/${targetChatId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            model: selectedModelRef.current,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep incomplete last line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);

            try {
              const chunk: StreamChunk = JSON.parse(data);

              if (chunk.type === 'text' && chunk.content) {
                fullContent += chunk.content;
                setStreamingContent(fullContent);
              } else if (chunk.type === 'tool_call' && chunk.toolCall) {
                // Show tool activity in the UI (Bug 9 fix)
                setToolActivity(`Using tool: ${chunk.toolCall.function.name}...`);
              } else if (chunk.type === 'tool_result' && chunk.toolResult) {
                setToolActivity(
                  chunk.toolResult.isError
                    ? `Tool error: ${chunk.toolResult.content.substring(0, 100)}`
                    : `Tool result received`
                );
              } else if (chunk.type === 'error') {
                setError(chunk.error || 'Streaming error');
              } else if (chunk.type === 'done') {
                setToolActivity(null);
              }
            } catch {
              // Skip malformed SSE data
            }
          }
        }

        // Add assistant message
        if (fullContent) {
          addMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            model: selectedModelRef.current,
            createdAt: new Date().toISOString(),
          });
        }

        // Refresh chat list to update titles
        loadChats();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
        setToolActivity(null);
      }
    },
    [createChat, loadChats, addMessage, setIsStreaming, setStreamingContent, setToolActivity, setError]
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        const res = await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete chat');
        removeChat(chatId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete chat');
      }
    },
    [removeChat, setError]
  );

  return {
    chats,
    currentChatId,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    selectedModel,
    sidebarOpen,
    error,
    toolActivity,
    setChats,
    addChat,
    removeChat,
    setCurrentChatId,
    setMessages,
    addMessage,
    setIsLoading,
    setIsStreaming,
    setStreamingContent,
    setSelectedModel,
    setSidebarOpen,
    setError,
    setToolActivity,
    loadChats,
    loadMessages,
    createChat,
    sendMessage,
    deleteChat,
  };
}
