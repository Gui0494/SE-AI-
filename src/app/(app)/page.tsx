import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HomeContent } from '@/components/home-content';

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return <HomeContent user={session.user} />;
}
