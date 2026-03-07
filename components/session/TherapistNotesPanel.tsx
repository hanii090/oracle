'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface Note {
  id: string;
  clientId: string;
  content: string;
  sessionDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface TherapistNotesPanelProps {
  clientId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TherapistNotesPanel({ clientId, clientName, isOpen, onClose }: TherapistNotesPanelProps) {
  const { getIdToken } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [newTags, setNewTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [noteFormat, setNoteFormat] = useState<'soap' | 'dap' | 'girp' | 'free'>('soap');

  const loadNotes = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/therapist/notes?clientId=${clientId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (e) {
      console.error('Failed to load notes:', e);
    } finally {
      setLoading(false);
    }
  }, [clientId, getIdToken]);

  useEffect(() => {
    if (isOpen && clientId) loadNotes();
  }, [isOpen, clientId, loadNotes]);

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const token = await getIdToken();
      const tags = newTags.trim() ? newTags.split(',').map(t => t.trim()).filter(Boolean) : undefined;
      const res = await fetch('/api/therapist/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ clientId, content: newNote, tags }),
      });
      if (res.ok) {
        setNewNote('');
        setNewTags('');
        await loadNotes();
      }
    } catch (e) {
      console.error('Failed to save note:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ noteId, content: editContent }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditContent('');
        await loadNotes();
      }
    } catch (e) {
      console.error('Failed to update note:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const token = await getIdToken();
      await fetch('/api/therapist/notes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ noteId }),
      });
      await loadNotes();
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-void/60 backdrop-blur-sm" />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg bg-surface border-l border-border h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-cinzel text-lg text-text-main">Clinical Notes</h2>
              <p className="text-xs text-text-muted">{clientName}</p>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-gold transition-colors text-lg">
              ✕
            </button>
          </div>

          {/* Note Format Selector + AI Draft */}
          <div className="flex items-center gap-2 mb-3">
            {(['soap', 'dap', 'girp', 'free'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => setNoteFormat(fmt)}
                className={`text-[9px] px-2.5 py-1 rounded font-cinzel tracking-wider transition-all ${
                  noteFormat === fmt
                    ? 'bg-teal/10 text-teal border border-teal/30'
                    : 'bg-surface border border-border text-text-muted hover:border-teal/20'
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
            <button
              onClick={async () => {
                setDraftLoading(true);
                try {
                  const token = await getIdToken();
                  const res = await fetch('/api/therapist/ai-notes', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ clientId, format: noteFormat }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setNewNote(data.draft || '');
                  }
                } catch (e) {
                  console.error('AI draft failed:', e);
                } finally {
                  setDraftLoading(false);
                }
              }}
              disabled={draftLoading}
              className="ml-auto text-[9px] px-3 py-1 bg-gold/10 text-gold border border-gold/30 rounded font-cinzel tracking-wider hover:bg-gold/20 transition-colors disabled:opacity-50"
            >
              {draftLoading ? 'Drafting...' : 'AI Draft'}
            </button>
          </div>

          {/* New Note */}
          <div className="bg-raised border border-border rounded-lg p-4 mb-6">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={noteFormat === 'soap' ? 'S: Subjective...\nO: Objective...\nA: Assessment...\nP: Plan...' : noteFormat === 'dap' ? 'D: Data...\nA: Assessment...\nP: Plan...' : noteFormat === 'girp' ? 'G: Goals...\nI: Interventions...\nR: Response...\nP: Plan...' : 'Add a clinical note...'}
              rows={6}
              className="w-full bg-transparent text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none resize-none"
            />
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="flex-1 text-xs bg-surface border border-border rounded px-3 py-1.5 text-text-main placeholder:text-text-muted/50 focus:border-teal/50 focus:outline-none"
              />
              <button
                onClick={handleSaveNote}
                disabled={saving || !newNote.trim()}
                className="px-4 py-1.5 bg-teal text-void font-cinzel text-[10px] tracking-widest rounded hover:bg-teal-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '...' : 'Save'}
              </button>
            </div>
            <p className="text-[9px] text-text-muted/60 mt-2">
              These notes are private and not visible to the client. Format: {noteFormat.toUpperCase()}
            </p>
          </div>

          {/* Notes List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-text-muted">No notes for this client yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-raised border border-border rounded-lg p-4">
                  {editingId === note.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                        className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-main focus:border-teal/50 focus:outline-none resize-none mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={saving}
                          className="px-3 py-1 bg-teal text-void text-[10px] font-cinzel tracking-widest rounded hover:bg-teal-bright disabled:opacity-50"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditContent(''); }}
                          className="px-3 py-1 border border-border text-text-muted text-[10px] font-cinzel tracking-widest rounded hover:border-teal/30"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-text-main whitespace-pre-wrap mb-3">{note.content}</p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {note.tags.map((tag, i) => (
                            <span key={i} className="text-[9px] px-2 py-0.5 bg-violet/10 text-violet rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted">{formatDate(note.createdAt)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                            className="text-[9px] text-text-muted hover:text-teal transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-[9px] text-text-muted hover:text-crimson transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
