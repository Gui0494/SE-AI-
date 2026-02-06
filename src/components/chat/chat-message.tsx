'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Bot, Copy, Check, RefreshCw, Pencil, X, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

interface Attachment {
  type: 'image' | 'file';
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

interface BranchInfo {
  total: number;
  current: number;
  onPrev: () => void;
  onNext: () => void;
}

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  model?: string;
  messageId?: string;
  attachments?: Attachment[];
  isStreaming?: boolean;
  branch?: BranchInfo;
  onRegenerate?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
}

export function ChatMessage({
  role,
  content,
  model,
  messageId,
  attachments,
  isStreaming,
  branch,
  onRegenerate,
  onEdit,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const isUser = role === 'user';

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.style.height = 'auto';
      editRef.current.style.height = editRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setEditContent(content);
    setIsEditing(true);
  };

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== content && messageId && onEdit) {
      onEdit(messageId, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        'group flex gap-4 px-4 py-6 md:px-8',
        isUser ? 'bg-transparent' : 'bg-zinc-900/50'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-blue-600' : 'bg-emerald-600'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-zinc-300">
            {isUser ? 'You' : 'Assistant'}
          </span>
          {model && !isUser && (
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
              {model}
            </span>
          )}
          {branch && branch.total > 1 && (
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={branch.onPrev}
                disabled={branch.current <= 0}
                className="p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
                aria-label="Previous branch"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-zinc-500 tabular-nums">
                {branch.current + 1}/{branch.total}
              </span>
              <button
                onClick={branch.onNext}
                disabled={branch.current >= branch.total - 1}
                className="p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
                aria-label="Next branch"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {att.type === 'image' ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="max-w-xs max-h-48 rounded-lg border border-zinc-700 object-cover"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-750 transition-colors">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-300 truncate max-w-[150px]">{att.name}</span>
                  </div>
                )}
              </a>
            ))}
          </div>
        )}

        <div className="text-zinc-200">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                ref={editRef}
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={handleEditKeyDown}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 resize-none focus:outline-none focus:border-blue-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEditSubmit}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Save & Submit
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <MarkdownRenderer content={content} />
          )}
          {isStreaming && (
            <span className="inline-block w-2 h-5 bg-zinc-400 animate-pulse ml-0.5" />
          )}
        </div>

        {/* Action buttons */}
        {!isStreaming && content && !isEditing && (
          <div className="mt-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Copy button - for all messages */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Copy"
            >
              {copied ? (
                <><Check className="w-3 h-3" /> Copied</>
              ) : (
                <><Copy className="w-3 h-3" /> Copy</>
              )}
            </button>

            {/* Regenerate - for assistant messages */}
            {!isUser && messageId && onRegenerate && (
              <button
                onClick={() => onRegenerate(messageId)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Regenerate response"
              >
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            )}

            {/* Edit - for user messages */}
            {isUser && messageId && onEdit && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Edit message"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
