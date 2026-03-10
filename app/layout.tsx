import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'System Design Bootcamp',
  description: 'Master system design for FAANG interviews with AI-powered lessons and interactive practice.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
