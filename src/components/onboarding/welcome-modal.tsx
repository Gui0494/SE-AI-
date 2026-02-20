'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Brain, Wrench, X } from 'lucide-react';

const ONBOARDING_KEY = 'se-ai-onboarding-seen';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Multi-Provider AI',
    description: 'Chat with GPT-4.1, Claude, Gemini, and more.',
  },
  {
    icon: Wrench,
    title: 'Built-in Tools',
    description: 'Web search, calculator, and URL fetching.',
  },
  {
    icon: Brain,
    title: 'Memory System',
    description: 'AI remembers your preferences across conversations.',
  },
];

export function WelcomeModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) setShow(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600/20 to-emerald-600/20 px-6 pt-8 pb-6 text-center">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Welcome to SE AI</h2>
          <p className="text-sm text-zinc-400 mt-1">Your intelligent AI assistant</p>
        </div>

        {/* Features */}
        <div className="px-6 py-5 space-y-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <feature.icon className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">{feature.title}</h3>
                <p className="text-xs text-zinc-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Start Chatting
          </button>
        </div>
      </div>
    </div>
  );
}
