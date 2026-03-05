'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { BookIcon, HomeworkIcon, BellIcon, ChartIcon } from '@/components/icons';
import type { ComponentType } from 'react';
import type { IconProps } from '@/components/icons';

interface Consent {
  id: string;
  therapistId: string;
  therapistEmail: string | null;
  permissions: {
    shareWeekSummary: boolean;
    shareHomeworkProgress: boolean;
    sharePatternAlerts: boolean;
    shareMoodData: boolean;
  };
  status: 'active' | 'revoked';
  grantedAt: string;
}

interface ConsentFlowProps {
  onClose: () => void;
}

const PERMISSION_LABELS: Record<string, { title: string; desc: string; Icon: ComponentType<IconProps> }> = {
  shareWeekSummary: {
    title: 'Week Summary',
    desc: 'Share your weekly reflection summary with your therapist',
    Icon: BookIcon,
  },
  shareHomeworkProgress: {
    title: 'Homework Progress',
    desc: 'Share homework completion and responses',
    Icon: HomeworkIcon,
  },
  sharePatternAlerts: {
    title: 'Pattern Alerts',
    desc: 'Alert therapist to significant changes in your patterns',
    Icon: BellIcon,
  },
  shareMoodData: {
    title: 'Mood Tracking',
    desc: 'Share mood trends and emotional patterns',
    Icon: ChartIcon,
  },
};

export function ConsentFlow({ onClose }: ConsentFlowProps) {
  const { getIdToken, user } = useAuth();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingConsent, setEditingConsent] = useState<Consent | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add form state
  const [therapistEmail, setTherapistEmail] = useState('');
  const [permissions, setPermissions] = useState({
    shareWeekSummary: true,
    shareHomeworkProgress: true,
    sharePatternAlerts: true,
    shareMoodData: false,
  });

  const loadConsents = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/consent', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setConsents(data.consents || []);
      }
    } catch (e) {
      console.error('Failed to load consents:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadConsents();
  }, [loadConsents]);

  const grantConsent = async () => {
    if (!therapistEmail.trim()) return;
    setSubmitting(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          therapistId: therapistEmail.toLowerCase(),
          therapistEmail: therapistEmail.toLowerCase(),
          permissions,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConsents(prev => [...prev, data.consent]);
        setTherapistEmail('');
        setPermissions({
          shareWeekSummary: true,
          shareHomeworkProgress: true,
          sharePatternAlerts: true,
          shareMoodData: false,
        });
        setView('list');
      }
    } catch (e) {
      console.error('Failed to grant consent:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const updateConsent = async () => {
    if (!editingConsent) return;
    setSubmitting(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          consentId: editingConsent.id,
          permissions,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConsents(prev => prev.map(c => c.id === editingConsent.id ? data.consent : c));
        setEditingConsent(null);
        setView('list');
      }
    } catch (e) {
      console.error('Failed to update consent:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const revokeConsent = async (consentId: string) => {
    if (!confirm('Are you sure you want to revoke this consent? Your therapist will no longer have access to your data.')) {
      return;
    }

    try {
      const token = await getIdToken();
      const res = await fetch('/api/consent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ consentId }),
      });

      if (res.ok) {
        setConsents(prev => prev.filter(c => c.id !== consentId));
      }
    } catch (e) {
      console.error('Failed to revoke consent:', e);
    }
  };

  const startEdit = (consent: Consent) => {
    setEditingConsent(consent);
    setPermissions(consent.permissions);
    setView('edit');
  };

  const activeConsents = consents.filter(c => c.status === 'active');

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
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400" aria-hidden="true">🔐</span>
            </div>
            <div>
              <h1 className="font-cinzel text-sm text-text-main tracking-wide">
                Data Sharing Consent
              </h1>
              <p className="text-[10px] text-text-muted">
                GDPR compliant · You control your data
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
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <>
                    {/* Info box */}
                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                      <p className="text-sm text-text-mid leading-relaxed">
                        <strong className="text-blue-400">Your data, your choice.</strong> You decide what your therapist can see. 
                        All sharing requires your explicit consent and can be revoked at any time.
                      </p>
                    </div>

                    {activeConsents.length > 0 && (
                      <div className="mb-6">
                        <h2 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-4">
                          Active Sharing
                        </h2>
                        <div className="space-y-3">
                          {activeConsents.map(consent => (
                            <div
                              key={consent.id}
                              className="bg-surface border border-border rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                  <h3 className="font-cinzel text-sm text-text-main">
                                    {consent.therapistEmail || 'Therapist'}
                                  </h3>
                                  <p className="text-[10px] text-text-muted">
                                    Consent granted {new Date(consent.grantedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startEdit(consent)}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => revokeConsent(consent.id)}
                                    className="text-xs text-red-400 hover:text-red-300"
                                  >
                                    Revoke
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(consent.permissions).map(([key, enabled]) => (
                                  enabled && (
                                    <span
                                      key={key}
                                      className="text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded"
                                    >
                                      {PERMISSION_LABELS[key as keyof typeof PERMISSION_LABELS]?.title}
                                    </span>
                                  )
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setView('add')}
                      className="w-full py-4 border border-dashed border-border rounded-lg text-text-muted hover:border-blue-500/30 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>+</span>
                      <span className="font-cinzel text-xs tracking-wider">Add Therapist Access</span>
                    </button>

                    {activeConsents.length === 0 && (
                      <div className="text-center py-8 mt-4">
                        <p className="text-sm text-text-muted leading-relaxed">
                          You haven&apos;t shared data with any therapist yet.<br />
                          Your Sorca data is completely private.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {(view === 'add' || view === 'edit') && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => { setView('list'); setEditingConsent(null); }}
                  className="text-text-muted hover:text-gold text-xs font-cinzel tracking-widest mb-6"
                >
                  ← Back
                </button>

                <h2 className="font-cinzel text-lg text-text-main mb-6">
                  {view === 'add' ? 'Share with Therapist' : 'Edit Sharing Permissions'}
                </h2>

                {view === 'add' && (
                  <div className="mb-6">
                    <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">
                      Therapist Email
                    </label>
                    <input
                      type="email"
                      value={therapistEmail}
                      onChange={(e) => setTherapistEmail(e.target.value)}
                      placeholder="therapist@practice.com"
                      className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-blue-500 transition-colors"
                      autoFocus
                    />
                    <p className="text-[10px] text-text-muted mt-2">
                      Your therapist must have a Sorca Practice account to view shared data.
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-4">
                    What can they see?
                  </label>
                  <div className="space-y-3">
                    {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-start gap-3 bg-surface border border-border rounded-lg p-4 cursor-pointer hover:border-blue-500/30 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={permissions[key as keyof typeof permissions]}
                          onChange={(e) => setPermissions(prev => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))}
                          className="mt-0.5 accent-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <label.Icon size={16} className="text-teal-400" />
                            <span className="font-cinzel text-sm text-text-main">{label.title}</span>
                          </div>
                          <p className="text-xs text-text-muted mt-1">{label.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                  <p className="text-xs text-amber-400 leading-relaxed">
                    <strong>Important:</strong> This consent is logged and auditable. You can revoke it at any time, 
                    and your therapist will immediately lose access. Per GDPR Article 7.
                  </p>
                </div>

                <button
                  onClick={view === 'add' ? grantConsent : updateConsent}
                  disabled={(view === 'add' && !therapistEmail.trim()) || submitting}
                  className="w-full py-3 bg-blue-500/10 border border-blue-500 text-blue-400 font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-blue-500 hover:text-void transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : view === 'add' ? 'Grant Consent' : 'Update Permissions'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
