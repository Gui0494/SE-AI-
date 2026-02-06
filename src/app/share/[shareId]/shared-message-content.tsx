'use client';

import { MarkdownRenderer } from '@/components/chat/markdown-renderer';

interface SharedMessageContentProps {
  role: string;
  content: string;
}

export function SharedMessageContent({ role, content }: SharedMessageContentProps) {
  if (role === 'assistant') {
    return <MarkdownRenderer content={content} />;
  }
  return (
    <div className="text-zinc-200 whitespace-pre-wrap text-sm leading-relaxed">
      {content}
    </div>
  );
}
