'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Share2, Copy, Check, Download, FileText, Lock, X } from 'lucide-react';
import { PadTab } from '@/lib/crypto';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  tabs: PadTab[];
  rawEncryptedJson?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  slug,
  tabs,
  rawEncryptedJson,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`;

  useEffect(() => {
    if (isOpen && fullUrl) {
      QRCode.toDataURL(fullUrl, { width: 220, margin: 1 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR code generation failed:', err));
    }
  }, [isOpen, fullUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPlaintext = () => {
    const combined = tabs.map((t) => `=== ${t.title} (${t.language}) ===\n\n${t.content}`).join('\n\n\n');
    const blob = new Blob([combined], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadEncrypted = () => {
    if (!rawEncryptedJson) return;
    const blob = new Blob([rawEncryptedJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-backup.codedpad.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Share & Export</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Open on phone via QR or save an offline encrypted backup
            </p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center my-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="Pad QR Code" className="w-44 h-44 rounded-xl shadow-sm bg-white p-2" />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center text-xs text-neutral-400">
              Generating QR...
            </div>
          )}
          <span className="text-[11px] text-neutral-400 mt-2">Scan with camera to open on mobile</span>
        </div>

        {/* URL Input */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            readOnly
            value={fullUrl}
            className="flex-1 px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-mono text-neutral-700 dark:text-neutral-300 select-all"
          />
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 transition shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Exports */}
        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={handleDownloadPlaintext}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Download Decrypted Markdown (`.md`)</span>
            </div>
            <Download className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {rawEncryptedJson && (
            <button
              onClick={handleDownloadEncrypted}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Export Encrypted Backup (`.codedpad.json`)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
