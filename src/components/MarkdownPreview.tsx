'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  isDark: boolean;
}

export default function MarkdownPreview({ content, isDark }: MarkdownPreviewProps) {
  return (
    <div
      className={`h-full overflow-y-auto px-8 py-6 prose max-w-none transition-colors ${
        isDark
          ? 'prose-invert bg-[#1e1e24] text-neutral-200 prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800'
          : 'bg-white text-neutral-800 prose-pre:bg-neutral-50 prose-pre:border prose-pre:border-neutral-200'
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-neutral-300 dark:divide-neutral-700 border" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-left font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-800" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-emerald-500 hover:text-emerald-600 underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return (
              <code
                className={`rounded px-1.5 py-0.5 font-mono text-[13px] ${
                  isDark ? 'bg-neutral-800 text-emerald-400' : 'bg-neutral-100 text-emerald-700'
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content || '*No content to preview*'}
      </ReactMarkdown>
    </div>
  );
}
