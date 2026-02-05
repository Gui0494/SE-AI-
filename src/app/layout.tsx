import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SE AI - Inteligencia Artificial de Proxima Geracao',
    template: '%s | SE AI',
  },
  description:
    'Plataforma de IA conversacional enterprise-grade com multiplos modelos, busca na web, geracao de imagens e muito mais.',
  keywords: [
    'IA',
    'inteligencia artificial',
    'chatbot',
    'GPT',
    'Claude',
    'Gemini',
    'AI',
    'chat',
    'assistente virtual',
  ],
  authors: [{ name: 'SE AI Team' }],
  creator: 'SE AI',
  publisher: 'SE AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'SE AI - Inteligencia Artificial de Proxima Geracao',
    description:
      'Plataforma de IA conversacional com multiplos modelos, busca na web, geracao de imagens e muito mais.',
    siteName: 'SE AI',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SE AI - Inteligencia Artificial de Proxima Geracao',
    description:
      'Plataforma de IA conversacional com multiplos modelos, busca na web, geracao de imagens e muito mais.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-950 font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#27272a',
              border: '1px solid #3f3f46',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
