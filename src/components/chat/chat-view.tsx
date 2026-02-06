'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { useChat } from '@/hooks/use-chat';
import { useToast } from '@/components/ui/toast';
import { ChatSkeleton } from '@/components/ui/skeleton';
import { Bot, Sparkles, MoreHorizontal, Share2, Download, Trash2, Link, X } from 'lucide-react';

export function ChatView() {
  const {
    chats,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    selectedModel,
    error,
    currentChatId,
    toolActivity,
    branches,
    activeBranch,
    sendMessage,
    setSelectedModel,
    setError,
    setActiveBranch,
    regenerateMessage,
    editMessage,
    loadBranches,
    shareChat,
    unshareChat,
    exportChat,
    deleteChat,
  } = useChat();

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Show errors as toasts
  useEffect(() => {
    if (error) {
      toast('error', error);
      setError(null);
    }
  }, [error, toast, setError]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentChat = chats.find((c) => c.id === currentChatId);

  const getBranchInfo = (msgId: string) => {
    const msgBranches = branches[msgId];
    if (!msgBranches || msgBranches.length <= 1) return undefined;
    const current = activeBranch[msgId] || 0;
    return {
      total: msgBranches.length,
      current,
      onPrev: () => {
        if (current > 0) setActiveBranch(msgId, current - 1);
      },
      onNext: () => {
        if (current < msgBranches.length - 1) setActiveBranch(msgId, current + 1);
      },
    };
  };

  // Auto-load branches for assistant messages with parentId
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role === 'assistant' && msg.parentId && !branches[msg.parentId]) {
        loadBranches(msg.parentId);
      }
    }
  }, [messages, branches, loadBranches]);

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  const handleShare = async () => {
    if (!currentChatId) return;
    if (currentChat?.shareId) {
      await unshareChat(currentChatId);
      setShareUrl(null);
      toast('info', 'Chat unshared');
    } else {
      const url = await shareChat(currentChatId);
      if (url) {
        setShareUrl(url);
        toast('success', 'Share link created');
      }
    }
    setShowMenu(false);
  };

  const handleExport = async (format: 'md' | 'json' | 'txt') => {
    if (!currentChatId) return;
    await exportChat(currentChatId, format);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!currentChatId) return;
    await deleteChat(currentChatId);
    setShowMenu(false);
  };

  // Empty state
  if (!currentChatId && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-200 mb-2">
              Welcome to SE AI
            </h2>
            <p className="text-zinc-400 mb-8">
              Your intelligent AI assistant powered by multiple providers.
              Start a conversation to get help with anything.
            </p>
            <div className="grid grid-cols-2 gap-3 text-left">
              {[
                'Explain quantum computing',
                'Write a Python script',
                'Debug my code',
                'Create a business plan',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat header with menu */}
      {currentChatId && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950">
          <h2 className="text-sm font-medium text-zinc-300 truncate">
            {currentChat?.title || 'Chat'}
          </h2>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
              aria-label="Chat menu"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  {currentChat?.shareId ? 'Unshare' : 'Share'}
                </button>
                <div className="border-t border-zinc-800">
                  <div className="px-4 py-1.5 text-xs text-zinc-500">Export as</div>
                  <button
                    onClick={() => handleExport('md')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Markdown
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Download className="w-4 h-4" /> JSON
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Text
                  </button>
                </div>
                <div className="border-t border-zinc-800">
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share URL banner */}
      {shareUrl && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 border-b border-blue-800">
          <Link className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-300 flex-1 truncate">
            {window.location.origin}{shareUrl}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}${shareUrl}`);
              toast('success', 'Link copied to clipboard');
            }}
            className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 bg-blue-900/30 rounded"
          >
            Copy
          </button>
          <button onClick={() => setShareUrl(null)} className="text-blue-400 hover:text-blue-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ChatSkeleton />
        ) : (
        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              model={msg.model}
              messageId={msg.id}
              attachments={msg.attachments}
              branch={msg.parentId ? getBranchInfo(msg.parentId) : undefined}
              onRegenerate={!isStreaming ? regenerateMessage : undefined}
              onEdit={!isStreaming ? editMessage : undefined}
            />
          ))}

          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <ChatMessage
              role="assistant"
              content={streamingContent}
              model={selectedModel}
              isStreaming
            />
          )}

          {/* Tool activity indicator */}
          {isStreaming && toolActivity && (
            <div className="flex gap-4 px-4 py-3 md:px-8 bg-zinc-900/30 border-l-2 border-blue-500">
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>{toolActivity}</span>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isStreaming && !streamingContent && !toolActivity && (
            <div className="flex gap-4 px-4 py-6 md:px-8 bg-zinc-900/50">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1 pt-1">
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isStreaming={isStreaming}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}
