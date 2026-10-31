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
      QRCode.toDataURL(fullUrl, { width: 220, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-md bg-[#0e0e10] border border-[#242428] rounded-3xl shadow-2xl p-5 sm:p-7 relative max-h-[90dvh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#71717a] hover:text-white rounded-full hover:bg-[#18181b] border border-[#242428] transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#18181b] border border-[#242428] text-[#d71921] flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-headline font-bold text-white uppercase tracking-tight">
              Share &amp; Export
            </h2>
            <p className="text-xs text-[#a1a1aa] font-mono leading-relaxed">
              Open instantly on mobile via QR or export an encrypted backup
            </p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center my-4 p-5 bg-black rounded-2xl border border-[#242428]">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="Pad QR Code" className="w-44 h-44 rounded-xl bg-white p-2 shadow-sm" />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center text-xs font-mono text-[#71717a]">
              Generating QR...
            </div>
          )}
          <span className="text-[11px] font-mono text-[#71717a] mt-2.5">
            Scan with phone camera to open on mobile
          </span>
        </div>

        {/* URL Input */}
        <div className="flex items-center gap-2 mb-4 bg-black border border-[#242428] rounded-2xl p-1.5 focus-within:border-white transition-colors">
          <input
            type="text"
            readOnly
            value={fullUrl}
            className="flex-1 px-3 py-1.5 text-xs bg-transparent border-none font-mono text-[#e4e4e7] outline-none select-all"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-white hover:bg-[#d71921] text-black hover:text-white rounded-full flex items-center gap-1.5 transition shrink-0 shadow-none"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Exports */}
        <div className="space-y-2 pt-2 border-t border-[#242428] font-mono">
          <button
            onClick={handleDownloadPlaintext}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#242428] hover:border-[#38383e] hover:bg-[#131315] text-xs text-[#e4e4e7] transition"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#d71921]" />
              <span>Download Text File (.md)</span>
            </div>
            <Download className="w-3.5 h-3.5 text-[#71717a]" />
          </button>

          {rawEncryptedJson && (
            <button
              onClick={handleDownloadEncrypted}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#242428] hover:border-[#38383e] hover:bg-[#131315] text-xs text-[#e4e4e7] transition"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#d71921]" />
                <span>Download Backup File (.json)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-[#71717a]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
