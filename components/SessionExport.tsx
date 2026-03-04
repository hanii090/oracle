'use client';

import { useCallback, useState } from 'react';
import type { Message } from './session/ChatMessage';
import type { SessionSummary } from '@/hooks/useAuth';

interface SessionExportProps {
  messages: Message[];
  depth: number;
  allSessions?: SessionSummary[];
}

/**
 * Session export — download as Markdown, copy to clipboard, or full Thread PDF export.
 * Feature 14: Thread Export — full export of entire Thread as formatted document.
 */
export function SessionExport({ messages, depth, allSessions }: SessionExportProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const generateMarkdown = useCallback(() => {
    const date = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let md = `# Sorca Session\n\n`;
    md += `**Date:** ${date}\n`;
    md += `**Maximum Depth:** ${depth}\n`;
    md += `**Exchanges:** ${messages.length}\n\n`;
    md += `---\n\n`;

    for (const msg of messages) {
      if (msg.role === 'assistant') {
        md += `### 🔮 Sorca (Depth ${msg.depth})\n\n`;
        md += `> ${msg.content}\n\n`;
      } else {
        md += `### You\n\n`;
        md += `${msg.content}\n\n`;
      }
    }

    md += `---\n\n`;
    md += `*Exported from Sorca — The question that changes everything.*\n`;

    return md;
  }, [messages, depth]);

  const generateFullThreadMarkdown = useCallback(() => {
    if (!allSessions || allSessions.length === 0) return generateMarkdown();

    const now = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let md = `# 🧵 Your Complete Sorca Thread\n\n`;
    md += `**Exported:** ${now}\n`;
    md += `**Total Sessions:** ${allSessions.length}\n`;
    md += `**Deepest Session:** Depth ${Math.max(...allSessions.map(s => s.maxDepth))}\n`;
    md += `**Total Exchanges:** ${allSessions.reduce((sum, s) => sum + s.messageCount, 0)}\n\n`;
    md += `---\n\n`;

    // Sessions in chronological order
    const sorted = [...allSessions].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (const session of sorted) {
      const date = new Date(session.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      md += `## Session · ${date}\n\n`;
      md += `**Depth:** ${session.maxDepth} · **Exchanges:** ${session.messageCount}\n\n`;

      for (const msg of session.messages) {
        if (msg.role === 'assistant') {
          md += `> **🔮 Sorca (Depth ${msg.depth}):** ${msg.content}\n\n`;
        } else {
          md += `**You:** ${msg.content}\n\n`;
        }
      }

      md += `---\n\n`;
    }

    md += `\n*Your Thread is yours. Portable. No lock-in.*\n`;
    md += `*Exported from Sorca — The question that changes everything.*\n`;

    return md;
  }, [allSessions, generateMarkdown]);

  const handleDownload = useCallback(() => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sorca-session-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenu(false);
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
    setShowMenu(false);
  }, [generateMarkdown]);

  const handleFullThreadExport = useCallback(async () => {
    setExporting(true);
    try {
      const md = generateFullThreadMarkdown();

      // Generate a styled HTML document for better formatting
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sorca Thread Export</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@400;700;900&display=swap');
    body { font-family: 'Cormorant', Georgia, serif; background: #f5f0e8; color: #0e0c09; max-width: 800px; margin: 0 auto; padding: 40px 24px; line-height: 1.8; }
    h1 { font-family: 'Cinzel', serif; font-size: 2em; color: #c0392b; border-bottom: 2px solid #c0392b20; padding-bottom: 16px; }
    h2 { font-family: 'Cinzel', serif; font-size: 1.3em; color: #3d3830; margin-top: 40px; border-left: 3px solid #c0392b; padding-left: 16px; }
    blockquote { background: #ede7d8; border-left: 3px solid #c0392b40; padding: 12px 16px; margin: 8px 0; border-radius: 4px; }
    hr { border: none; border-top: 1px solid #c5bba8; margin: 24px 0; }
    em { color: #7a7060; font-size: 0.85em; }
    strong { color: #c0392b; }
    .meta { font-size: 0.85em; color: #7a7060; }
  </style>
</head>
<body>${md.replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^\*\*(.+?)\*\*: (.+)$/gm, '<p><strong>$1:</strong> $2</p>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^\*(.+)\*$/gm, '<em>$1</em>')
        .replace(/^---$/gm, '<hr>')
        .replace(/\n\n/g, '</p><p>')
      }
</body></html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sorca-complete-thread-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  }, [generateFullThreadMarkdown]);

  if (messages.length === 0) return null;

  return (
    <div className="relative">
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
        {allSessions && allSessions.length > 1 && (
          <button
            onClick={handleFullThreadExport}
            disabled={exporting}
            className="h-8 px-3 flex items-center justify-center rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition-all duration-300 font-courier text-[9px] tracking-widest uppercase disabled:opacity-30"
            aria-label="Export complete thread"
            title="Export full Thread"
          >
            {exporting ? '...' : '🧵 Full Thread'}
          </button>
        )}
      </div>
    </div>
  );
}
