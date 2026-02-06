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
  const branches = useChatStore((s) => s.branches);
  const activeBranch = useChatStore((s) => s.activeBranch);

  const setChats = useChatStore((s) => s.setChats);
  const addChat = useChatStore((s) => s.addChat);
  const removeChat = useChatStore((s) => s.removeChat);
  const setCurrentChatId = useChatStore((s) => s.setCurrentChatId);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const replaceMessage = useChatStore((s) => s.replaceMessage);
  const setIsLoading = useChatStore((s) => s.setIsLoading);
  const setIsStreaming = useChatStore((s) => s.setIsStreaming);
  const setStreamingContent = useChatStore((s) => s.setStreamingContent);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const setError = useChatStore((s) => s.setError);
  const setToolActivity = useChatStore((s) => s.setToolActivity);
  const setBranches = useChatStore((s) => s.setBranches);
  const setActiveBranch = useChatStore((s) => s.setActiveBranch);
  const updateChatShareId = useChatStore((s) => s.updateChatShareId);

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

  // Helper to consume an SSE stream and return the full content
  const consumeSSEStream = useCallback(
    async (res: Response): Promise<string> => {
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
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const chunk: StreamChunk = JSON.parse(line.slice(6));
            if (chunk.type === 'text' && chunk.content) {
              fullContent += chunk.content;
              setStreamingContent(fullContent);
            } else if (chunk.type === 'tool_call' && chunk.toolCall) {
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
      return fullContent;
    },
    [setStreamingContent, setToolActivity, setError]
  );

  const sendMessage = useCallback(
    async (content: string, chatId?: string) => {
      const targetChatId = chatId || currentChatIdRef.current;
      if (!targetChatId) {
        const newId = await createChat();
        if (!newId) return;
        return sendMessage(content, newId);
      }

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

        const fullContent = await consumeSSEStream(res);

        if (fullContent) {
          addMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            model: selectedModelRef.current,
            createdAt: new Date().toISOString(),
          });
        }

        loadChats();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
        setToolActivity(null);
      }
    },
    [createChat, loadChats, addMessage, setIsStreaming, setStreamingContent, setToolActivity, setError, consumeSSEStream]
  );

  const regenerateMessage = useCallback(
    async (messageId: string) => {
      const chatId = currentChatIdRef.current;
      if (!chatId) return;

      setIsStreaming(true);
      setStreamingContent('');
      setToolActivity(null);
      setError(null);

      try {
        const res = await fetch(`/api/chat/${chatId}/regenerate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Regeneration failed');
        }

        const fullContent = await consumeSSEStream(res);

        if (fullContent) {
          replaceMessage(messageId, {
            id: `regen-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            model: selectedModelRef.current,
            parentId: messageId,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Regeneration failed');
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
        setToolActivity(null);
      }
    },
    [replaceMessage, setIsStreaming, setStreamingContent, setToolActivity, setError, consumeSSEStream]
  );

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const chatId = currentChatIdRef.current;
      if (!chatId) return;

      setIsStreaming(true);
      setStreamingContent('');
      setToolActivity(null);
      setError(null);

      try {
        const res = await fetch(`/api/chat/${chatId}/edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, newContent }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Edit failed');
        }

        // Replace the user message in the message list
        const currentMessages = useChatStore.getState().messages;
        const editIdx = currentMessages.findIndex((m) => m.id === messageId);
        const keptMessages = editIdx >= 0 ? currentMessages.slice(0, editIdx) : currentMessages;

        // Add the edited user message
        keptMessages.push({
          id: `edit-${Date.now()}`,
          role: 'user',
          content: newContent,
          parentId: messageId,
          createdAt: new Date().toISOString(),
        });
        setMessages(keptMessages);

        const fullContent = await consumeSSEStream(res);

        if (fullContent) {
          addMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            model: selectedModelRef.current,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Edit failed');
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
        setToolActivity(null);
      }
    },
    [addMessage, setMessages, setIsStreaming, setStreamingContent, setToolActivity, setError, consumeSSEStream]
  );

  const loadBranches = useCallback(
    async (messageId: string) => {
      const chatId = currentChatIdRef.current;
      if (!chatId) return;

      try {
        const res = await fetch(`/api/chat/${chatId}/branches?messageId=${messageId}`);
        if (!res.ok) throw new Error('Failed to load branches');
        const data = await res.json();
        setBranches(messageId, data.branches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load branches');
      }
    },
    [setBranches, setError]
  );

  const shareChat = useCallback(
    async (chatId: string) => {
      try {
        const res = await fetch(`/api/chat/${chatId}/share`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to share chat');
        const data = await res.json();
        updateChatShareId(chatId, data.shareId);
        return data.shareUrl as string;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to share chat');
        return null;
      }
    },
    [updateChatShareId, setError]
  );

  const unshareChat = useCallback(
    async (chatId: string) => {
      try {
        const res = await fetch(`/api/chat/${chatId}/share`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to unshare chat');
        updateChatShareId(chatId, null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to unshare chat');
      }
    },
    [updateChatShareId, setError]
  );

  const exportChat = useCallback(
    async (chatId: string, format: 'md' | 'json' | 'txt' = 'md') => {
      try {
        const res = await fetch(`/api/chat/${chatId}/export?format=${format}`);
        if (!res.ok) throw new Error('Export failed');

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || `chat.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
      }
    },
    [setError]
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
    branches,
    activeBranch,
    setChats,
    addChat,
    removeChat,
    setCurrentChatId,
    setMessages,
    addMessage,
    replaceMessage,
    setIsLoading,
    setIsStreaming,
    setStreamingContent,
    setSelectedModel,
    setSidebarOpen,
    setError,
    setToolActivity,
    setBranches,
    setActiveBranch,
    updateChatShareId,
    loadChats,
    loadMessages,
    createChat,
    sendMessage,
    regenerateMessage,
    editMessage,
    loadBranches,
    shareChat,
    unshareChat,
    exportChat,
    deleteChat,
  };
}
