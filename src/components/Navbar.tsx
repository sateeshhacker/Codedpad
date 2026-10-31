'use client';

import React, { useState } from 'react';
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
  KeyRound,
  LogOut,
  Pencil,
  MoreVertical,
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
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  onOpenPasswordModal: () => void;
  isSplitView: boolean;
  onToggleSplitView: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isDecoyActive?: boolean;
  hasPassword?: boolean;
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
  onLogout,
  onOpenSettings,
  onOpenShare,
  onOpenPasswordModal,
  isSplitView,
  onToggleSplitView,
  isDark,
  onToggleTheme,
  isDecoyActive,
  hasPassword = true,
  saving,
  lastSavedTime,
  autoSaveEnabled,
}: NavbarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <header className="h-14 border-b border-[#242428] bg-black/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 select-none z-30 shrink-0 font-sans relative">
      {/* Brand & Pad Name */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-white font-headline font-bold text-sm tracking-wider hover:opacity-85 transition shrink-0"
          title="Return to Home"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#d71921] led-diode-pulse inline-block" />
          <span className="font-headline hidden sm:inline">CODEDPAD</span>
        </Link>

        {/* Highlighted Pad Name Pill */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 bg-[#18181b] border border-white/20 rounded-full text-xs font-mono text-white shadow-xs max-w-[120px] sm:max-w-[180px]">
            <span className="text-[#a1a1aa] font-sans font-medium text-[11px] hidden xs:inline">Pad:</span>
            <span className="font-bold text-white tracking-wide truncate">{slug}</span>
          </div>

          {isDecoyActive ? (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              <ShieldAlert className="w-2.5 h-2.5" />
              Decoy
            </span>
          ) : !hasPassword ? (
            <button
              onClick={onOpenPasswordModal}
              className="flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 transition cursor-pointer shrink-0"
              title="Set a password to protect your pad and enable auto-save"
            >
              <KeyRound className="w-2.5 h-2.5 text-amber-400" />
              <span className="hidden sm:inline">Set Password</span>
            </button>
          ) : isUnlocked ? (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-white font-mono bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
              <Unlock className="w-2.5 h-2.5 text-[#d71921]" />
              Unlocked
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-[#71717a] font-mono bg-white/5 px-2 py-0.5 rounded-full">
              <Lock className="w-2.5 h-2.5" />
              Locked
            </span>
          )}
        </div>
      </div>

      {/* Center: Tabs list (only visible when unlocked) */}
      {isUnlocked && (
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar mx-1 sm:mx-2 min-w-0">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isEditing = editingTabId === tab.id;

            return (
              <div
                key={tab.id}
                onClick={() => {
                  if (!isEditing) {
                    onSelectTab(tab.id);
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingTabId(tab.id);
                  setEditTitle(tab.title);
                }}
                className={`group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-mono cursor-pointer transition shrink-0 border select-none ${
                  isActive
                    ? 'bg-[#18181b] text-white border-[#d71921] shadow-xs'
                    : 'bg-black/50 text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#131315] border-[#242428]'
                }`}
                title="Click to switch, double-click to rename"
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-[#d71921]' : 'bg-[#38383e]'}`} />

                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    value={editTitle}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editTitle.trim()) {
                          onRenameTab(tab.id, editTitle.trim());
                        }
                        setEditingTabId(null);
                      } else if (e.key === 'Escape') {
                        setEditingTabId(null);
                      }
                    }}
                    onBlur={() => {
                      if (editTitle.trim()) {
                        onRenameTab(tab.id, editTitle.trim());
                      }
                      setEditingTabId(null);
                    }}
                    className="bg-black text-xs font-mono text-white border border-[#d71921] rounded px-1.5 py-0.5 outline-none w-20 sm:w-24"
                  />
                ) : (
                  <span className="truncate max-w-[80px] sm:max-w-[120px] font-mono text-xs text-white">
                    {tab.title}
                  </span>
                )}

                <span className="text-[10px] text-[#71717a] uppercase font-mono shrink-0 hidden xs:inline">
                  {tab.language.slice(0, 3)}
                </span>

                {/* Rename button on hover */}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTabId(tab.id);
                      setEditTitle(tab.title);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-white text-[#71717a] p-0.5 rounded transition cursor-pointer"
                    title="Rename note"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                  </button>
                )}

                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-[#d71921] text-[#71717a] p-0.5 rounded transition cursor-pointer"
                    title="Close note"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={onAddTab}
            title="Add Note"
            className="p-1.5 text-[#71717a] hover:text-white hover:bg-[#18181b] border border-[#242428] rounded-full transition cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isUnlocked && (
          <>
            {/* Primary Action: Save Button (Always visible on all screens) */}
            <button
              onClick={onSave}
              disabled={saving}
              title={
                hasUnsavedChanges
                  ? 'Click to save'
                  : autoSaveEnabled
                  ? 'Auto-save active'
                  : 'All changes saved'
              }
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition duration-150 active:scale-95 cursor-pointer shrink-0 ${
                hasUnsavedChanges
                  ? 'bg-white hover:bg-[#d71921] text-black hover:text-white animate-pulse'
                  : 'bg-[#131315] text-[#a1a1aa] hover:text-white border border-[#242428] hover:border-[#38383e]'
              }`}
            >
              {saving ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3 h-3 text-[#d71921]" />
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

            {/* Split Preview (visible on tablet & desktop if markdown) */}
            {activeTab?.language === 'markdown' && (
              <button
                onClick={onToggleSplitView}
                title="Toggle Markdown Preview"
                className={`p-2 rounded-full text-xs font-medium flex items-center gap-1.5 transition border cursor-pointer shrink-0 ${
                  isSplitView
                    ? 'bg-[#18181b] text-white border-[#d71921]'
                    : 'text-[#a1a1aa] hover:text-white border-[#242428] hover:bg-[#131315]'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Desktop-only Inline Controls (Hidden on mobile/tablet < lg) */}
            <div className="hidden lg:flex items-center gap-1.5">
              {/* Active Language Selector */}
              {activeTab && (
                <select
                  value={activeTab.language}
                  onChange={(e) => onChangeLanguage(activeTab.id, e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono bg-[#131315] border border-[#242428] rounded-full text-[#e4e4e7] outline-none cursor-pointer hover:border-[#38383e]"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id} className="bg-[#131315] text-white">
                      {lang.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Change Master Password */}
              <button
                onClick={onOpenPasswordModal}
                title="Change Password"
                className="p-2 text-[#a1a1aa] hover:text-white hover:bg-[#131315] border border-[#242428] rounded-full transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>

              {/* Security & Lifecycle Settings */}
              <button
                onClick={onOpenSettings}
                title="Settings"
                className="p-2 text-[#a1a1aa] hover:text-white hover:bg-[#131315] border border-[#242428] rounded-full transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* Share & Export */}
              <button
                onClick={onOpenShare}
                title="Share Pad"
                className="p-2 text-[#a1a1aa] hover:text-white hover:bg-[#131315] border border-[#242428] rounded-full transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {/* Lock Pad in Place */}
              <button
                onClick={onLock}
                title="Lock Pad"
                className="p-2 text-[#a1a1aa] hover:text-[#d71921] hover:bg-[#18181b] border border-[#242428] rounded-full transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>

              {/* Log Out Option */}
              <button
                onClick={onLogout}
                title="Log out and Exit"
                className="px-2.5 py-1.5 text-xs font-mono text-[#a1a1aa] hover:text-[#d71921] hover:bg-[#18181b] border border-[#242428] hover:border-[#d71921]/40 rounded-full transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#d71921]" />
                <span className="text-[11px] font-medium">Log out</span>
              </button>
            </div>

            {/* Mobile / Tablet Quick Menu Button (Visible on < lg) */}
            <div className="flex lg:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                title="Pad Menu"
                className="p-2 text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-[#242428] rounded-full transition cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Theme Toggle (Desktop) */}
        <button
          onClick={onToggleTheme}
          title="Toggle Dark/Light Mode"
          className="hidden lg:flex p-2 text-[#a1a1aa] hover:text-white hover:bg-[#131315] border border-[#242428] rounded-full transition cursor-pointer"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Mobile / Tablet Quick Actions Dropdown */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-3 top-14 mt-1 w-64 bg-[#0e0e10] border border-[#242428] rounded-2xl shadow-2xl p-2 z-50 text-xs font-mono animate-fade-in space-y-1">
            {/* Header / Pad Status */}
            <div className="px-3 py-2 border-b border-[#242428] text-[11px] text-[#71717a] flex items-center justify-between">
              <span className="truncate max-w-[140px] font-bold text-white">Pad: {slug}</span>
              <span className={hasPassword ? 'text-white' : 'text-amber-400'}>
                {hasPassword ? 'Protected' : 'No Pass'}
              </span>
            </div>

            {/* Language Selector */}
            {activeTab && (
              <div className="px-3 py-2 flex items-center justify-between border-b border-[#242428]/60">
                <span className="text-[#a1a1aa]">Language</span>
                <select
                  value={activeTab.language}
                  onChange={(e) => {
                    onChangeLanguage(activeTab.id, e.target.value);
                    setMobileMenuOpen(false);
                  }}
                  className="px-2 py-1 text-xs font-mono bg-[#18181b] border border-[#242428] rounded-lg text-white outline-none cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id} className="bg-[#18181b] text-white">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Settings */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition text-left cursor-pointer min-h-[44px]"
            >
              <Settings className="w-4 h-4 text-[#d71921]" />
              <span>Pad Settings</span>
            </button>

            {/* Share & Export */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenShare();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition text-left cursor-pointer min-h-[44px]"
            >
              <Share2 className="w-4 h-4 text-[#d71921]" />
              <span>Share &amp; QR Code</span>
            </button>

            {/* Change Password */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPasswordModal();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition text-left cursor-pointer min-h-[44px]"
            >
              <KeyRound className="w-4 h-4 text-[#d71921]" />
              <span>{hasPassword ? 'Change Password' : 'Set Password'}</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => {
                onToggleTheme();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition text-left cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                <span>Theme</span>
              </div>
              <span className="text-[10px] text-[#71717a] font-bold">{isDark ? 'Dark' : 'Light'}</span>
            </button>

            <div className="border-t border-[#242428] my-1" />

            {/* Lock Pad */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLock();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition text-left cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Lock Pad</span>
            </button>

            {/* Log out */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#d71921] hover:bg-[#d71921]/10 transition text-left font-bold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </>
      )}
    </header>
  );
}
