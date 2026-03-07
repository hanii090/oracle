'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface BreakthroughMoment {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface ProfileData {
  goals: string[];
  modality: string;
  modalityOther?: string;
  recurringThemes: string[];
  breakthroughMoments: BreakthroughMoment[];
  preferredApproach: string | null;
  triggerWarnings: string[];
  communicationPreferences: string | null;
  shareTokens: Array<{ token: string; createdAt: string; expiresAt: string; label: string }>;
}

const MODALITIES = [
  { value: 'cbt', label: 'CBT' },
  { value: 'act', label: 'ACT' },
  { value: 'schema', label: 'Schema' },
  { value: 'ifs', label: 'IFS' },
  { value: 'psychodynamic', label: 'Psychodynamic' },
  { value: 'humanistic', label: 'Humanistic' },
  { value: 'person-centred', label: 'Person-Centred' },
  { value: 'integrative', label: 'Integrative' },
  { value: 'dbt', label: 'DBT' },
  { value: 'emdr', label: 'EMDR' },
  { value: 'other', label: 'Other' },
  { value: 'unsure', label: 'Not sure yet' },
];

interface TherapyProfileProps {
  onClose?: () => void;
}

export function TherapyProfile({ onClose }: TherapyProfileProps) {
  const { user, getIdToken, profile: authProfile } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('goals');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [creatingShare, setCreatingShare] = useState(false);

  // Editable fields
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [modality, setModality] = useState('unsure');
  const [themes, setThemes] = useState<string[]>([]);
  const [newTheme, setNewTheme] = useState('');
  const [breakthroughs, setBreakthroughs] = useState<BreakthroughMoment[]>([]);
  const [preferredApproach, setPreferredApproach] = useState('');
  const [triggerWarnings, setTriggerWarnings] = useState<string[]>([]);
  const [newTrigger, setNewTrigger] = useState('');
  const [commPrefs, setCommPrefs] = useState('');

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapy-profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfileData(data.profile);
          setGoals(data.profile.goals || []);
          setModality(data.profile.modality || 'unsure');
          setThemes(data.profile.recurringThemes || []);
          setBreakthroughs(data.profile.breakthroughMoments || []);
          setPreferredApproach(data.profile.preferredApproach || '');
          setTriggerWarnings(data.profile.triggerWarnings || []);
          setCommPrefs(data.profile.communicationPreferences || '');
        }
      }
    } catch (e) {
      console.error('Failed to load therapy profile:', e);
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapy-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.profile);
      }
    } catch (e) {
      console.error('Failed to save therapy profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddGoal = () => {
    if (!newGoal.trim()) return;
    const updated = [...goals, newGoal.trim()];
    setGoals(updated);
    setNewGoal('');
    saveProfile({ goals: updated });
  };

  const handleRemoveGoal = (idx: number) => {
    const updated = goals.filter((_, i) => i !== idx);
    setGoals(updated);
    saveProfile({ goals: updated });
  };

  const handleModalityChange = (value: string) => {
    setModality(value);
    saveProfile({ modality: value });
  };

  const handleAddTheme = () => {
    if (!newTheme.trim()) return;
    const updated = [...themes, newTheme.trim()];
    setThemes(updated);
    setNewTheme('');
    saveProfile({ recurringThemes: updated });
  };

  const handleRemoveTheme = (idx: number) => {
    const updated = themes.filter((_, i) => i !== idx);
    setThemes(updated);
    saveProfile({ recurringThemes: updated });
  };

  const handleAddBreakthrough = () => {
    const newMoment: BreakthroughMoment = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    };
    setBreakthroughs([...breakthroughs, newMoment]);
  };

  const handleUpdateBreakthrough = (id: string, field: keyof BreakthroughMoment, value: string) => {
    const updated = breakthroughs.map(b => b.id === id ? { ...b, [field]: value } : b);
    setBreakthroughs(updated);
  };

  const handleSaveBreakthroughs = () => {
    const valid = breakthroughs.filter(b => b.title.trim() && b.description.trim());
    setBreakthroughs(valid);
    saveProfile({ breakthroughMoments: valid });
  };

  const handleAddTrigger = () => {
    if (!newTrigger.trim()) return;
    const updated = [...triggerWarnings, newTrigger.trim()];
    setTriggerWarnings(updated);
    setNewTrigger('');
    saveProfile({ triggerWarnings: updated });
  };

  const handleRemoveTrigger = (idx: number) => {
    const updated = triggerWarnings.filter((_, i) => i !== idx);
    setTriggerWarnings(updated);
    saveProfile({ triggerWarnings: updated });
  };

  const handleSaveApproach = () => {
    saveProfile({ preferredApproach: preferredApproach, communicationPreferences: commPrefs });
  };

  const handleCreateShareLink = async () => {
    setCreatingShare(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapy-profile/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ label: 'New therapist', expiresInDays: 30 }),
      });
      if (res.ok) {
        const data = await res.json();
        setShareUrl(window.location.origin + data.shareUrl);
        await loadProfile();
      }
    } catch (e) {
      console.error('Failed to create share link:', e);
    } finally {
      setCreatingShare(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = [
    { id: 'goals', label: 'Goals' },
    { id: 'modality', label: 'Modality' },
    { id: 'themes', label: 'Themes' },
    { id: 'breakthroughs', label: 'Breakthroughs' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'share', label: 'Share' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-cinzel text-lg text-text-main">My Therapy Profile</h2>
          <p className="text-xs text-text-muted">Portable, user-owned. Share with new therapists.</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-sm">✕</button>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-3 py-1.5 text-[10px] font-cinzel tracking-widest rounded-full whitespace-nowrap transition-all ${
              activeSection === s.id
                ? 'bg-gold/10 text-gold border border-gold/30'
                : 'text-text-muted hover:text-text-mid border border-transparent'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {saving && (
        <p className="text-[9px] text-gold mb-2 animate-pulse">Saving...</p>
      )}

      <AnimatePresence mode="wait">
        {/* Goals */}
        {activeSection === 'goals' && (
          <motion.div key="goals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-xs text-text-muted">What do you want to work on in therapy?</p>
            {goals.map((goal, i) => (
              <div key={i} className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2.5">
                <span className="text-sm text-text-main flex-1">{goal}</span>
                <button onClick={() => handleRemoveGoal(i)} className="text-text-muted hover:text-red-400 text-xs">✕</button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add a therapy goal..."
                className="flex-1 bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                maxLength={500}
              />
              <button onClick={handleAddGoal} disabled={!newGoal.trim()} className="px-4 py-2 bg-gold/10 text-gold border border-gold/30 rounded-lg text-xs font-cinzel disabled:opacity-40">Add</button>
            </div>
          </motion.div>
        )}

        {/* Modality */}
        {activeSection === 'modality' && (
          <motion.div key="modality" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-xs text-text-muted">What type of therapy are you doing (or interested in)?</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {MODALITIES.map(m => (
                <button
                  key={m.value}
                  onClick={() => handleModalityChange(m.value)}
                  className={`p-2.5 rounded-lg border text-xs text-center transition-all ${
                    modality === m.value
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border text-text-mid hover:border-gold/30'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Themes */}
        {activeSection === 'themes' && (
          <motion.div key="themes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-xs text-text-muted">Recurring themes in your therapy journey</p>
            <div className="flex flex-wrap gap-2">
              {themes.map((theme, i) => (
                <span key={i} className="px-3 py-1.5 bg-gold/10 text-gold text-xs rounded-full border border-gold/20 flex items-center gap-1.5">
                  {theme}
                  <button onClick={() => handleRemoveTheme(i)} className="hover:text-red-400 text-[9px]">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                placeholder="e.g. perfectionism, boundaries, grief..."
                className="flex-1 bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
                maxLength={300}
              />
              <button onClick={handleAddTheme} disabled={!newTheme.trim()} className="px-4 py-2 bg-gold/10 text-gold border border-gold/30 rounded-lg text-xs font-cinzel disabled:opacity-40">Add</button>
            </div>
          </motion.div>
        )}

        {/* Breakthroughs */}
        {activeSection === 'breakthroughs' && (
          <motion.div key="breakthroughs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-xs text-text-muted">Record significant moments of insight or change</p>
            {breakthroughs.map(b => (
              <div key={b.id} className="bg-surface border border-border rounded-lg p-4 space-y-2">
                <input
                  type="text"
                  value={b.title}
                  onChange={(e) => handleUpdateBreakthrough(b.id, 'title', e.target.value)}
                  placeholder="Breakthrough title..."
                  className="w-full bg-raised border border-border rounded px-3 py-1.5 text-sm text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none"
                  maxLength={200}
                />
                <textarea
                  value={b.description}
                  onChange={(e) => handleUpdateBreakthrough(b.id, 'description', e.target.value)}
                  placeholder="What happened? What shifted?"
                  rows={2}
                  className="w-full bg-raised border border-border rounded px-3 py-1.5 text-xs text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none resize-none"
                  maxLength={1000}
                />
                <input
                  type="date"
                  value={b.date}
                  onChange={(e) => handleUpdateBreakthrough(b.id, 'date', e.target.value)}
                  className="bg-raised border border-border rounded px-3 py-1 text-xs text-text-main focus:border-gold/50 focus:outline-none"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={handleAddBreakthrough} className="px-4 py-2 border border-border text-text-muted rounded-lg text-xs font-cinzel hover:border-gold/30 hover:text-gold">
                + Add Breakthrough
              </button>
              {breakthroughs.length > 0 && (
                <button onClick={handleSaveBreakthroughs} className="px-4 py-2 bg-gold/10 text-gold border border-gold/30 rounded-lg text-xs font-cinzel">
                  Save
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Preferences */}
        {activeSection === 'preferences' && (
          <motion.div key="preferences" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">What works well for you in therapy?</label>
              <textarea
                value={preferredApproach}
                onChange={(e) => setPreferredApproach(e.target.value)}
                placeholder="e.g. I respond well to direct challenge, I prefer slower pacing, I need time to process before speaking..."
                rows={3}
                className="w-full bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none resize-none"
                maxLength={500}
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Communication preferences</label>
              <textarea
                value={commPrefs}
                onChange={(e) => setCommPrefs(e.target.value)}
                placeholder="e.g. I prefer email over phone, I need 24h notice for cancellations..."
                rows={2}
                className="w-full bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none resize-none"
                maxLength={500}
              />
            </div>
            <div>
              <label className="block text-xs text-amber-400 mb-1.5">Sensitive areas / trigger warnings</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {triggerWarnings.map((tw, i) => (
                  <span key={i} className="px-2.5 py-1 bg-amber-900/20 text-amber-400 text-xs rounded-full border border-amber-500/20 flex items-center gap-1.5">
                    {tw}
                    <button onClick={() => handleRemoveTrigger(i)} className="hover:text-red-400 text-[9px]">✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  placeholder="Add a sensitive area..."
                  className="flex-1 bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-amber-500/50 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTrigger()}
                  maxLength={200}
                />
                <button onClick={handleAddTrigger} disabled={!newTrigger.trim()} className="px-4 py-2 bg-amber-900/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-cinzel disabled:opacity-40">Add</button>
              </div>
            </div>
            <button onClick={handleSaveApproach} className="px-6 py-2 bg-gold/10 text-gold border border-gold/30 rounded-lg text-xs font-cinzel">Save Preferences</button>
          </motion.div>
        )}

        {/* Share */}
        {activeSection === 'share' && (
          <motion.div key="share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="bg-surface border border-border rounded-lg p-5">
              <h3 className="font-cinzel text-sm text-text-main mb-2">Share with a new therapist</h3>
              <p className="text-xs text-text-muted mb-4">
                Generate a read-only link that lets a new therapist view your profile. Links expire after 30 days and can be revoked at any time.
              </p>
              <button
                onClick={handleCreateShareLink}
                disabled={creatingShare}
                className="px-6 py-2.5 bg-gold/10 text-gold border border-gold/30 rounded-lg text-xs font-cinzel tracking-widest hover:bg-gold/20 disabled:opacity-50 transition-colors"
              >
                {creatingShare ? 'Creating...' : 'Generate Share Link'}
              </button>

              {shareUrl && (
                <div className="mt-4 bg-raised border border-gold/20 rounded-lg p-3">
                  <p className="text-[10px] text-text-muted mb-1">Share this link:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-void border border-border rounded px-2 py-1 text-xs text-gold font-mono"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                      className="px-3 py-1 bg-gold/10 text-gold text-[10px] rounded border border-gold/30"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Existing share tokens */}
            {profileData?.shareTokens && profileData.shareTokens.length > 0 && (
              <div>
                <h4 className="text-xs text-text-muted font-cinzel tracking-wider mb-2">Active share links</h4>
                <div className="space-y-2">
                  {profileData.shareTokens.map(st => (
                    <div key={st.token} className="bg-surface/50 border border-border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-text-main">{st.label}</p>
                        <p className="text-[9px] text-text-muted">
                          Expires: {new Date(st.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/profile/${st.token}`)}
                        className="text-[9px] px-2 py-1 text-gold border border-gold/20 rounded hover:bg-gold/10"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-text-muted">
              Your therapy profile is user-owned. You control who sees it and for how long. Data is never shared without your explicit action.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
