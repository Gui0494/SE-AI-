'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      setMessage('Check your email for a verification link.');
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-zinc-200 mb-2">Verifying your email...</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-zinc-200 mb-2">Email Verified!</h1>
            <p className="text-zinc-400 text-sm mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Sign in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-zinc-200 mb-2">Verification Failed</h1>
            <p className="text-zinc-400 text-sm mb-6">{message}</p>
            <Link
              href="/register"
              className="inline-block px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl transition-colors"
            >
              Try registering again
            </Link>
          </>
        )}

        {status === 'no-token' && (
          <>
            <h1 className="text-xl font-bold text-zinc-200 mb-2">Check your email</h1>
            <p className="text-zinc-400 text-sm mb-6">
              We sent a verification link to your email. Click it to activate your account.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl transition-colors"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
