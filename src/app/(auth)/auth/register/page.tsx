import { RegisterForm } from '@/components/auth/register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar Conta',
  description: 'Crie sua conta gratis no SE AI',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
