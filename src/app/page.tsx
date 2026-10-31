'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Code2,
  Lock,
  ShieldCheck,
  Flame,
  ArrowRight,
  Shuffle,
  FileCode,
  Sparkles,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

// Generates memorable random words for slugs
const ADJECTIVES = ['quick', 'silent', 'secure', 'bright', 'cyber', 'cryptic', 'iron', 'cosmic', 'zen'];
const NOUNS = ['vault', 'matrix', 'cipher', 'nexus', 'pad', 'beacon', 'gateway', 'prism', 'node'];

export default function HomePage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');

  const generateRandomSlug = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    setSlug(`${adj}-${noun}-${num}`);
  };

  const handleOpenPad = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (clean) {
      router.push(`/${clean}`);
    } else {
      generateRandomSlug();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      {/* Header */}
      <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Code2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight font-mono">CodedPad</span>
          <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            v2.0 ZK
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hardware AES-GCM Active
          </span>
        </div>
      </header>

      {/* Hero & Input */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Zero-Knowledge Code & Text Notepad</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.15]">
          Your notes. Encrypted in browser.{' '}
          <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            No accounts required.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Open a pad at any URL. Your text and code snippets are encrypted client-side using hardware-accelerated
          AES-GCM-256 before leaving your device. We can never read your notes.
        </p>

        {/* Dynamic Pad Creator Form */}
        <form onSubmit={handleOpenPad} className="mt-10 w-full max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl shadow-xl focus-within:ring-2 focus-within:ring-emerald-500 transition">
            <div className="flex items-center gap-1.5 pl-3 text-neutral-400 font-mono text-sm shrink-0">
              <span>codedpad.com/</span>
            </div>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="choose-a-pad-name"
              className="flex-1 w-full bg-transparent px-2 py-2 text-sm font-mono text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none"
            />
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={generateRandomSlug}
                title="Generate Random Pad Name"
                className="p-2.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
              >
                <span>Open Pad</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <span className="text-[11px] text-neutral-400 mt-2 block font-mono">
            Tip: Press Enter or pick any name to start writing.
          </span>
        </form>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 text-left w-full">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-sm text-neutral-900 dark:text-white">Zero-Knowledge AES-GCM</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Native Web Crypto API with PBKDF2 (100k rounds) & random IV. Decryption occurs only in memory.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <FileCode className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-sm text-neutral-900 dark:text-white">Multi-Tab Code Editor</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              CodeMirror 6 with syntax highlighting for 50+ languages, line numbers, and live Markdown split preview.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-sm text-neutral-900 dark:text-white">Plausible Deniability</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Duress decoy password opens a benign dummy note, masking your real secrets if coerced.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-sm text-neutral-900 dark:text-white">Burn & Ephemeral TTL</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Auto-destruct after 1 view or set custom retention: 1h, 24h, 7d, or 30d with cryptographic proof.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 px-4 text-center text-xs text-neutral-500">
        <p>Built with Next.js 15, Web Crypto API, CodeMirror 6, and SQLite. 100% Zero-Knowledge & Open Source.</p>
      </footer>
    </div>
  );
}
