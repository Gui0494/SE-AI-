'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, ChevronDown, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { AI_MODELS } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

interface Attachment {
  type: 'image' | 'file';
  url: string;
  name: string;
  mimeType: string;
  size: number;
  preview?: string; // local preview URL for images
}

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Paste handler for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFileUpload(file);
          }
        }
      }
    };

    const textarea = textareaRef.current;
    textarea?.addEventListener('paste', handlePaste);
    return () => textarea?.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      // Request presigned URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { uploadUrl, publicUrl } = await res.json();

      // Upload directly to S3/R2
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      const isImage = file.type.startsWith('image/');
      const preview = isImage ? URL.createObjectURL(file) : undefined;

      setAttachments((prev) => [
        ...prev,
        {
          type: isImage ? 'image' : 'file',
          url: publicUrl,
          name: file.name,
          mimeType: file.type,
          size: file.size,
          preview,
        },
      ]);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const att = prev[index];
      if (att.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isStreaming || disabled) return;
    onSend(input.trim(), attachments.length > 0 ? attachments : undefined);
    setInput('');
    setAttachments([]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      handleFileUpload(file);
    }
    e.target.value = '';
  };

  // Drag and drop
  const [dragOver, setDragOver] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    for (const file of Array.from(files)) {
      handleFileUpload(file);
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="relative group bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
              >
                {att.type === 'image' && att.preview ? (
                  <img
                    src={att.preview}
                    alt={att.name}
                    className="w-20 h-20 object-cover"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <div>
                      <p className="text-xs text-zinc-300 truncate max-w-[120px]">{att.name}</p>
                      <p className="text-xs text-zinc-500">{formatSize(att.size)}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute top-1 right-1 p-0.5 bg-zinc-900/80 rounded-full text-zinc-400 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {uploading && (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-400">Uploading...</span>
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            'relative flex items-end bg-zinc-900 rounded-xl border transition-colors',
            dragOver ? 'border-blue-500 bg-blue-900/10' : 'border-zinc-800 focus-within:border-zinc-600'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Attach file"
            disabled={uploading}
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt,.csv,.md"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dragOver ? 'Drop files here...' : 'Send a message...'}
            className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-500 resize-none py-3 pr-12 max-h-[200px] focus:outline-none text-sm"
            rows={1}
            disabled={disabled}
          />
          <button
            onClick={handleSubmit}
            disabled={(!input.trim() && attachments.length === 0) || isStreaming || disabled}
            className={cn(
              'absolute right-2 bottom-2 p-2 rounded-lg transition-colors',
              (input.trim() || attachments.length > 0) && !isStreaming
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
            Enter to send &middot; Shift+Enter for new line &middot; Ctrl+Shift+O new chat
          </span>
        </div>
      </div>
    </div>
  );
}
