import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodedPad | Private Notes & Code Scratchpad',
  description:
    'Private scratchpad for notes and code with automatic saving and password protection.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white min-h-screen selection:bg-[#d71921] selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
