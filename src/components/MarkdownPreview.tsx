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
      className={`h-full overflow-y-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 prose max-w-none transition-colors ${
        isDark
          ? 'prose-invert bg-[#141416] text-neutral-200 prose-pre:bg-[#0e0e10] prose-pre:border prose-pre:border-[#242428]'
          : 'bg-white text-neutral-800 prose-pre:bg-neutral-50 prose-pre:border prose-pre:border-neutral-200'
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-[#242428] border border-[#242428]" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="px-3 py-2 bg-[#18181b] text-left font-semibold text-white" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 border-t border-[#242428]" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-[#d71921] hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return (
              <code
                className={`rounded px-1.5 py-0.5 font-mono text-[12.5px] ${
                  isDark ? 'bg-[#18181b] text-white border border-[#242428]' : 'bg-neutral-100 text-neutral-800'
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
