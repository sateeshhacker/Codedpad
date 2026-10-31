'use client';

import React from 'react';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  Save,
  Columns,
  Share2,
  Settings,
  Plus,
  X,
  Sun,
  Moon,
  ShieldAlert,
  Code2,
  KeyRound,
} from 'lucide-react';
import { PadTab } from '@/lib/crypto';
import { SUPPORTED_LANGUAGES } from './CodeEditor';

interface NavbarProps {
  slug: string;
  tabs: PadTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  onRenameTab: (id: string, newTitle: string) => void;
  onChangeLanguage: (id: string, lang: string) => void;
  isUnlocked: boolean;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onLock: () => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  onOpenPasswordModal: () => void;
  isSplitView: boolean;
  onToggleSplitView: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isDecoyActive?: boolean;
  saving?: boolean;
  lastSavedTime?: string | null;
  autoSaveEnabled?: boolean;
}

export default function Navbar({
  slug,
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onRenameTab,
  onChangeLanguage,
  isUnlocked,
  hasUnsavedChanges,
  onSave,
  onLock,
  onOpenSettings,
  onOpenShare,
  onOpenPasswordModal,
  isSplitView,
  onToggleSplitView,
  isDark,
  onToggleTheme,
  isDecoyActive,
  saving,
  lastSavedTime,
  autoSaveEnabled,
}: NavbarProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-4 flex items-center justify-between gap-3 select-none z-30 shrink-0">
      {/* Brand & Pad Slug */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm tracking-tight hover:opacity-85 transition"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Code2 className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline font-mono">CodedPad</span>
        </Link>

        <span className="text-neutral-300 dark:text-neutral-700">/</span>

        {/* Slug pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono text-neutral-800 dark:text-neutral-200">
          <span>{slug}</span>
          {isDecoyActive ? (
            <span className="flex items-center gap-1 text-[10px] text-amber-500 font-sans font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
              <ShieldAlert className="w-3 h-3" />
              Decoy
            </span>
          ) : isUnlocked ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <Unlock className="w-2.5 h-2.5" />
              Decrypted
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-neutral-400 font-sans">
              <Lock className="w-2.5 h-2.5" />
              Locked
            </span>
          )}
        </div>
      </div>

      {/* Center: Tabs list (only visible when unlocked) */}
      {isUnlocked && (
        <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar mx-2">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition shrink-0 ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200 dark:border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                }`}
              >
                <input
                  type="text"
                  value={tab.title}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onRenameTab(tab.id, e.target.value)}
                  className="bg-transparent text-xs font-mono outline-none w-20 max-w-[120px] focus:w-28 transition-all"
                />
                <span className="text-[10px] text-neutral-400 uppercase font-mono">
                  {tab.language.slice(0, 3)}
                </span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-0.5 rounded transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={onAddTab}
            title="Add Tab"
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isUnlocked && (
          <>
            {/* Active Language Selector */}
            {activeTab && (
              <select
                value={activeTab.language}
                onChange={(e) => onChangeLanguage(activeTab.id, e.target.value)}
                className="hidden md:inline-block px-2 py-1 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            )}

            {/* Split Preview button (only if active tab is markdown) */}
            {activeTab?.language === 'markdown' && (
              <button
                onClick={onToggleSplitView}
                title="Toggle Markdown Preview"
                className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                  isSplitView
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Columns className="w-4 h-4" />
              </button>
            )}

            {/* Save Button */}
            <button
              onClick={onSave}
              disabled={saving}
              title={hasUnsavedChanges ? "Click or press Ctrl+S to save" : autoSaveEnabled ? "Auto-save active" : "All changes saved"}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {saving
                  ? 'Saving...'
                  : hasUnsavedChanges
                  ? 'Save'
                  : lastSavedTime
                  ? `Saved ${lastSavedTime}`
                  : 'Saved'}
              </span>
            </button>

            {/* Change Master Password */}
            <button
              onClick={onOpenPasswordModal}
              title="Change Passphrase"
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Security & Lifecycle Settings */}
            <button
              onClick={onOpenSettings}
              title="Pad Settings (TTL, Decoy Password)"
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Share & Export */}
            <button
              onClick={onOpenShare}
              title="Share Pad or Export"
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Lock Pad */}
            <button
              onClick={onLock}
              title="Lock Session Now"
              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition"
            >
              <Lock className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title="Toggle Dark/Light Mode"
          className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
