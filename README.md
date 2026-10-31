# CodedPad (Next-Gen Zero-Knowledge Notepad)

An enterprise-grade, client-side encrypted developer notepad and code editor cloned and upgraded from the **CodedPad / ProtectedText** architecture.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **CodeMirror 6**, and **Native Web Crypto API**.

---

## 🔒 Cryptographic Architecture

CodedPad operates on a **Strict Zero-Knowledge (ZK)** model:

1. **Hardware-Accelerated AES-GCM (256-bit):**
   * Uses the native browser `crypto.subtle` API.
   * Every save operation generates a fresh 12-byte cryptographically secure random Initialization Vector (IV).
2. **Key Derivation (PBKDF2):**
   * Password is never transmitted to the server.
   * Stretched using PBKDF2 with SHA-256 and **100,000 iterations** against a unique 16-byte random salt per save.
3. **Site-Binding & Anti-Replay Tags:**
   * Plaintext payloads are cryptographically bound to the pad's URL slug:
     $$\text{SiteHash} = \text{SHA256}("/" + \text{slug})$$
   * Prevents replaying or transferring ciphertexts across different pad identifiers.
4. **Plausible Deniability (Duress Decoy Vault):**
   * Support for a secondary **Decoy Password**.
   * If an operator is coerced to disclose their password, typing the decoy password decrypts a secondary benign dummy note while leaving the primary secrets hidden and mathematically indistinguishable.
5. **Zero-Knowledge Optimistic Concurrency Control:**
   * Server validates `initHashContent` before permitting writes:
     $$\text{WriteProof} = \text{SHA512}(\text{Content} \mathbin{\Vert} \text{SHA512}(\text{Password})) + \text{Version}$$
   * Prevents overwriting concurrent edits while proving authorization without the server ever holding plaintext or passwords.

---

## 🚀 Key Upgrades Over Original CodedPad

| Feature | Original CodedPad / ProtectedText | Upgraded CodedPad |
| :--- | :--- | :--- |
| **Code Editor** | Plain `<textarea>` | **CodeMirror 6** with syntax highlighting (JS, TS, Python, C++, HTML, CSS, JSON, SQL, Markdown) |
| **Markdown** | None | **Live Split-Pane Markdown Preview** (GitHub Flavored Markdown) |
| **Multi-Tabs** | Monolithic text with parsing hacks | **Dynamic Tab Manager** with per-tab language selection & renaming |
| **Cryptography** | Outdated CryptoJS (AES-CBC) | Native **SubtleCrypto AES-GCM-256** + PBKDF2 (100k rounds) |
| **Plausible Deniability** | ❌ No | ✅ **Duress Decoy Password** slot |
| **Ephemeral Life** | Indefinite retention only | ✅ **Burn-After-Reading** & customizable TTL (1h, 24h, 7d, 30d) |
| **Sharing & Export** | URL only | ✅ **Live Mobile QR Code Generator**, `.md` & encrypted `.codedpad.json` backup |
| **Database** | Legacy server backend | High-performance **Persistent SQLite** (`node:sqlite`) |

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suite
Verifies AES-GCM encryption, decryption rejection on invalid keys, concurrency control, and burn-after-reading:
```bash
npm test
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
├── data/                      # Local persistent SQLite storage (codedpad.db)
├── src/
│   ├── app/
│   │   ├── [slug]/page.tsx    # Core Pad Workspace (CodeMirror, Tabs, Decryption)
│   │   ├── api/pad/[slug]/    # Zero-Knowledge CRUD endpoints
│   │   ├── globals.css        # Tailwind directives and CodeMirror styling
│   │   ├── layout.tsx         # Root layout with dark mode
│   │   └── page.tsx           # Landing page with instant Pad creator
│   ├── components/
│   │   ├── CodeEditor.tsx     # CodeMirror 6 with syntax highlighting
│   │   ├── MarkdownPreview.tsx# Live split-pane Markdown renderer
│   │   ├── Navbar.tsx         # Top bar with tab manager & quick actions
│   │   ├── PasswordModal.tsx  # Passphrase setup & unlock with entropy meter
│   │   ├── SettingsModal.tsx  # TTL, burn-after-reading & duress setup
│   │   └── ShareModal.tsx     # QR code generation & offline exports
│   └── lib/
│       ├── crypto.ts          # Web Crypto API engine (AES-GCM, PBKDF2)
│       └── db.ts              # SQLite database layer with concurrency control
├── test-suite.mjs             # End-to-end cryptographic and storage test suite
└── package.json
```
