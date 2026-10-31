'use client';

import React, { useState } from 'react';
import { Settings, Flame, Clock, ShieldAlert, X, Check, Save, Zap } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expiresInMinutes: number | null;
  onExpiresChange: (minutes: number | null) => void;
  burnAfterRead: boolean;
  onBurnAfterReadChange: (val: boolean) => void;
  autoSaveEnabled: boolean;
  onAutoSaveEnabledChange: (val: boolean) => void;
  autoSaveMode: 'smart' | 'interval';
  onAutoSaveModeChange: (val: 'smart' | 'interval') => void;
  decoyPassword: string;
  onDecoyPasswordChange: (val: string) => void;
  decoyNoteContent: string;
  onDecoyNoteContentChange: (val: string) => void;
}

export const TTL_OPTIONS = [
  { label: 'Never (Permanent)', value: null },
  { label: '1 Hour', value: 60 },
  { label: '24 Hours (1 Day)', value: 1440 },
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
  autoSaveMode,
  onAutoSaveModeChange,
  decoyPassword,
  onDecoyPasswordChange,
  decoyNoteContent,
  onDecoyNoteContentChange,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'duress'>('lifecycle');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Security & Workspace Settings</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Ephemeral retention, auto-save triggers, and plausible deniability
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-5">
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'lifecycle'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Auto-Save & Expiration
          </button>
          <button
            onClick={() => setActiveTab('duress')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'duress'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Plausible Deniability (Duress)
          </button>
        </div>

        {activeTab === 'lifecycle' ? (
          <div className="space-y-5">
            {/* Auto-Save Configuration */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    Automatic Cloud Save
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => onAutoSaveEnabledChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-neutral-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {autoSaveEnabled && (
                <div className="space-y-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Auto-Save Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onAutoSaveModeChange('smart')}
                      className={`px-3 py-2 rounded-lg border text-left text-xs transition ${
                        autoSaveMode === 'smart'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-500" />
                        Smart Idle (Recommended)
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        Saves 2s after you pause typing + max 30s ceiling.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAutoSaveModeChange('interval')}
                      className={`px-3 py-2 rounded-lg border text-left text-xs transition ${
                        autoSaveMode === 'interval'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        Fixed 30s Interval
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        Saves strictly every 30 seconds if edits exist.
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Expiration dropdown */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Automatic Expiration (TTL)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TTL_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onExpiresChange(opt.value)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition ${
                      expiresInMinutes === opt.value
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {expiresInMinutes === opt.value && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-400">
                Pads exceeding their expiration are permanently destroyed on the database.
              </p>
            </div>

            {/* Burn after read */}
            <div className="p-4 rounded-xl border border-red-200 dark:border-red-950/60 bg-red-50/40 dark:bg-red-950/20 flex items-start gap-3">
              <Flame className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-900 dark:text-red-300">
                    Burn After Reading (Self-Destruct)
                  </span>
                  <input
                    type="checkbox"
                    checked={burnAfterRead}
                    onChange={(e) => onBurnAfterReadChange(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-red-600 focus:ring-red-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-red-700 dark:text-red-400/80 leading-relaxed">
                  The pad is immediately and irreversibly deleted from the server after the first successful decryption.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <strong>Plausible Deniability:</strong> Configure an alternate decoy password. If forced to disclose your password, entering the decoy password decrypts the dummy note below while keeping your real notes hidden.
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Decoy Password (Optional)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={decoyPassword}
                  onChange={(e) => onDecoyPasswordChange(e.target.value)}
                  placeholder="Set decoy password..."
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Decoy Content (Displayed when decoy password is entered)
              </label>
              <textarea
                rows={4}
                value={decoyNoteContent}
                onChange={(e) => onDecoyNoteContentChange(e.target.value)}
                placeholder="Grocery list: Milk, Bread, Coffee..."
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs focus:ring-2 focus:ring-emerald-500 font-mono resize-none"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
