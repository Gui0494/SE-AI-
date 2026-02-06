import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SE AI - Intelligent AI Platform',
  description:
    'Multi-provider AI chat platform with streaming, tool use, and advanced capabilities.',
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
