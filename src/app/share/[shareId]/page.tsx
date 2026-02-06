import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Bot, User, Sparkles } from 'lucide-react';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ shareId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  const chat = await db.chat.findFirst({
    where: { shareId },
  });
  return {
    title: chat ? `${chat.title} - SE AI` : 'Shared Chat - SE AI',
    description: chat ? `View a shared conversation: ${chat.title}` : 'View a shared AI conversation on SE AI',
    openGraph: {
      title: chat?.title || 'Shared Chat',
      description: 'AI conversation shared via SE AI',
      type: 'article',
    },
  };
}

export default async function SharedChatPage({ params }: Props) {
  const { shareId } = await params;

  const chat = await db.chat.findFirst({
    where: { shareId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        where: { parentId: null },
      },
    },
  });

  if (!chat) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">{chat.title}</h1>
              <p className="text-xs text-zinc-500">
                {chat.model} &middot; {new Date(chat.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <a
            href="/register"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try SE AI
          </a>
        </div>
      </header>

      {/* Messages */}
      <main className="max-w-3xl mx-auto pb-20">
        {chat.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 px-4 py-6 md:px-8 ${msg.role === 'assistant' ? 'bg-zinc-900/50' : ''}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-zinc-300">
                  {msg.role === 'user' ? 'User' : 'Assistant'}
                </span>
                {msg.model && msg.role === 'assistant' && (
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                    {msg.model}
                  </span>
                )}
              </div>
              <div className="text-zinc-200 whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 text-center text-sm text-zinc-500">
          This conversation was shared from{' '}
          <a href="/" className="text-blue-400 hover:text-blue-300">
            SE AI
          </a>
        </div>
      </footer>
    </div>
  );
}
