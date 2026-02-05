'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Greeting } from '@/components/chat/greeting';
import { SuggestionButtons } from '@/components/chat/suggestion-buttons';
import { ChatInput } from '@/components/chat/chat-input';
import { RecentChats } from '@/components/chat/recent-chats';

interface HomeContentProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    plan: string;
    onboardingComplete: boolean;
  };
}

export function HomeContent({ user }: HomeContentProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');

  const handleSuggestionSelect = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleSendMessage = async (message: string) => {
    // Create a new chat and navigate to it
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        const { chatId } = await response.json();
        router.push(`/chat/${chatId}`);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Greeting */}
          <Greeting user={user} streak={5} />

          {/* Suggestion buttons */}
          <div className="mt-8">
            <SuggestionButtons onSelect={handleSuggestionSelect} />
          </div>

          {/* Recent chats */}
          <div className="mt-12">
            <RecentChats />
          </div>
        </div>
      </div>

      {/* Chat input at bottom */}
      <div className="border-t border-neutral-800 bg-neutral-900/50 backdrop-blur-xl pt-4">
        <ChatInput
          onSend={handleSendMessage}
          initialValue={inputValue}
          placeholder="Comece uma conversa..."
        />
      </div>
    </div>
  );
}
