'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface CopingAnchorData {
  id: string;
  name: string;
  type: 'breathing' | 'grounding' | 'reframe' | 'movement' | 'other';
  steps: string[];
  description: string | null;
  taughtBy: string | null;
  usageCount: number;
}

interface CopingAnchorProps {
  onClose: () => void;
}

const ANCHOR_TYPES = [
  { value: 'breathing', label: 'Breathing', icon: '🌬️' },
  { value: 'grounding', label: 'Grounding', icon: '🌳' },
  { value: 'reframe', label: 'Reframe', icon: '🔄' },
  { value: 'movement', label: 'Movement', icon: '🚶' },
  { value: 'other', label: 'Other', icon: '✨' },
];

export function CopingAnchor({ onClose }: CopingAnchorProps) {
  const { getIdToken } = useAuth();
  const [anchors, setAnchors] = useState<CopingAnchorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'use'>('list');
  const [activeAnchor, setActiveAnchor] = useState<CopingAnchorData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [introPrompt, setIntroPrompt] = useState('');

  // Create form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>('breathing');
  const [newSteps, setNewSteps] = useState<string[]>(['']);
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAnchors = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/coping-anchor', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAnchors(data.anchors || []);
      }
    } catch (e) {
      console.error('Failed to load anchors:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadAnchors();
  }, [loadAnchors]);

  const createAnchor = async () => {
    if (!newName.trim() || newSteps.filter(s => s.trim()).length === 0) return;
    setSubmitting(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/coping-anchor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newName,
          type: newType,
          steps: newSteps.filter(s => s.trim()),
          description: newDescription || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnchors(prev => [...prev, data.anchor]);
        resetForm();
        setView('list');
      }
    } catch (e) {
      console.error('Failed to create anchor:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const useAnchor = async (anchor: CopingAnchorData) => {
    setActiveAnchor(anchor);
    setCurrentStep(0);
    setView('use');

    try {
      const token = await getIdToken();
      const res = await fetch(`/api/coping-anchor?id=${anchor.id}&use=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setIntroPrompt(data.introPrompt || '');
      }
    } catch (e) {
      console.error('Failed to use anchor:', e);
    }
  };

  const deleteAnchor = async (id: string) => {
    try {
      const token = await getIdToken();
      await fetch(`/api/coping-anchor?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAnchors(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Failed to delete anchor:', e);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewType('breathing');
    setNewSteps(['']);
    setNewDescription('');
  };

  const addStep = () => setNewSteps(prev => [...prev, '']);
  const updateStep = (index: number, value: string) => {
    setNewSteps(prev => prev.map((s, i) => i === index ? value : s));
  };
  const removeStep = (index: number) => {
    if (newSteps.length > 1) {
      setNewSteps(prev => prev.filter((_, i) => i !== index));
    }
  };

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
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-400" aria-hidden="true">⚓</span>
            </div>
            <div>
              <h1 className="font-cinzel text-sm text-text-main tracking-wide">
                Coping Anchors
              </h1>
              <p className="text-[10px] text-text-muted">
                Techniques your therapist taught you
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-gold text-xs font-cinzel tracking-widest"
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <>
                    {anchors.length > 0 && (
                      <div className="space-y-3 mb-6">
                        {anchors.map(anchor => (
                          <div
                            key={anchor.id}
                            className="bg-surface border border-border rounded-lg p-4 hover:border-emerald-500/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {ANCHOR_TYPES.find(t => t.value === anchor.type)?.icon || '✨'}
                                </span>
                                <h3 className="font-cinzel text-sm text-text-main">
                                  {anchor.name}
                                </h3>
                              </div>
                              <button
                                onClick={() => deleteAnchor(anchor.id)}
                                className="text-text-muted hover:text-red-400 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                            {anchor.description && (
                              <p className="text-xs text-text-muted mb-3">{anchor.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-text-muted">
                                {anchor.steps.length} steps · Used {anchor.usageCount || 0} times
                              </span>
                              <button
                                onClick={() => useAnchor(anchor)}
                                className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-cinzel text-[10px] tracking-widest uppercase rounded hover:bg-emerald-500/20 transition-colors"
                              >
                                Use Now
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setView('create')}
                      className="w-full py-4 border border-dashed border-border rounded-lg text-text-muted hover:border-emerald-500/30 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>+</span>
                      <span className="font-cinzel text-xs tracking-wider">Add New Anchor</span>
                    </button>

                    {anchors.length === 0 && (
                      <div className="text-center py-8 mt-4">
                        <p className="text-sm text-text-muted leading-relaxed">
                          Save coping strategies your therapist teaches you here.<br />
                          Access them instantly when you need them.
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
                  onClick={() => { setView('list'); resetForm(); }}
                  className="text-text-muted hover:text-gold text-xs font-cinzel tracking-widest mb-6"
                >
                  ← Back
                </button>

                <h2 className="font-cinzel text-lg text-text-main mb-6">Add Coping Anchor</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g., 4-7-8 Breathing"
                      className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                      Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ANCHOR_TYPES.map(type => (
                        <button
                          key={type.value}
                          onClick={() => setNewType(type.value)}
                          className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
                            newType === type.value
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-raised border-border text-text-muted hover:border-emerald-500/30'
                          }`}
                        >
                          {type.icon} {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                      Steps
                    </label>
                    <div className="space-y-2">
                      {newSteps.map((step, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-xs text-text-muted pt-3 w-6">{i + 1}.</span>
                          <input
                            type="text"
                            value={step}
                            onChange={(e) => updateStep(i, e.target.value)}
                            placeholder={`Step ${i + 1}...`}
                            className="flex-1 bg-raised border border-border rounded-lg px-4 py-2 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                          {newSteps.length > 1 && (
                            <button
                              onClick={() => removeStep(i)}
                              className="text-text-muted hover:text-red-400 px-2"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addStep}
                      className="mt-2 text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      + Add step
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="When to use this, notes from your therapist..."
                      rows={2}
                      className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>

                  <button
                    onClick={createAnchor}
                    disabled={!newName.trim() || newSteps.filter(s => s.trim()).length === 0 || submitting}
                    className="w-full py-3 bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-emerald-500 hover:text-void transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : 'Save Anchor'}
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'use' && activeAnchor && (
              <motion.div
                key="use"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <button
                  onClick={() => { setView('list'); setActiveAnchor(null); }}
                  className="absolute top-20 left-4 text-text-muted hover:text-gold text-xs font-cinzel tracking-widest"
                >
                  ← Exit
                </button>

                <div className="py-12">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <span className="text-4xl">
                      {ANCHOR_TYPES.find(t => t.value === activeAnchor.type)?.icon || '⚓'}
                    </span>
                  </motion.div>

                  <h2 className="font-cinzel text-xl text-emerald-400 mb-2">
                    {activeAnchor.name}
                  </h2>

                  {introPrompt && currentStep === 0 && (
                    <p className="text-sm text-text-muted mb-8">{introPrompt}</p>
                  )}

                  <div className="max-w-md mx-auto">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-surface border border-emerald-500/30 rounded-lg p-8 mb-6"
                      >
                        <div className="text-[10px] text-emerald-400 font-cinzel tracking-wider mb-4">
                          Step {currentStep + 1} of {activeAnchor.steps.length}
                        </div>
                        <p className="text-lg text-text-main leading-relaxed">
                          {activeAnchor.steps[currentStep]}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    <div className="flex gap-3 justify-center">
                      {currentStep > 0 && (
                        <button
                          onClick={() => setCurrentStep(prev => prev - 1)}
                          className="px-6 py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-emerald-500/30 transition-colors"
                        >
                          Previous
                        </button>
                      )}
                      {currentStep < activeAnchor.steps.length - 1 ? (
                        <button
                          onClick={() => setCurrentStep(prev => prev + 1)}
                          className="px-6 py-3 bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-emerald-500 hover:text-void transition-colors"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          onClick={() => { setView('list'); setActiveAnchor(null); }}
                          className="px-6 py-3 bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-emerald-500 hover:text-void transition-colors"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function NeedAnchorButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-24 right-4 z-30 w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg hover:bg-emerald-500/30 transition-colors"
      aria-label="I need my anchor"
      title="I need my anchor"
    >
      <span className="text-xl">⚓</span>
    </motion.button>
  );
}
