import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bem-vindo ao SE AI',
  description: 'Configure sua experiencia',
};

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  // If onboarding is already complete, redirect to home
  if (session.user.onboardingComplete) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/50 via-neutral-950 to-secondary-950/50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
      </div>

      <OnboardingFlow user={session.user} />
    </div>
  );
}
