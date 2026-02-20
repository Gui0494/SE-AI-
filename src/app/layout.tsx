import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SE AI - Intelligent AI Platform',
    template: '%s | SE AI',
  },
  description:
    'Multi-provider AI chat platform with streaming, tool use, memory, and advanced capabilities. Powered by OpenAI, Anthropic, Google, and Groq.',
  keywords: ['AI', 'chatbot', 'GPT', 'Claude', 'Gemini', 'multi-provider', 'AI platform'],
  authors: [{ name: 'SE AI' }],
  openGraph: {
    title: 'SE AI - Intelligent AI Platform',
    description: 'Chat with multiple AI providers in one place. Streaming, tools, memory, and more.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SE AI - Intelligent AI Platform',
    description: 'Chat with multiple AI providers in one place.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-zinc-950 text-zinc-200">
        {children}
      </body>
    </html>
  );
}
