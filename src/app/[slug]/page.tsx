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
  computeAuthProof,
  DecryptedPadData,
} from '@/lib/crypto';
import {
  Lock,
  ShieldCheck,
  Flame,
  AlertTriangle,
  RefreshCw,
  Clock,
} from 'lucide-react';

const MAX_PAD_CHARS = 500000;

const DEFAULT_INITIAL_TABS: PadTab[] = [
  {
    id: 'tab-1',
    title: 'note.txt',
    language: 'text',
    content: '',
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

  // Auto-Save State
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveMode, setAutoSaveMode] = useState<'smart' | 'interval'>('smart');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const firstUnsavedChangeTimeRef = useRef<number | null>(null);

  // UI state
  const [isDark, setIsDark] = useState(true);
  const [isSplitView, setIsSplitView] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [remoteUpdateAvailable, setRemoteUpdateAvailable] = useState<number | null>(null);

  // Modals
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Ephemeral TTL in minutes
  const [expiresInMinutes, setExpiresInMinutes] = useState<number | null>(null);

  // Active Tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Ref to hold latest state for callbacks
  const stateRef = useRef({
    version,
    password,
    hasUnsavedChanges,
    isUnlocked,
    tabs,
    activeTabId,
    decoyPassword,
    decoyContent,
    slug,
    padExists,
    expiresInMinutes,
    burnAfterRead,
  });

  useEffect(() => {
    stateRef.current = {
      version,
      password,
      hasUnsavedChanges,
      isUnlocked,
      tabs,
      activeTabId,
      decoyPassword,
      decoyContent,
      slug,
      padExists,
      expiresInMinutes,
      burnAfterRead,
    };
  }, [
    version,
    password,
    hasUnsavedChanges,
    isUnlocked,
    tabs,
    activeTabId,
    decoyPassword,
    decoyContent,
    slug,
    padExists,
    expiresInMinutes,
    burnAfterRead,
  ]);

  // Synchronize Dark / Light Theme with document.documentElement and localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('codedpad_theme');
    if (savedTheme) {
      const dark = savedTheme === 'dark';
      setIsDark(dark);
      document.documentElement.classList.toggle('dark', dark);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    }

    const savedAutoSave = localStorage.getItem('codedpad_autosave');
    if (savedAutoSave !== null) {
      setAutoSaveEnabled(savedAutoSave === 'true');
    }
  }, []);

  const handleToggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('codedpad_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handleAutoSaveToggle = (enabled: boolean) => {
    setAutoSaveEnabled(enabled);
    localStorage.setItem('codedpad_autosave', String(enabled));
  };

  // Fetch Pad on mount
  useEffect(() => {
    if (!slug) return;

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
    if (!isDifferent) {
      firstUnsavedChangeTimeRef.current = null;
    }
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
    setLastSavedTabs(JSON.parse(JSON.stringify(result.data.tabs)));
    if (result.data.activeTabId) {
      setActiveTabId(result.data.activeTabId);
    }
    setIsUnlocked(true);
    setIsDecoyActive(Boolean(result.isDecoy));
    setShowUnlockModal(false);

    if (burnAfterRead) {
      setStatusMessage('Warning: Burn-after-reading active! Note destroyed on server.');
    } else {
      setStatusMessage('Pad unlocked & decrypted successfully');
    }
    setTimeout(() => setStatusMessage(null), 4000);

    return true;
  };

  // Perform background sync when a remote update is detected
  const performRemoteSync = useCallback(async (incomingVersion?: number) => {
    try {
      const res = await fetch(`/api/pad/${slug}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.exists) return;

      const currentPwd = stateRef.current.password;
      if (!currentPwd) return;

      const result = await decryptPad(data.encryptedContent, currentPwd, slug);
      if (result.success && result.data) {
        setTabs(result.data.tabs);
        setLastSavedTabs(JSON.parse(JSON.stringify(result.data.tabs)));
        if (result.data.activeTabId) {
          setActiveTabId(result.data.activeTabId);
        }
        setVersion(data.version);
        setRawEncryptedJson(data.encryptedContent);
        setRemoteUpdateAvailable(null);
        setHasUnsavedChanges(false);

        setStatusMessage('Real-time sync completed');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      console.error('Remote sync error:', err);
    }
  }, [slug]);

  // Real-Time Synchronization Listener (Server-Sent Events + Polling Fallback)
  useEffect(() => {
    if (!slug) return;

    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource(`/api/pad/${slug}/events`);

      eventSource.addEventListener('pad_update', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const incomingVersion = Number(payload.version);
          const currentVersion = stateRef.current.version;
          const isCurrentlyUnlocked = stateRef.current.isUnlocked;

          if (incomingVersion > currentVersion && isCurrentlyUnlocked) {
            if (!stateRef.current.hasUnsavedChanges) {
              performRemoteSync(incomingVersion);
            } else {
              setRemoteUpdateAvailable(incomingVersion);
            }
          }
        } catch (err) {
          console.error('Failed to parse SSE pad_update:', err);
        }
      });
    } catch (err) {
      console.error('EventSource initialization failed:', err);
    }

    // Polling fallback every 4 seconds
    pollInterval = setInterval(async () => {
      if (!stateRef.current.isUnlocked) return;
      try {
        const res = await fetch(`/api/pad/${slug}?versionOnly=1`);
        if (res.ok) {
          const info = await res.json();
          if (info.exists && info.version > stateRef.current.version) {
            if (!stateRef.current.hasUnsavedChanges) {
              performRemoteSync(info.version);
            } else {
              setRemoteUpdateAvailable(info.version);
            }
          }
        }
      } catch {
        // Network silent catch
      }
    }, 4000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [slug, performRemoteSync]);

  // Save Pad handler
  const handleSave = useCallback(async (isSilent = false) => {
    const current = stateRef.current;
    if (!current.password) {
      if (!isSilent) {
        setShowPasswordSetupModal(true);
      }
      return;
    }

    setSaving(true);

    try {
      let expiryTimestamp: number | null = null;
      if (current.expiresInMinutes) {
        expiryTimestamp = Date.now() + current.expiresInMinutes * 60 * 1000;
      }

      // Build decoy payload if configured
      let decoyPayload: DecryptedPadData | undefined = undefined;
      if (current.decoyPassword && current.decoyContent) {
        decoyPayload = {
          tabs: [
            {
              id: 'decoy-1',
              title: 'general.txt',
              language: 'text',
              content: current.decoyContent,
            },
          ],
        };
      }

      // Check text limit (500,000 characters)
      const totalChars = current.tabs.reduce((acc, tab) => acc + (tab.content?.length || 0), 0);
      if (totalChars > MAX_PAD_CHARS) {
        setStatusMessage('Pad limit reached (500,000 characters maximum)');
        setTimeout(() => setStatusMessage(null), 4000);
        return;
      }

      // 1. Client-Side Encryption
      const encryptedPackage = await encryptPad({
        data: {
          tabs: current.tabs,
          activeTabId: current.activeTabId,
        },
        primaryPassword: current.password,
        decoyPassword: current.decoyPassword || undefined,
        decoyData: decoyPayload,
        slug: current.slug,
      });

      // 2. Compute Authorization Proof
      const authProof = await computeAuthProof(current.password, current.slug);

      // 3. Transmit to server
      const res = await fetch(`/api/pad/${current.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedContent: encryptedPackage,
          authProof,
          expectedVersion: current.padExists ? current.version : 1,
          expiresAt: expiryTimestamp,
          burnAfterRead: current.burnAfterRead,
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
      setLastSavedTabs(JSON.parse(JSON.stringify(current.tabs)));
      setHasUnsavedChanges(false);
      setRemoteUpdateAvailable(null);
      firstUnsavedChangeTimeRef.current = null;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(timeStr);

      if (!isSilent) {
        setStatusMessage('Saved');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Save error:', err);
      if (!isSilent) {
        alert('Save Error: ' + (err.message || 'Unable to save pad'));
      }
    } finally {
      setSaving(false);
    }
  }, []);

  // Smart Auto-Save Mechanism
  useEffect(() => {
    if (!autoSaveEnabled || !password || !isUnlocked || !hasUnsavedChanges || saving) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      return;
    }

    if (!firstUnsavedChangeTimeRef.current) {
      firstUnsavedChangeTimeRef.current = Date.now();
    }

    if (autoSaveMode === 'smart') {
      const timeSinceFirstChange = Date.now() - (firstUnsavedChangeTimeRef.current || Date.now());
      // Max wait safety ceiling: if user has been typing without pausing for 30 seconds, save anyway!
      if (timeSinceFirstChange >= 30000) {
        handleSave(true);
        return;
      }

      // Debounce: save 2.5 seconds after user pauses typing
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, 2500);
    } else {
      // Fixed 30s interval mode
      if (!autoSaveTimerRef.current) {
        autoSaveTimerRef.current = setTimeout(() => {
          handleSave(true);
        }, 30000);
      }
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [tabs, hasUnsavedChanges, autoSaveEnabled, autoSaveMode, password, isUnlocked, saving, handleSave]);

  // Save on tab blur or window minimize
  useEffect(() => {
    const handleBlur = () => {
      if (
        autoSaveEnabled &&
        stateRef.current.hasUnsavedChanges &&
        stateRef.current.password &&
        stateRef.current.isUnlocked
      ) {
        handleSave(true);
      }
    };

    window.addEventListener('blur', handleBlur);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleBlur();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [autoSaveEnabled, handleSave]);

  // Initial Password Set
  const handlePasswordSet = async (newPassword: string): Promise<boolean> => {
    setPassword(newPassword);
    setShowPasswordSetupModal(false);
    setTimeout(() => {
      handleSave(false);
    }, 100);
    return true;
  };

  // Lock Pad Session
  const handleLock = () => {
    setPassword('');
    setIsUnlocked(false);
    setShowUnlockModal(true);
  };

  // Logout and Exit
  const handleLogout = () => {
    setPassword('');
    setIsUnlocked(false);
    try {
      sessionStorage.removeItem(`codedpad_pwd_${slug}`);
      sessionStorage.removeItem(`codedpad_burn_${slug}`);
    } catch {}
    router.push('/');
  };

  // Keyboard Shortcuts: Ctrl+S / Cmd+S to save, Ctrl+L to lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isUnlocked) {
          handleSave(false);
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
    <div
      className={`h-[100dvh] min-h-[100dvh] w-full flex flex-col overflow-hidden font-sans transition-colors ${
        isDark ? 'dark bg-[#121214] text-[#f8fafc]' : 'bg-neutral-50 text-[#0f172a]'
      }`}
    >
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
        onSave={() => handleSave(false)}
        onLock={handleLock}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenShare={() => setShowShareModal(true)}
        onOpenPasswordModal={() => setShowPasswordSetupModal(true)}
        isSplitView={isSplitView}
        onToggleSplitView={() => setIsSplitView(!isSplitView)}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        isDecoyActive={isDecoyActive}
        hasPassword={Boolean(password)}
        saving={saving}
        lastSavedTime={lastSavedTime}
        autoSaveEnabled={autoSaveEnabled}
      />

      {/* Real-time Update Notification Bar */}
      {remoteUpdateAvailable && (
        <div className="bg-amber-500 text-neutral-900 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>This pad was updated from another device (Version {remoteUpdateAvailable}).</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => performRemoteSync(remoteUpdateAvailable)}
              className="px-3 py-1 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition"
            >
              Sync Latest Changes
            </button>
            <button
              onClick={() => setRemoteUpdateAvailable(null)}
              className="px-2 py-1 text-neutral-800 hover:text-black transition"
            >
              Keep My Version
            </button>
          </div>
        </div>
      )}

      {/* Unsaved changes without password reminder banner */}
      {!password && isUnlocked && !loading && hasUnsavedChanges && (
        <div className="bg-[#18181b] border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs font-mono text-amber-300 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              You haven&apos;t set a password yet — auto-save is paused until a password is set.
            </span>
          </div>
          <button
            onClick={() => setShowPasswordSetupModal(true)}
            className="px-3.5 py-1 bg-white hover:bg-amber-400 text-black font-bold rounded-full text-xs transition uppercase tracking-wider cursor-pointer"
          >
            Set Password
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-[#0e0e10]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/20 border-t-[#d71921] rounded-full animate-spin" />
              <span className="text-xs font-mono text-[#a1a1aa]">Loading pad...</span>
            </div>
          </div>
        ) : !isUnlocked ? (
          /* Locked Pad Overlay Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0e0e10]">
            <div className="w-14 h-14 rounded-2xl bg-[#18181b] border border-[#242428] flex items-center justify-center text-[#d71921] mb-4 shadow-xl">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-headline font-bold text-white">This Pad is Locked</h1>
            <p className="mt-1.5 text-xs text-[#a1a1aa] max-w-sm font-sans">
              The notes for <span className="font-mono font-bold text-white px-2 py-0.5 bg-[#18181b] rounded border border-[#242428]">{slug}</span> are password protected.
            </p>
            <button
              onClick={() => setShowUnlockModal(true)}
              className="mt-6 px-6 py-2.5 bg-white hover:bg-[#d71921] text-black hover:text-white rounded-full text-xs font-mono font-bold tracking-wider transition flex items-center gap-2 shadow-lg"
            >
              <Lock className="w-4 h-4" />
              <span>Enter Password to Unlock</span>
            </button>
          </div>
        ) : (
          /* Unlocked Workspace: Editor and Split Preview */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0 min-w-0">
            {/* CodeMirror Editor Pane */}
            <div
              className={`flex flex-col min-w-0 min-h-0 ${
                isSplitView && activeTab?.language === 'markdown'
                  ? 'h-1/2 md:h-full md:w-1/2 border-b md:border-b-0 md:border-r border-[#242428]'
                  : 'h-full w-full'
              }`}
            >
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
              <div className="h-1/2 md:h-full md:w-1/2 overflow-hidden min-w-0 min-h-0">
                <MarkdownPreview content={activeTab?.content || ''} isDark={isDark} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar Footer */}
      <footer className="h-7 border-t border-[#242428] bg-black px-3 sm:px-4 flex items-center justify-between text-[11px] font-mono text-[#71717a] select-none shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 truncate">
          <span className="flex items-center gap-1.5 text-white font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d71921]" />
            Protected
          </span>

          <span className="text-[#38383e] hidden xs:inline">|</span>

          {/* Auto-save status with clear password requirement note */}
          {!password ? (
            <button
              onClick={() => setShowPasswordSetupModal(true)}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium transition cursor-pointer truncate"
              title="Click to set password and enable auto-save"
            >
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">Auto-save paused</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 text-[#a1a1aa] shrink-0">
              <Clock className="w-3 h-3 text-[#d71921]" />
              <span className="hidden sm:inline">Auto-save: {autoSaveEnabled ? 'ON' : 'OFF'}</span>
              <span className="sm:hidden">Auto: {autoSaveEnabled ? 'ON' : 'OFF'}</span>
            </span>
          )}

          {statusMessage && (
            <span className="text-white font-mono font-medium animate-pulse ml-2 px-1.5 py-0.5 bg-[#d71921] rounded text-[10px] shrink-0">
              {statusMessage}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-[#a1a1aa] shrink-0 text-[10px] sm:text-[11px]">
          <span className="hidden md:inline">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="hidden sm:inline">{lineCount} lines</span>
          <span className="hidden lg:inline">{wordCount} words</span>
          <span className={charCount > 450000 ? 'text-[#d71921] font-bold' : ''}>
            {charCount > 9999 ? `${(charCount / 1000).toFixed(0)}k` : charCount.toLocaleString()} / 500k
          </span>
          <span className="hidden sm:inline">UTF-8</span>
        </div>
      </footer>

      {/* Unlock Existing Pad Modal */}
      <PasswordModal
        isOpen={showUnlockModal}
        onSubmit={handleUnlock}
        title="Unlock Pad"
        description={`Enter password to view notes for ${slug}.`}
        submitButtonText="Unlock Pad"
        isInitialSetup={false}
        slug={slug}
        onSuggestAlternative={(newSlug) => router.push(`/${newSlug}`)}
      />

      {/* Set Master Password for New Pad or Change Modal */}
      <PasswordModal
        isOpen={showPasswordSetupModal}
        onClose={() => setShowPasswordSetupModal(false)}
        onSubmit={handlePasswordSet}
        title={password ? 'Change Password' : 'Protect Your Pad'}
        description="Please choose a password to protect your pad so only you can access it."
        submitButtonText="Save & Protect"
        isInitialSetup={true}
        slug={slug}
      />

      {/* Settings Modal (TTL, Burn-after-read, Decoy Password, Auto-Save) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        expiresInMinutes={expiresInMinutes}
        onExpiresChange={setExpiresInMinutes}
        burnAfterRead={burnAfterRead}
        onBurnAfterReadChange={setBurnAfterRead}
        autoSaveEnabled={autoSaveEnabled}
        onAutoSaveEnabledChange={handleAutoSaveToggle}
        autoSaveMode={autoSaveMode}
        onAutoSaveModeChange={setAutoSaveMode}
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
