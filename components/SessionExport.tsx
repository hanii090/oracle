'use client';

import { useCallback, useState } from 'react';
import type { Message } from './session/ChatMessage';
import type { SessionSummary, Tier } from '@/hooks/useAuth';
import { WarningIcon, ExportIcon, CopyIcon, DeleteIcon } from '@/components/icons';

interface SessionExportProps {
  messages: Message[];
  depth: number;
  allSessions?: SessionSummary[];
  userId?: string;
  userTier?: Tier;
  getIdToken?: () => Promise<string | null>;
}

/**
 * Session export — download as Markdown, copy to clipboard, or full Thread PDF export.
 * Feature 14: Thread Export — full export of entire Thread as formatted document.
 * GDPR Compliance: Full data export (JSON) and delete functionality.
 */
export function SessionExport({ messages, depth, allSessions, userId, userTier, getIdToken }: SessionExportProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showGdprMenu, setShowGdprMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  // GDPR: Full JSON data export
  const handleGdprExport = useCallback(async () => {
    setExporting(true);
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0',
        gdprCompliant: true,
        userData: {
          userId: userId || 'anonymous',
          tier: userTier || 'free',
        },
        sessions: allSessions || [],
        currentSession: {
          messages,
          depth,
          exportedAt: new Date().toISOString(),
        },
        metadata: {
          totalSessions: allSessions?.length || 0,
          totalMessages: allSessions?.reduce((sum, s) => sum + s.messageCount, 0) || messages.length,
          deepestLevel: Math.max(depth, ...(allSessions?.map(s => s.maxDepth) || [])),
          dataCategories: [
            'session_messages',
            'depth_levels',
            'timestamps',
          ],
        },
        rights: {
          portability: 'This data export fulfills GDPR Article 20 - Right to Data Portability',
          erasure: 'You may request complete data deletion at any time',
          format: 'JSON (machine-readable)',
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sorca-gdpr-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
      setShowGdprMenu(false);
    }
  }, [userId, userTier, allSessions, messages, depth]);

  // GDPR: Delete all user data
  const handleDeleteAllData = useCallback(async () => {
    if (deleteConfirmText !== 'DELETE' || !getIdToken) return;
    
    setDeleting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        // Clear local storage
        if (userId) {
          localStorage.removeItem(`sorca_profile_${userId}`);
          localStorage.removeItem(`sorca_sessions_${userId}`);
          localStorage.removeItem(`sorca_therapy_profile_${userId}`);
        }
        localStorage.removeItem('sorca_thread');
        localStorage.removeItem('sorca_user_id');
        
        // Redirect to home
        window.location.href = '/';
      } else {
        console.error('Failed to delete data');
      }
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [deleteConfirmText, getIdToken, userId]);

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
    h1 { font-family: 'Cinzel', serif; font-size: 2em; color: #0f766e; border-bottom: 2px solid #0f766e20; padding-bottom: 16px; }
    h2 { font-family: 'Cinzel', serif; font-size: 1.3em; color: #3d3830; margin-top: 40px; border-left: 3px solid #0f766e; padding-left: 16px; }
    blockquote { background: #ede7d8; border-left: 3px solid #0f766e40; padding: 12px 16px; margin: 8px 0; border-radius: 4px; }
    hr { border: none; border-top: 1px solid #c5bba8; margin: 24px 0; }
    em { color: #7a7060; font-size: 0.85em; }
    strong { color: #0f766e; }
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
        
        {/* GDPR Data Management */}
        {userId && (
          <div className="relative">
            <button
              onClick={() => setShowGdprMenu(!showGdprMenu)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:border-gold/30 hover:text-gold transition-all duration-300"
              aria-label="Data privacy options"
              title="Your Data (GDPR)"
            >
              🔐
            </button>

            {showGdprMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="p-3 border-b border-border">
                  <p className="font-cinzel text-[10px] text-gold tracking-wider uppercase">
                    Your Data Rights
                  </p>
                  <p className="text-[10px] text-text-muted mt-1">
                    GDPR Article 15, 17, 20 compliant
                  </p>
                </div>
                
                <button
                  onClick={handleGdprExport}
                  disabled={exporting}
                  className="w-full px-3 py-2.5 text-left hover:bg-raised transition-colors flex items-center gap-2"
                >
                  <span>📦</span>
                  <div>
                    <p className="text-xs text-text-main">Export All Data</p>
                    <p className="text-[10px] text-text-muted">Download as JSON</p>
                  </div>
                </button>
                
                <button
                  onClick={() => { setShowGdprMenu(false); setShowDeleteConfirm(true); }}
                  className="w-full px-3 py-2.5 text-left hover:bg-red-900/10 transition-colors flex items-center gap-2 border-t border-border"
                >
                  <span>🗑️</span>
                  <div>
                    <p className="text-xs text-red-400">Delete All Data</p>
                    <p className="text-[10px] text-text-muted">Permanent erasure</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-surface border border-red-500/30 rounded-lg p-6">
            <div className="text-center mb-6">
              <WarningIcon size={48} className="mx-auto mb-4 text-red-400" />
              <h3 className="font-cinzel text-lg text-red-400 mb-2">
                Delete All Your Data?
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                This will permanently delete all your sessions, beliefs, patterns, 
                therapy data, and account information. This cannot be undone.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                className="flex-1 py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-gold/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 py-3 bg-red-500/10 border border-red-500 text-red-400 font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>

            <p className="text-[10px] text-text-muted text-center mt-4">
              Per GDPR Article 17 — Right to Erasure
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
