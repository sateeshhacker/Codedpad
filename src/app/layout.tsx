import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodedPad | Zero-Knowledge Encrypted Code & Text Notepad',
  description:
    'Client-side encrypted notepad and code editor with AES-GCM-256, CodeMirror syntax highlighting, multi-tabs, and plausible deniability.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-neutral-50 dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
