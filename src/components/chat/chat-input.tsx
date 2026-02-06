'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, ChevronDown } from 'lucide-react';
import { AI_MODELS } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  isStreaming,
  selectedModel,
  onModelChange,
  disabled,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        modelPickerRef.current &&
        !modelPickerRef.current.contains(e.target as Node)
      ) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isStreaming || disabled) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentModel = AI_MODELS.find((m) => m.id === selectedModel);

  const groupedModels = AI_MODELS.reduce(
    (acc, model) => {
      const provider = model.provider;
      if (!acc[provider]) acc[provider] = [];
      acc[provider].push(model);
      return acc;
    },
    {} as Record<string, typeof AI_MODELS>
  );

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end bg-zinc-900 rounded-xl border border-zinc-800 focus-within:border-zinc-600 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-500 resize-none px-4 py-3 pr-12 max-h-[200px] focus:outline-none text-sm"
            rows={1}
            disabled={disabled}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming || disabled}
            className={cn(
              'absolute right-2 bottom-2 p-2 rounded-lg transition-colors',
              input.trim() && !isStreaming
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'text-zinc-600'
            )}
            aria-label={isStreaming ? 'Stop generating' : 'Send message'}
          >
            {isStreaming ? (
              <Square className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="relative" ref={modelPickerRef}>
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 transition-colors"
            >
              <span>{currentModel?.name || selectedModel}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showModelPicker && (
              <div className="absolute bottom-full mb-2 left-0 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="max-h-80 overflow-y-auto p-2">
                  {Object.entries(groupedModels).map(([provider, models]) => (
                    <div key={provider}>
                      <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        {provider}
                      </div>
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            onModelChange(model.id);
                            setShowModelPicker(false);
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                            model.id === selectedModel
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'text-zinc-300 hover:bg-zinc-800'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span>{model.name}</span>
                            <span
                              className={cn(
                                'text-xs px-1.5 py-0.5 rounded',
                                model.tier === 'free'
                                  ? 'bg-green-900/50 text-green-400'
                                  : model.tier === 'pro'
                                    ? 'bg-blue-900/50 text-blue-400'
                                    : 'bg-purple-900/50 text-purple-400'
                              )}
                            >
                              {model.tier}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className="text-xs text-zinc-600">
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}
