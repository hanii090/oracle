'use client';

import { useCallback } from 'react';
import type { Message } from './session/ChatMessage';

interface SessionExportProps {
  messages: Message[];
  depth: number;
}

/**
 * Session export — download as Markdown or copy to clipboard.
 */
export function SessionExport({ messages, depth }: SessionExportProps) {
  const generateMarkdown = useCallback(() => {
    const date = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let md = `# Oracle Session\n\n`;
    md += `**Date:** ${date}\n`;
    md += `**Maximum Depth:** ${depth}\n`;
    md += `**Exchanges:** ${messages.length}\n\n`;
    md += `---\n\n`;

    for (const msg of messages) {
      if (msg.role === 'oracle') {
        md += `### 🔮 Oracle (Depth ${msg.depth})\n\n`;
        md += `> ${msg.content}\n\n`;
      } else {
        md += `### You\n\n`;
        md += `${msg.content}\n\n`;
      }
    }

    md += `---\n\n`;
    md += `*Exported from Oracle — The AI that never answers.*\n`;

    return md;
  }, [messages, depth]);

  const handleDownload = useCallback(() => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oracle-session-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generateMarkdown]);

  const handleCopy = useCallback(async () => {
    const md = generateMarkdown();
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = md;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [generateMarkdown]);

  if (messages.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownload}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition-all duration-300"
        aria-label="Download session as Markdown"
        title="Download session"
      >
        ⬇️
      </button>
      <button
        onClick={handleCopy}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition-all duration-300"
        aria-label="Copy session to clipboard"
        title="Copy session"
      >
        📋
      </button>
    </div>
  );
}
