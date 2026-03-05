'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { HomeworkIcon, CheckIcon } from '@/components/icons';

interface HomeworkAssignment {
  id: string;
  topic: string;
  description: string | null;
  durationDays: number;
  completedDays: number;
  status: 'active' | 'completed';
  startDate: string;
  endDate: string;
  checkIns: Array<{
    dayNumber: number;
    response: string;
    timestamp: string;
  }>;
}

interface HomeworkCompanionProps {
  onClose: () => void;
}

export function HomeworkCompanion({ onClose }: HomeworkCompanionProps) {
  const { getIdToken } = useAuth();
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'checkin'>('list');
  const [activeAssignment, setActiveAssignment] = useState<HomeworkAssignment | null>(null);
  const [todayQuestion, setTodayQuestion] = useState<string>('');
  const [checkInResponse, setCheckInResponse] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAssignments = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/homework', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error('Failed to load homework:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const createAssignment = async () => {
    if (!newTopic.trim()) return;
    setSubmitting(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic: newTopic,
          description: newDescription || undefined,
          durationDays: 7,
          assignedBy: 'self',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAssignments(prev => [data.assignment, ...prev]);
        setNewTopic('');
        setNewDescription('');
        setView('list');
      }
    } catch (e) {
      console.error('Failed to create assignment:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const startCheckIn = async (assignment: HomeworkAssignment) => {
    setActiveAssignment(assignment);
    setView('checkin');
    setTodayQuestion('');

    try {
      const token = await getIdToken();
      const res = await fetch(`/api/homework?id=${assignment.id}&question=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setTodayQuestion(data.question || "Did you notice the pattern today?");
      }
    } catch (e) {
      setTodayQuestion("Did you notice the pattern today?");
    }
  };

  const submitCheckIn = async () => {
    if (!activeAssignment || !checkInResponse.trim()) return;
    setSubmitting(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          assignmentId: activeAssignment.id,
          response: checkInResponse,
          dayNumber: activeAssignment.completedDays + 1,
        }),
      });

      if (res.ok) {
        setCheckInResponse('');
        setActiveAssignment(null);
        setView('list');
        loadAssignments();
      }
    } catch (e) {
      console.error('Failed to submit check-in:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const token = await getIdToken();
      await fetch(`/api/homework?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Failed to delete assignment:', e);
    }
  };

  const activeAssignments = assignments.filter(a => a.status === 'active');
  const completedAssignments = assignments.filter(a => a.status === 'completed');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-void/98 flex flex-col"
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/50 bg-surface/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
              <span className="text-violet-400" aria-hidden="true">📝</span>
            </div>
            <div>
              <h1 className="font-cinzel text-sm text-text-main tracking-wide">
                Homework Companion
              </h1>
              <p className="text-[10px] text-text-muted">
                Track patterns between sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-gold transition-colors text-xs font-cinzel tracking-widest"
          >
            Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {view === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <>
                    {/* Active Assignments */}
                    {activeAssignments.length > 0 && (
                      <div className="mb-8">
                        <h2 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-4">
                          Active Homework
                        </h2>
                        <div className="space-y-3">
                          {activeAssignments.map(assignment => (
                            <div
                              key={assignment.id}
                              className="bg-surface border border-border rounded-lg p-4 hover:border-violet-500/30 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1">
                                  <h3 className="font-cinzel text-sm text-text-main mb-1">
                                    {assignment.topic}
                                  </h3>
                                  {assignment.description && (
                                    <p className="text-xs text-text-muted">
                                      {assignment.description}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => deleteAssignment(assignment.id)}
                                  className="text-text-muted hover:text-red-400 text-xs"
                                  aria-label="Delete assignment"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* Progress bar */}
                              <div className="mb-3">
                                <div className="flex justify-between text-[10px] text-text-muted mb-1">
                                  <span>Day {assignment.completedDays + 1} of {assignment.durationDays}</span>
                                  <span>{Math.round((assignment.completedDays / assignment.durationDays) * 100)}%</span>
                                </div>
                                <div className="h-1.5 bg-raised rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-violet-500 rounded-full transition-all"
                                    style={{ width: `${(assignment.completedDays / assignment.durationDays) * 100}%` }}
                                  />
                                </div>
                              </div>

                              <button
                                onClick={() => startCheckIn(assignment)}
                                className="w-full py-2 bg-violet-500/10 border border-violet-500/30 text-violet-400 font-cinzel text-[10px] tracking-widest uppercase rounded hover:bg-violet-500/20 transition-colors"
                              >
                                Today's Check-in
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Create New */}
                    <button
                      onClick={() => setView('create')}
                      className="w-full py-4 border border-dashed border-border rounded-lg text-text-muted hover:border-violet-500/30 hover:text-violet-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>+</span>
                      <span className="font-cinzel text-xs tracking-wider">Set New Homework</span>
                    </button>

                    {/* Completed */}
                    {completedAssignments.length > 0 && (
                      <div className="mt-8">
                        <h2 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-4">
                          Completed
                        </h2>
                        <div className="space-y-2">
                          {completedAssignments.slice(0, 5).map(assignment => (
                            <div
                              key={assignment.id}
                              className="bg-surface/50 border border-border/50 rounded-lg p-3 opacity-60"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-text-mid">{assignment.topic}</span>
                                <span className="text-[10px] text-green-400">✓ Complete</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeAssignments.length === 0 && completedAssignments.length === 0 && (
                      <div className="text-center py-12">
                        <HomeworkIcon size={48} className="mx-auto mb-4 text-text-muted/50" aria-hidden="true" />
                        <h3 className="font-cinzel text-sm text-text-main mb-2">
                          No homework yet
                        </h3>
                        <p className="text-xs text-text-muted">
                          Set a pattern to track between sessions
                        </p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {view === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setView('list')}
                  className="text-text-muted hover:text-gold text-xs font-cinzel tracking-widest mb-6 flex items-center gap-2"
                >
                  ← Back
                </button>

                <h2 className="font-cinzel text-lg text-text-main mb-6">
                  Set New Homework
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                      What pattern are you tracking?
                    </label>
                    <input
                      type="text"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="e.g., Notice when I catastrophise"
                      className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-violet-500 transition-colors"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                      Additional context (optional)
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Any notes from your therapist about what to look for..."
                      rows={3}
                      className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-4">
                    <p className="text-xs text-text-mid leading-relaxed">
                      <strong className="text-violet-400">How it works:</strong> Sorca will check in with you once a day for 7 days with a gentle question about this pattern. Just a sentence or two each day.
                    </p>
                  </div>

                  <button
                    onClick={createAssignment}
                    disabled={!newTopic.trim() || submitting}
                    className="w-full py-3 bg-violet-500/10 border border-violet-500 text-violet-400 font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-violet-500 hover:text-void transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating...' : 'Start 7-Day Tracking'}
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'checkin' && activeAssignment && (
              <motion.div
                key="checkin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => { setView('list'); setActiveAssignment(null); }}
                  className="text-text-muted hover:text-gold text-xs font-cinzel tracking-widest mb-6 flex items-center gap-2"
                >
                  ← Back
                </button>

                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1 mb-4">
                    <span className="text-violet-400 text-xs font-cinzel">
                      Day {activeAssignment.completedDays + 1} of {activeAssignment.durationDays}
                    </span>
                  </div>
                  <h2 className="font-cinzel text-sm text-text-muted mb-2">
                    Tracking: {activeAssignment.topic}
                  </h2>
                </div>

                {todayQuestion ? (
                  <div className="space-y-6">
                    <div className="bg-surface border border-border rounded-lg p-6">
                      <p className="text-lg text-text-main leading-relaxed text-center">
                        {todayQuestion}
                      </p>
                    </div>

                    <textarea
                      value={checkInResponse}
                      onChange={(e) => setCheckInResponse(e.target.value)}
                      placeholder="Your response..."
                      rows={4}
                      className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                      autoFocus
                    />

                    <button
                      onClick={submitCheckIn}
                      disabled={!checkInResponse.trim() || submitting}
                      className="w-full py-3 bg-violet-500/10 border border-violet-500 text-violet-400 font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-violet-500 hover:text-void transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Recording...' : 'Record Check-in'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-text-muted mt-4">Preparing today's question...</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function HomeworkCheckInPrompt({
  assignment,
  onCheckIn,
  onDismiss,
}: {
  assignment: { topic: string; completedDays: number; durationDays: number };
  onCheckIn: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-md mx-4"
    >
      <div className="bg-surface border border-violet-500/30 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
            <span className="text-xl" aria-hidden="true">📝</span>
          </div>
          <div className="flex-1">
            <h3 className="font-cinzel text-sm text-violet-400 tracking-wide mb-1">
              Homework Check-in
            </h3>
            <p className="text-xs text-text-muted leading-relaxed mb-1">
              Day {assignment.completedDays + 1} of {assignment.durationDays}: {assignment.topic}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={onCheckIn}
                className="px-4 py-2 bg-violet-500/20 border border-violet-500/50 text-violet-400 font-cinzel text-[10px] tracking-widest uppercase rounded hover:bg-violet-500/30 transition-colors"
              >
                Check In
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-text-muted font-cinzel text-[10px] tracking-widest uppercase hover:text-text-mid transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
