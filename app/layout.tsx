import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Revytal Automated Checkout',
  description: 'Clinical product checkout made effortless.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-mesh">{children}</body>
    </html>
  );
}
