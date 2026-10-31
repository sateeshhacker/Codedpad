'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shuffle,
  Shield,
  Zap,
  Flame,
} from 'lucide-react';

const ADJECTIVES = ['silent', 'stealth', 'cipher', 'quantum', 'shadow', 'zen', 'iron', 'vector', 'dark', 'bright'];
const NOUNS = ['vault', 'space', 'notes', 'beacon', 'buffer', 'page', 'pad', 'core', 'folder', 'draft'];

export default function HomePage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [isShuffling, setIsShuffling] = useState(false);

  // Generate initial random slug on mount
  useEffect(() => {
    generateRandomSlug();
  }, []);

  const generateRandomSlug = () => {
    setIsShuffling(true);
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 90) + 10;
    setSlug(`${adj}-${noun}-${num}`);
    setTimeout(() => setIsShuffling(false), 200);
  };

  const handleOpenPad = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const targetSlug = clean || 'my-notes';
    router.push(`/${targetSlug}`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-[#d71921] selection:text-white bg-nothing-dots relative overflow-x-hidden">
      {/* ================= NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-50 bg-black/85 backdrop-blur-md border-b border-[#242428] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Simple Tagline */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-headline font-bold text-lg tracking-wider text-white select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d71921] led-diode-pulse inline-block" />
              <span>CODEDPAD</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#131315] border border-[#242428] text-[11px] font-mono text-[#a1a1aa] tracking-wider">
              <span>Private Notepad</span>
            </div>
          </div>

          {/* Simple non-tech navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono tracking-wider text-[#a1a1aa]">
            <a
              href="#security"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-[#d71921]" />
              <span>Private & Secure</span>
            </a>
            <a
              href="#autosave"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-white/70" />
              <span>Auto-Save</span>
            </a>
            <a
              href="#disappearing"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-[#d71921]" />
              <span>Self-Destruct</span>
            </a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenPad()}
              className="rounded-full bg-white hover:bg-[#d71921] text-black hover:text-white px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 flex items-center gap-1.5 shadow-none"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#d71921] group-hover:bg-white" />
              <span>+ New Pad</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-14 sm:py-20 max-w-5xl mx-auto w-full text-center">
        {/* Top Badge (Friendly & Non-Tech) */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131315] border border-[#242428] text-[#a1a1aa] text-xs font-mono tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-[#d71921] led-diode-pulse" />
          <span>100% Private</span>
          <span className="text-[#38383e]">•</span>
          <span className="text-white">No Sign-up Needed</span>
          <span className="text-[#38383e]">•</span>
          <span className="text-[#d71921]">Free & Instant</span>
        </div>

        {/* High-Impact Main Headline */}
        <h1 className="font-headline text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
          Private Scratchpad For Your Code & Notes.
        </h1>

        {/* Punchy 1-Line Subtitle */}
        <p className="mt-4 text-sm sm:text-base md:text-lg text-[#a1a1aa] max-w-2xl mx-auto font-sans leading-relaxed">
          Write notes and code securely without creating an account. Everything is locked directly on your device so only you can read it.
        </p>

        {/* ================= CENTER PAD CREATOR CARD ================= */}
        <div className="w-full max-w-2xl mt-10 bg-[#0e0e10]/90 border border-[#242428] hover:border-[#38383e] transition-all rounded-3xl p-5 sm:p-7 text-left relative shadow-2xl backdrop-blur-md">
          {/* Card Top Header */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#242428] text-xs font-mono text-[#a1a1aa]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d71921] led-diode-pulse" />
              <span className="text-white font-semibold tracking-wider">
                Create or Open a Pad
              </span>
            </div>
            <span className="text-[#71717a] hidden sm:inline">Instant Access</span>
          </div>

          {/* Form */}
          <form onSubmit={handleOpenPad} className="space-y-4">
            {/* Input Well */}
            <div className="bg-black border border-[#242428] focus-within:border-white transition-all rounded-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center flex-1 px-3">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Enter pad name (e.g. sateesh)"
                  spellCheck={false}
                  className="bg-transparent border-0 font-mono text-sm sm:text-base text-white placeholder-[#52525b] outline-none flex-1 py-1 tracking-wide"
                />
                <button
                  type="button"
                  onClick={generateRandomSlug}
                  title="Generate Random Name"
                  className={`p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition ${
                    isShuffling ? 'rotate-180 transition-transform duration-200' : ''
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>

              {/* Stark White Action Button */}
              <button
                type="submit"
                className="shrink-0 rounded-full bg-white hover:bg-[#d71921] text-black hover:text-white px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-none cursor-pointer"
              >
                <span>OPEN PAD -&gt;</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#d71921] group-hover:bg-white inline-block" />
              </button>
            </div>
          </form>

          {/* Simple Footer Note */}
          <div className="mt-5 pt-3 border-t border-[#242428] flex flex-wrap justify-between items-center gap-2 text-[11px] font-mono text-[#71717a]">
            <span>No Account Needed</span>
            <span>•</span>
            <span>Completely Free</span>
            <span>•</span>
            <span className="text-white">Private &amp; Secure</span>
          </div>
        </div>

        {/* ================= 3 CLEAR BENEFIT CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 text-left w-full max-w-5xl">
          {/* Card 1: Private & Secure */}
          <div
            id="security"
            className="p-6 rounded-3xl bg-[#0e0e10]/80 border border-[#242428] hover:border-[#38383e] transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-[#18181b] border border-[#242428] text-[#d71921] flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="font-headline font-bold text-lg uppercase text-white">
                Private &amp; Secure
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed font-sans">
                Your notes are locked on your device before they ever leave it. Nobody else, not even us, can read what you write.
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-[#242428] text-[11px] font-mono text-[#71717a]">
              <span>Password protected</span>
            </div>
          </div>

          {/* Card 2: Auto-Save */}
          <div
            id="autosave"
            className="p-6 rounded-3xl bg-[#0e0e10]/80 border border-[#242428] hover:border-[#38383e] transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-[#18181b] border border-[#242428] text-[#d71921] flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="font-headline font-bold text-lg uppercase text-white">
                Automatic Saving
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed font-sans">
                Never lose your progress. Every word and line you type is automatically saved in the background.
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-[#242428] text-[11px] font-mono text-[#71717a]">
              <span>Saves as you write</span>
            </div>
          </div>

          {/* Card 3: Self-Destruct */}
          <div
            id="disappearing"
            className="p-6 rounded-3xl bg-[#0e0e10]/80 border border-[#242428] hover:border-[#38383e] transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-[#18181b] border border-[#242428] text-[#d71921] flex items-center justify-center mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h2 className="font-headline font-bold text-lg uppercase text-white">
                Disappearing Notes
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed font-sans">
                Need to share something sensitive? Set your note to permanently delete itself after it has been opened.
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-[#242428] text-[11px] font-mono text-[#71717a]">
              <span>Delete on read</span>
            </div>
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#242428] bg-black/90 py-6 px-4 sm:px-8 mt-12 text-xs font-mono text-[#71717a]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <span className="w-2 h-2 rounded-full bg-[#d71921] inline-block" />
            <span className="tracking-wider">CODEDPAD</span>
          </div>

          <div className="text-[11px] text-[#71717a] font-sans">
            Simple, private notes and code.
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#security"
              className="hover:text-white transition-colors text-[11px]"
            >
              Privacy
            </a>
            <a
              href="#autosave"
              className="hover:text-white transition-colors text-[11px]"
            >
              Auto-Save
            </a>
            <button
              onClick={() => {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                  alert('All local temporary pad data cleared.');
                } catch {
                  // ignore
                }
              }}
              className="hover:text-[#d71921] transition-colors text-[11px]"
            >
              Clear Local Data
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
