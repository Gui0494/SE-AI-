'use client';

import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { useChat } from '@/hooks/use-chat';
import { Bot, Sparkles } from 'lucide-react';

export function ChatView() {
  const {
    messages,
    isStreaming,
    streamingContent,
    selectedModel,
    error,
    currentChatId,
    toolActivity,
    sendMessage,
    setSelectedModel,
    setError,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = (content: string) => {
    sendMessage(content);
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
      {/* Error banner */}
      {error && (
        <div className="bg-red-900/30 border-b border-red-800 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-red-300">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              model={msg.model}
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
