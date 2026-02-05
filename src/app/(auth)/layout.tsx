import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to home if already authenticated
  if (session?.user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/50 via-neutral-950 to-secondary-950/50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-sm text-neutral-500">
        <div className="flex items-center justify-center gap-4">
          <span>&copy; 2026 SE AI</span>
          <span>•</span>
          <a href="/terms" className="hover:text-neutral-300 transition-colors">
            Termos
          </a>
          <span>•</span>
          <a href="/privacy" className="hover:text-neutral-300 transition-colors">
            Privacidade
          </a>
        </div>
      </footer>
    </div>
  );
}
