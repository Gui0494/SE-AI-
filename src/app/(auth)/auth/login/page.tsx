import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Entre na sua conta SE AI',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
