'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CodeEditor from '@/components/CodeEditor';
import MarkdownPreview from '@/components/MarkdownPreview';
import PasswordModal from '@/components/PasswordModal';
import SettingsModal from '@/components/SettingsModal';
import ShareModal from '@/components/ShareModal';
import {
  PadTab,
  decryptPad,
  encryptPad,
  generateWriteProof,
  DecryptedPadData,
} from '@/lib/crypto';
import {
  Lock,
  ShieldCheck,
  Flame,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const DEFAULT_INITIAL_TABS: PadTab[] = [
  {
    id: 'tab-1',
    title: 'notes.md',
    language: 'markdown',
    content: `# Welcome to your CodedPad 🔒\n\nThis note is zero-knowledge encrypted in your browser using **hardware-accelerated AES-GCM-256**.\n\n### Quick Features:\n- ✍️ **Code & Text:** Syntax highlighting for 50+ languages.\n- 👁️ **Live Split Markdown:** Toggle the columns icon on the top bar.\n- 🔐 **Plausible Deniability:** Configure an alternate decoy password under Settings.\n- 🔥 **Burn-After-Reading & TTL:** Auto-destruct notes after reading.\n- ⌨️ **Keyboard Shortcut:** Press \`Ctrl+S\` (or \`Cmd+S\`) to encrypt and save.\n`,
  },
];

export default function PadPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string)?.toLowerCase();

  // Loading & Network State
  const [loading, setLoading] = useState(true);
  const [padExists, setPadExists] = useState(false);
  const [rawEncryptedJson, setRawEncryptedJson] = useState<string>('');
  const [version, setVersion] = useState(1);
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  // Pad Session State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [decoyPassword, setDecoyPassword] = useState<string>('');
  const [decoyContent, setDecoyContent] = useState<string>('');
  const [isDecoyActive, setIsDecoyActive] = useState(false);

  // Content State
  const [tabs, setTabs] = useState<PadTab[]>(DEFAULT_INITIAL_TABS);
  const [lastSavedTabs, setLastSavedTabs] = useState<PadTab[]>(DEFAULT_INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // UI state
  const [isDark, setIsDark] = useState(true);
  const [isSplitView, setIsSplitView] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Modals
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Ephemeral TTL in minutes
  const [expiresInMinutes, setExpiresInMinutes] = useState<number | null>(null);

  // Active Tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Fetch Pad on mount
  useEffect(() => {
    if (!slug) return;

    // Load dark mode preference from local storage or match media
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);

    async function fetchPad() {
      setLoading(true);
      try {
        const res = await fetch(`/api/pad/${slug}`);
        if (!res.ok) {
          throw new Error('Failed to fetch pad');
        }
        const data = await res.json();

        if (data.exists) {
          setPadExists(true);
          setRawEncryptedJson(data.encryptedContent);
          setVersion(data.version);
          setBurnAfterRead(Boolean(data.burnAfterRead));
          setExpiresAt(data.expiresAt);
          setIsUnlocked(false);
          setShowUnlockModal(true);
        } else {
          // Brand new pad
          setPadExists(false);
          setIsUnlocked(true);
          setTabs(DEFAULT_INITIAL_TABS);
          setLastSavedTabs(DEFAULT_INITIAL_TABS);
        }
      } catch (err) {
        console.error('Fetch pad error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPad();
  }, [slug]);

  // Dirty state tracking
  useEffect(() => {
    const isDifferent = JSON.stringify(tabs) !== JSON.stringify(lastSavedTabs);
    setHasUnsavedChanges(isDifferent);
  }, [tabs, lastSavedTabs]);

  // Unlock existing pad
  const handleUnlock = async (pwd: string): Promise<boolean> => {
    if (!rawEncryptedJson) return false;

    const result = await decryptPad(rawEncryptedJson, pwd, slug);
    if (!result.success || !result.data) {
      return false;
    }

    setPassword(pwd);
    setTabs(result.data.tabs);
    setLastSavedTabs(result.data.tabs);
    if (result.data.activeTabId) {
      setActiveTabId(result.data.activeTabId);
    }
    setIsUnlocked(true);
    setIsDecoyActive(Boolean(result.isDecoy));
    setShowUnlockModal(false);

    if (burnAfterRead) {
      setStatusMessage('Warning: Burn-after-reading active! This note has now self-destructed on the server.');
    } else {
      setStatusMessage('Pad unlocked & decrypted successfully');
    }
    setTimeout(() => setStatusMessage(null), 4000);

    return true;
  };

  // Save Pad handler
  const handleSave = useCallback(async () => {
    if (!password) {
      // Must set a password before first save
      setShowPasswordSetupModal(true);
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      let expiryTimestamp: number | null = null;
      if (expiresInMinutes) {
        expiryTimestamp = Date.now() + expiresInMinutes * 60 * 1000;
      }

      // Build decoy payload if configured
      let decoyPayload: DecryptedPadData | undefined = undefined;
      if (decoyPassword && decoyContent) {
        decoyPayload = {
          tabs: [
            {
              id: 'decoy-1',
              title: 'general.txt',
              language: 'text',
              content: decoyContent,
            },
          ],
        };
      }

      // 1. Client-Side Hardware Encryption
      const encryptedPackage = await encryptPad({
        data: {
          tabs,
          activeTabId,
        },
        primaryPassword: password,
        decoyPassword: decoyPassword || undefined,
        decoyData: decoyPayload,
        slug,
      });

      // 2. Generate Zero-Knowledge Write Proofs
      const initHash = padExists
        ? await generateWriteProof(lastSavedTabs, password, version)
        : '';
      const currentHash = await generateWriteProof(tabs, password, padExists ? version : 1);

      // 3. Transmit only ciphertext and proofs to server
      const res = await fetch(`/api/pad/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedContent: encryptedPackage,
          initHash: padExists ? initHash : undefined,
          currentHash,
          expiresAt: expiryTimestamp,
          burnAfterRead,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Save failed');
      }

      const responseData = await res.json();
      setPadExists(true);
      setRawEncryptedJson(encryptedPackage);
      setVersion(responseData.version);
      setLastSavedTabs(tabs);
      setHasUnsavedChanges(false);

      setStatusMessage('Changes encrypted and saved to cloud.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Save Error: ' + (err.message || 'Unable to save pad'));
    } finally {
      setSaving(false);
    }
  }, [
    password,
    decoyPassword,
    decoyContent,
    tabs,
    activeTabId,
    lastSavedTabs,
    slug,
    padExists,
    version,
    expiresInMinutes,
    burnAfterRead,
  ]);

  // Initial Password Set
  const handlePasswordSet = async (newPassword: string): Promise<boolean> => {
    setPassword(newPassword);
    setShowPasswordSetupModal(false);
    // Proceed directly to save with the newly set password
    setTimeout(() => {
      handleSave();
    }, 100);
    return true;
  };

  // Lock Pad Session
  const handleLock = () => {
    setPassword('');
    setIsUnlocked(false);
    setShowUnlockModal(true);
  };

  // Keyboard Shortcuts: Ctrl+S / Cmd+S to save, Ctrl+L to lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isUnlocked) {
          handleSave();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (isUnlocked) {
          handleLock();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, handleSave]);

  // Tab Operations
  const handleAddTab = () => {
    const newId = 'tab-' + (tabs.length + 1);
    const newTab: PadTab = {
      id: newId,
      title: `file-${tabs.length + 1}.txt`,
      language: 'text',
      content: '',
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length <= 1) return;
    const filtered = tabs.filter((t) => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[0].id);
    }
  };

  const handleRenameTab = (id: string, newTitle: string) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, title: newTitle } : t)));
  };

  const handleChangeLanguage = (id: string, lang: string) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, language: lang } : t)));
  };

  const handleContentChange = (val: string) => {
    setTabs(tabs.map((t) => (t.id === activeTabId ? { ...t, content: val } : t)));
  };

  // Statistics
  const currentContent = activeTab?.content || '';
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;
  const charCount = currentContent.length;
  const lineCount = currentContent.split('\n').length;

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans ${isDark ? 'dark bg-[#121214]' : 'bg-neutral-50'}`}>
      {/* Top Navigation */}
      <Navbar
        slug={slug}
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onAddTab={handleAddTab}
        onCloseTab={handleCloseTab}
        onRenameTab={handleRenameTab}
        onChangeLanguage={handleChangeLanguage}
        isUnlocked={isUnlocked}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onLock={handleLock}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenShare={() => setShowShareModal(true)}
        onOpenPasswordModal={() => setShowPasswordSetupModal(true)}
        isSplitView={isSplitView}
        onToggleSplitView={() => setIsSplitView(!isSplitView)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        isDecoyActive={isDecoyActive}
        saving={saving}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-xs font-mono text-neutral-500">Checking pad encryption status...</span>
            </div>
          </div>
        ) : !isUnlocked ? (
          /* Locked Pad Overlay Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-emerald-500 mb-4 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">This CodedPad is Encrypted</h1>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
              The contents of <span className="font-mono text-emerald-500 font-semibold">{slug}</span> are locked with
              AES-GCM-256. Enter the passphrase to decrypt in your browser.
            </p>
            <button
              onClick={() => setShowUnlockModal(true)}
              className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock Pad</span>
            </button>
          </div>
        ) : (
          /* Unlocked Workspace: Editor and Split Preview */
          <div className="flex-1 flex overflow-hidden">
            {/* CodeMirror Editor Pane */}
            <div className={`h-full flex flex-col ${isSplitView && activeTab?.language === 'markdown' ? 'w-1/2 border-r border-neutral-200 dark:border-neutral-800' : 'w-full'}`}>
              <CodeEditor
                value={activeTab?.content || ''}
                onChange={handleContentChange}
                language={activeTab?.language || 'text'}
                isDark={isDark}
                onCursorChange={(line, col) => setCursorPos({ line, col })}
              />
            </div>

            {/* Live Markdown Split Preview */}
            {isSplitView && activeTab?.language === 'markdown' && (
              <div className="w-1/2 h-full overflow-hidden">
                <MarkdownPreview content={activeTab?.content || ''} isDark={isDark} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar Footer */}
      <footer className="h-7 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 flex items-center justify-between text-[11px] font-mono text-neutral-500 select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            AES-GCM-256 (ZK)
          </span>

          {statusMessage && (
            <span className="text-amber-500 dark:text-amber-400 font-sans font-semibold animate-pulse">
              {statusMessage}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>{lineCount} lines</span>
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
          <span className="hidden sm:inline">UTF-8</span>
        </div>
      </footer>

      {/* Unlock Existing Pad Modal */}
      <PasswordModal
        isOpen={showUnlockModal}
        onSubmit={handleUnlock}
        title="Unlock CodedPad"
        description={`Enter the passphrase to decrypt /${slug} locally in your browser.`}
        submitButtonText="Decrypt & Open"
        isInitialSetup={false}
      />

      {/* Set Master Password for New Pad or Change Modal */}
      <PasswordModal
        isOpen={showPasswordSetupModal}
        onClose={() => setShowPasswordSetupModal(false)}
        onSubmit={handlePasswordSet}
        title={password ? 'Change Pad Passphrase' : 'Set Master Passphrase'}
        description="Your passphrase derives the 256-bit AES encryption key. It is never transmitted to the server."
        submitButtonText="Save Passphrase & Encrypt"
        isInitialSetup={true}
      />

      {/* Settings Modal (TTL, Burn-after-read, Decoy Password) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        expiresInMinutes={expiresInMinutes}
        onExpiresChange={setExpiresInMinutes}
        burnAfterRead={burnAfterRead}
        onBurnAfterReadChange={setBurnAfterRead}
        decoyPassword={decoyPassword}
        onDecoyPasswordChange={setDecoyPassword}
        decoyNoteContent={decoyContent}
        onDecoyNoteContentChange={setDecoyContent}
      />

      {/* Share & Export Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        slug={slug}
        tabs={tabs}
        rawEncryptedJson={rawEncryptedJson}
      />
    </div>
  );
}
