import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-zinc-700 mb-4">404</p>
        <h2 className="text-xl font-bold text-zinc-200 mb-2">
          Page not found
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
