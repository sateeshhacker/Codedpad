'use client';

import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSubmit: (password: string) => Promise<boolean>;
  title: string;
  description: string;
  submitButtonText?: string;
  isInitialSetup?: boolean;
  slug?: string;
  onSuggestAlternative?: (newSlug: string) => void;
}

export default function PasswordModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  submitButtonText = 'Unlock Pad',
  isInitialSetup = false,
  slug,
  onSuggestAlternative,
}: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alternativeSlug, setAlternativeSlug] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError(null);

      if (slug) {
        // e.g. "sateesh" -> "sateesh-42", "sateesh-1" -> "sateesh-2"
        const match = slug.match(/^(.*?)-?(\d+)$/);
        if (match) {
          const prefix = match[1];
          const nextNum = parseInt(match[2], 10) + 1;
          setAlternativeSlug(`${prefix}-${nextNum}`);
        } else {
          const randomNum = Math.floor(Math.random() * 90) + 10;
          setAlternativeSlug(`${slug}-${randomNum}`);
        }
      }
    }
  }, [isOpen, slug]);

  if (!isOpen) return null;

  // Simple entropy/strength estimation
  const calculateStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-[#242428]' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 14) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-[#d71921]' };
    if (score <= 3) return { score: 2, label: 'Good', color: 'bg-amber-400' };
    return { score: 3, label: 'Strong', color: 'bg-white' };
  };

  const strength = calculateStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (isInitialSetup && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const success = await onSubmit(password);
      if (!success) {
        setError('Incorrect password. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-md bg-[#0e0e10] border border-[#242428] rounded-3xl shadow-2xl p-5 sm:p-7 relative max-h-[90dvh] overflow-y-auto">
        {/* Status Strip */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#242428] text-xs font-mono text-[#a1a1aa]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d71921] led-diode-pulse" />
            <span className="text-white font-semibold tracking-wider">
              {isInitialSetup ? 'Protect Your Pad' : 'Password Protected'}
            </span>
          </div>
          <span className="text-[11px] text-[#71717a]">Private</span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#18181b] border border-[#242428] text-[#d71921] flex items-center justify-center shrink-0">
            {isInitialSetup ? <KeyRound className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-headline font-bold text-white uppercase tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-[#a1a1aa] font-sans leading-relaxed">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono tracking-wider text-[#a1a1aa] mb-1.5">
              {isInitialSetup ? 'Choose Password' : 'Enter Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3.5 py-2.5 bg-black border border-[#242428] focus:border-white rounded-2xl text-white placeholder-[#52525b] text-sm focus:outline-none pr-10 font-mono tracking-wide transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {isInitialSetup && password && (
              <div className="mt-2.5 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between items-center text-[#71717a]">
                  <span>Strength: <strong className="text-white">{strength.label}</strong></span>
                  <span>{password.length} chars</span>
                </div>
                <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${(strength.score / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {isInitialSetup && (
            <div>
              <label className="block text-xs font-mono tracking-wider text-[#a1a1aa] mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password..."
                className="w-full px-3.5 py-2.5 bg-black border border-[#242428] focus:border-white rounded-2xl text-white placeholder-[#52525b] text-sm focus:outline-none font-mono tracking-wide transition-colors"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#d71921]/10 border border-[#d71921]/40 text-[#ffb4ab] text-xs rounded-2xl font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#d71921]" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono tracking-wider text-[#a1a1aa] hover:text-white rounded-full transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-black bg-white hover:bg-[#d71921] hover:text-white rounded-full transition disabled:opacity-50 flex items-center gap-2 shadow-none"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>{submitButtonText}</span>
            </button>
          </div>
        </form>

        {/* Not your pad? Suggestion Box (Solution 1) */}
        {!isInitialSetup && alternativeSlug && (
          <div className="mt-5 pt-4 border-t border-[#242428]">
            <div className="text-xs text-[#a1a1aa] mb-2 font-sans">
              Not your pad or don&apos;t know the password?
            </div>
            <button
              type="button"
              onClick={() => {
                if (onSuggestAlternative) {
                  onSuggestAlternative(alternativeSlug);
                } else if (typeof window !== 'undefined') {
                  window.location.href = `/${alternativeSlug}`;
                }
              }}
              className="w-full py-2.5 px-3.5 bg-black hover:bg-[#18181b] border border-[#242428] hover:border-[#38383e] rounded-2xl text-xs font-mono text-white flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[#71717a] font-sans">Create:</span>
                <span className="font-bold text-white group-hover:text-[#d71921] transition-colors">
                  codedpad.com/{alternativeSlug}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#a1a1aa] group-hover:text-white font-sans font-medium">
                <span>Start fresh</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#d71921] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-[#242428] flex items-center justify-between text-[11px] font-mono text-[#71717a]">
          <span className="flex items-center gap-1.5 text-[#a1a1aa]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d71921]" />
            Protected pad
          </span>
          <span>Private</span>
        </div>
      </div>
    </div>
  );
}
