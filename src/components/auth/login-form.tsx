'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Github, Loader2, AlertCircle, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'magic-link'>('credentials');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou senha incorretos');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    setIsLoading(true);
    await signIn(provider, { callbackUrl });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo and title */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 mb-4 shadow-glow"
        >
          <span className="text-3xl">&#129504;</span>
        </motion.div>
        <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
        <p className="text-neutral-400 mt-1">Entre para continuar sua jornada</p>
      </div>

      {/* Global error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Credentials / Magic Link */}
      <div className="flex gap-2 mb-6 p-1 bg-neutral-800 rounded-lg">
        <button
          onClick={() => setLoginMethod('credentials')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            loginMethod === 'credentials'
              ? 'bg-neutral-700 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Email e Senha
        </button>
        <button
          onClick={() => setLoginMethod('magic-link')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            loginMethod === 'magic-link'
              ? 'bg-neutral-700 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          Magic Link
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            leftIcon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        {/* Password (only for credentials) */}
        {loginMethod === 'credentials' && (
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
          </div>
        )}

        {/* Options */}
        {loginMethod === 'credentials' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="rememberMe" {...register('rememberMe')} />
              <Label htmlFor="rememberMe" className="text-sm text-neutral-400 cursor-pointer">
                Lembrar de mim
              </Label>
            </div>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Esqueci a senha
            </Link>
          </div>
        )}

        {/* Submit button */}
        <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
          {loginMethod === 'magic-link' ? (
            <>
              <Wand2 className="w-5 h-5" />
              Enviar Magic Link
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <Separator />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="px-2 bg-neutral-900 text-neutral-500 text-sm">ou continue com</span>
        </div>
      </div>

      {/* OAuth Providers */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleOAuthLogin('google')}
          disabled={isLoading}
          className="h-11"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => handleOAuthLogin('github')}
          disabled={isLoading}
          className="h-11"
        >
          <Github className="w-5 h-5" />
          GitHub
        </Button>
      </div>

      {/* Link to register */}
      <p className="mt-6 text-center text-neutral-400">
        Nao tem conta?{' '}
        <Link
          href="/auth/register"
          className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          Criar conta gratis
        </Link>
      </p>
    </div>
  );
}
