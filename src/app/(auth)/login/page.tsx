'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Github, Mail, Zap, Brain, Shield, MessageSquare } from 'lucide-react';

const FEATURES = [
  { icon: MessageSquare, title: 'Multi-Provider AI', desc: 'OpenAI, Anthropic, Google, Groq — 12 models in one place' },
  { icon: Zap, title: 'Real-time Streaming', desc: 'Instant responses with server-sent events' },
  { icon: Brain, title: 'Long-term Memory', desc: 'AI remembers your preferences across conversations' },
  { icon: Shield, title: 'Built-in Tools', desc: 'Web search, calculator, URL fetch — no plugins needed' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Did you verify your email?');
      } else {
        router.push('/');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* Left side — Hero / Landing */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 xl:px-20 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-r border-zinc-800">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-100">SE AI</span>
          </div>

          <h1 className="text-4xl font-bold text-zinc-100 leading-tight mb-4">
            Your intelligent AI assistant,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              all models in one place.
            </span>
          </h1>
          <p className="text-zinc-400 text-lg mb-10">
            Chat with GPT-4, Claude, Gemini, and more. With built-in tools, memory, and streaming.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — Sign in form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-2xl font-bold text-zinc-200">Welcome to SE AI</h1>
            <p className="text-zinc-500 mt-1">Sign in to get started</p>
          </div>
          <div className="hidden lg:block text-center mb-6">
            <h2 className="text-2xl font-bold text-zinc-200">Welcome back</h2>
            <p className="text-zinc-500 mt-1">Sign in to SE AI</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            {/* OAuth providers */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                Continue with Google
              </button>
              <button
                onClick={() => signIn('github', { callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
              >
                <Github className="w-4 h-4" />
                Continue with GitHub
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-zinc-900 px-2 text-zinc-500">or</span>
              </div>
            </div>

            {/* Email login */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-600 transition-colors text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-600 transition-colors text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              <div className="text-right">
                <Link href="/forgot-password" className="text-xs text-zinc-500 hover:text-blue-400 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </form>
          </div>

          <p className="text-center text-sm text-zinc-500 mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
