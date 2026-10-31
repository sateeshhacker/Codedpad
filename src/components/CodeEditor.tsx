'use client';

import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { markdown } from '@codemirror/lang-markdown';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { cpp } from '@codemirror/lang-cpp';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language: string;
  isDark: boolean;
  onCursorChange?: (line: number, col: number) => void;
}

export const SUPPORTED_LANGUAGES = [
  { id: 'markdown', name: 'Markdown' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'json', name: 'JSON' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'cpp', name: 'C++' },
  { id: 'sql', name: 'SQL' },
  { id: 'text', name: 'Plain Text' },
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
    switch (language.toLowerCase()) {
      case 'javascript':
        list.push(javascript({ jsx: true }));
        break;
      case 'typescript':
        list.push(javascript({ jsx: true, typescript: true }));
        break;
      case 'python':
        list.push(python());
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
    return list;
  }, [language]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-sm">
      <CodeMirror
        value={value}
        height="100%"
        theme={isDark ? oneDark : undefined}
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
