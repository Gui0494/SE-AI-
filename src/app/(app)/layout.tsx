import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Check if onboarding is complete
  if (!session.user.onboardingComplete) {
    redirect('/onboarding');
  }

  return (
    <div className="flex h-screen bg-neutral-950">
      {/* Sidebar */}
      <Sidebar user={session.user} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
