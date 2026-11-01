'use client';

import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { markdown } from '@codemirror/lang-markdown';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { cpp } from '@codemirror/lang-cpp';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: string;
  isDark: boolean;
  onCursorChange?: (line: number, col: number) => void;
}

export const SUPPORTED_LANGUAGES = [
  { id: 'text', name: 'Plain Text' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'java', name: 'Java' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'cpp', name: 'C++' },
  { id: 'rust', name: 'Rust' },
  { id: 'go', name: 'Go' },
  { id: 'json', name: 'JSON' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'sql', name: 'SQL' },
];

export default function CodeEditor({
  value,
  onChange,
  language,
  isDark,
  onCursorChange,
}: CodeEditorProps) {
  const extensions = useMemo(() => {
    const list = [];

    // Language extension
    switch (language.toLowerCase()) {
      case 'java':
        list.push(java());
        break;
      case 'javascript':
        list.push(javascript({ jsx: true }));
        break;
      case 'typescript':
        list.push(javascript({ jsx: true, typescript: true }));
        break;
      case 'python':
        list.push(python());
        break;
      case 'rust':
        list.push(rust());
        break;
      case 'go':
        list.push(go());
        break;
      case 'markdown':
        list.push(markdown());
        break;
      case 'html':
        list.push(html());
        break;
      case 'css':
        list.push(css());
        break;
      case 'json':
        list.push(json());
        break;
      case 'cpp':
        list.push(cpp());
        break;
      case 'sql':
        list.push(sql());
        break;
      default:
        break;
    }

    // High contrast theme overrides for 100% visible text in dark and light modes
    const contrastTheme = EditorView.theme(
      isDark
        ? {
            '&': {
              backgroundColor: '#141416 !important',
              color: '#f8fafc !important',
            },
            '.cm-content': {
              caretColor: '#ffffff !important',
              color: '#f8fafc !important',
            },
            '.cm-cursor, .cm-dropCursor': {
              borderLeftColor: '#d71921 !important',
              borderLeftWidth: '2px !important',
            },
            '.cm-gutters': {
              backgroundColor: '#0f0f11 !important',
              color: '#64748b !important',
              borderRight: '1px solid #27272a !important',
            },
            '.cm-activeLine': {
              backgroundColor: '#1b1b1f !important',
            },
            '.cm-activeLineGutter': {
              backgroundColor: '#1b1b1f !important',
              color: '#ffffff !important',
            },
            '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection, .cm-line ::selection, .cm-line span::selection, ::selection': {
              backgroundColor: 'rgba(215, 25, 33, 0.55) !important',
            },
            '.cm-selectionMatch': {
              backgroundColor: 'rgba(255, 255, 255, 0.12) !important',
              outline: '1px solid rgba(255, 255, 255, 0.25) !important',
            },
          }
        : {
            '&': {
              backgroundColor: '#ffffff !important',
              color: '#0f172a !important',
            },
            '.cm-content': {
              caretColor: '#0f172a !important',
              color: '#0f172a !important',
            },
            '.cm-cursor, .cm-dropCursor': {
              borderLeftColor: '#d71921 !important',
              borderLeftWidth: '2px !important',
            },
            '.cm-gutters': {
              backgroundColor: '#f8fafc !important',
              color: '#94a3b8 !important',
              borderRight: '1px solid #e2e8f0 !important',
            },
            '.cm-activeLine': {
              backgroundColor: '#f1f5f9 !important',
            },
            '.cm-activeLineGutter': {
              backgroundColor: '#f1f5f9 !important',
              color: '#d71921 !important',
            },
            '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection, .cm-line ::selection, .cm-line span::selection, ::selection': {
              backgroundColor: 'rgba(215, 25, 33, 0.3) !important',
            },
            '.cm-selectionMatch': {
              backgroundColor: 'rgba(0, 0, 0, 0.08) !important',
              outline: '1px solid rgba(0, 0, 0, 0.2) !important',
            },
          },
      { dark: isDark }
    );

    if (isDark) {
      list.push(oneDark);
    }
    list.push(contrastTheme);
    list.push(EditorView.lineWrapping);

    return list;
  }, [language, isDark]);

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden text-sm transition-colors ${
        isDark ? 'bg-[#141416] text-[#f8fafc]' : 'bg-white text-[#0f172a]'
      }`}
    >
      <CodeMirror
        value={value}
        height="100%"
        theme={isDark ? 'dark' : 'light'}
        extensions={extensions}
        onChange={onChange}
        onUpdate={(viewUpdate) => {
          if (onCursorChange && viewUpdate.state.selection.main) {
            const head = viewUpdate.state.selection.main.head;
            const line = viewUpdate.state.doc.lineAt(head);
            const col = head - line.from + 1;
            onCursorChange(line.number, col);
          }
        }}
        className="h-full font-mono text-[13.5px] leading-relaxed select-text"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
    </div>
  );
}
