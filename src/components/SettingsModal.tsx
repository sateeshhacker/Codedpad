'use client';

import React from 'react';
import { Settings, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expiresInMinutes: number | null;
  onExpiresChange: (minutes: number | null) => void;
  burnAfterRead: boolean;
  onBurnAfterReadChange: (val: boolean) => void;
  autoSaveEnabled: boolean;
  onAutoSaveEnabledChange: (val: boolean) => void;
  autoSaveMode?: 'smart' | 'interval';
  onAutoSaveModeChange?: (val: 'smart' | 'interval') => void;
  decoyPassword?: string;
  onDecoyPasswordChange?: (val: string) => void;
  decoyNoteContent?: string;
  onDecoyNoteContentChange?: (val: string) => void;
}

export const TTL_OPTIONS = [
  { label: 'Never', value: null },
  { label: '1 Hour', value: 60 },
  { label: '24 Hours', value: 1440 },
  { label: '7 Days', value: 10080 },
  { label: '30 Days', value: 43200 },
];

export default function SettingsModal({
  isOpen,
  onClose,
  expiresInMinutes,
  onExpiresChange,
  burnAfterRead,
  onBurnAfterReadChange,
  autoSaveEnabled,
  onAutoSaveEnabledChange,
  decoyPassword,
  onDecoyPasswordChange,
  decoyNoteContent,
  onDecoyNoteContentChange,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-md bg-[#0e0e10] border border-[#242428] rounded-3xl shadow-2xl p-5 sm:p-6 relative max-h-[90dvh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#71717a] hover:text-white rounded-full hover:bg-[#18181b] border border-[#242428] transition cursor-pointer"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#242428]">
          <div className="w-9 h-9 rounded-full bg-[#18181b] border border-[#242428] text-[#d71921] flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-headline font-bold text-white uppercase tracking-tight">
              Pad Settings
            </h2>
            <p className="text-xs text-[#a1a1aa] font-sans">
              Auto-save and auto-delete preferences
            </p>
          </div>
        </div>

        {/* Settings List */}
        <div className="space-y-1">
          {/* 1. Auto-Save Row */}
          <div className="flex items-center justify-between py-3 border-b border-[#242428]">
            <div>
              <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Auto-Save
              </div>
              <div className="text-[11px] text-[#a1a1aa] font-sans">
                Automatically saves changes as you type
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => onAutoSaveEnabledChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#242428] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#d71921]"></div>
            </label>
          </div>

          {/* 2. Auto-Delete Expiration */}
          <div className="py-3 border-b border-[#242428]">
            <div className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">
              Auto-Delete Pad
            </div>
            <div className="text-[11px] text-[#a1a1aa] font-sans mb-2.5">
              Permanently removes pad after selected duration
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {TTL_OPTIONS.map((opt) => {
                const isSelected = expiresInMinutes === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onExpiresChange(opt.value)}
                    className={`px-3 py-1.5 rounded-full border transition cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-white text-black font-bold border-white'
                        : 'bg-black text-[#a1a1aa] hover:text-white border-[#242428] hover:border-[#38383e]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Delete After Reading */}
          <div className="flex items-center justify-between py-3 border-b border-[#242428]">
            <div>
              <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Delete After Reading
              </div>
              <div className="text-[11px] text-[#a1a1aa] font-sans">
                Pad self-destructs after first open
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={burnAfterRead}
                onChange={(e) => onBurnAfterReadChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#242428] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#d71921]"></div>
            </label>
          </div>

          {/* 4. Decoy Pad (Optional Collapsible) */}
          {onDecoyPasswordChange && onDecoyNoteContentChange && (
            <details className="py-2.5 text-xs font-mono group">
              <summary className="flex items-center justify-between cursor-pointer text-[#a1a1aa] hover:text-white select-none py-1">
                <span className="font-bold uppercase tracking-wider">Decoy Pad (Optional)</span>
                <span className="text-[#71717a] group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <div className="pt-3 space-y-3 font-sans">
                <p className="text-[11px] text-[#71717a]">
                  If someone demands your password, entering this decoy password will open the fake note below instead.
                </p>
                <div>
                  <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">
                    Decoy Password
                  </label>
                  <input
                    type="password"
                    value={decoyPassword || ''}
                    onChange={(e) => onDecoyPasswordChange(e.target.value)}
                    placeholder="Set alternate password..."
                    className="w-full px-3 py-2 bg-black border border-[#242428] focus:border-white rounded-xl text-white text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#a1a1aa] mb-1">
                    Decoy Content
                  </label>
                  <textarea
                    rows={3}
                    value={decoyNoteContent || ''}
                    onChange={(e) => onDecoyNoteContentChange(e.target.value)}
                    placeholder="Decoy notes..."
                    className="w-full px-3 py-2 bg-black border border-[#242428] focus:border-white rounded-xl text-white text-xs font-mono outline-none resize-none"
                  />
                </div>
              </div>
            </details>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[#242428] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#71717a]">Settings save automatically</span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-black bg-white hover:bg-[#d71921] hover:text-white rounded-full transition shadow-none cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
