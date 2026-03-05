'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { UK_CRISIS_CONTACTS } from '@/lib/risk-assessment';

interface WarningSign {
  id: string;
  text: string;
  category: 'thoughts' | 'feelings' | 'behaviours' | 'physical';
}

interface ActionStep {
  id: string;
  trigger: string;
  action: string;
}

interface RelapsePlan {
  warningSignsEarly: WarningSign[];
  warningSignsLate: WarningSign[];
  copingStrategies: string[];
  supportPeople: Array<{ name: string; phone: string; howTheyHelp: string }>;
  actionPlan: ActionStep[];
  reasonsToStayWell: string[];
  updatedAt: string;
}

export function RelapsePrevention() {
  const { user, getIdToken } = useAuth();
  const [plan, setPlan] = useState<RelapsePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Form states
  const [newWarningSign, setNewWarningSign] = useState('');
  const [newWarningCategory, setNewWarningCategory] = useState<'thoughts' | 'feelings' | 'behaviours' | 'physical'>('thoughts');
  const [newWarningType, setNewWarningType] = useState<'early' | 'late'>('early');
  const [newCopingStrategy, setNewCopingStrategy] = useState('');
  const [newSupportPerson, setNewSupportPerson] = useState({ name: '', phone: '', howTheyHelp: '' });
  const [newReason, setNewReason] = useState('');

  const loadPlan = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/relapse-prevention', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
      }
    } catch (e) {
      console.error('Failed to load relapse prevention plan:', e);
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const savePlan = async (updates: Partial<RelapsePlan>) => {
    if (!user) return;
    try {
      const token = await getIdToken();
      const res = await fetch('/api/relapse-prevention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
      }
    } catch (e) {
      console.error('Failed to save plan:', e);
    }
  };

  const addWarningSign = () => {
    if (!newWarningSign.trim()) return;
    const sign: WarningSign = {
      id: crypto.randomUUID(),
      text: newWarningSign,
      category: newWarningCategory,
    };
    const key = newWarningType === 'early' ? 'warningSignsEarly' : 'warningSignsLate';
    const current = plan?.[key] || [];
    savePlan({ [key]: [...current, sign] });
    setNewWarningSign('');
  };

  const addCopingStrategy = () => {
    if (!newCopingStrategy.trim()) return;
    const current = plan?.copingStrategies || [];
    savePlan({ copingStrategies: [...current, newCopingStrategy] });
    setNewCopingStrategy('');
  };

  const addSupportPerson = () => {
    if (!newSupportPerson.name.trim()) return;
    const current = plan?.supportPeople || [];
    savePlan({ supportPeople: [...current, newSupportPerson] });
    setNewSupportPerson({ name: '', phone: '', howTheyHelp: '' });
  };

  const addReason = () => {
    if (!newReason.trim()) return;
    const current = plan?.reasonsToStayWell || [];
    savePlan({ reasonsToStayWell: [...current, newReason] });
    setNewReason('');
  };

  const categoryIcons = {
    thoughts: '💭',
    feelings: '❤️',
    behaviours: '🚶',
    physical: '🫀',
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900/30 to-emerald-900/30 p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-cinzel text-lg text-text-main">Relapse Prevention Plan</h2>
            <p className="text-xs text-text-muted mt-1">
              Your personal toolkit for staying well
            </p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className={`px-4 py-2 rounded-lg text-xs font-cinzel tracking-widest transition-colors ${
              editing 
                ? 'bg-teal-500 text-void' 
                : 'border border-teal-500/50 text-teal-400 hover:bg-teal-500/10'
            }`}
          >
            {editing ? 'Done Editing' : 'Edit Plan'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Early Warning Signs */}
        <section>
          <button
            onClick={() => setActiveSection(activeSection === 'early' ? null : 'early')}
            className="w-full flex items-center justify-between p-4 bg-raised rounded-lg hover:bg-amber-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div className="text-left">
                <h3 className="font-cinzel text-sm text-text-main">Early Warning Signs</h3>
                <p className="text-xs text-text-muted">First signs that things might be slipping</p>
              </div>
            </div>
            <span className="text-text-muted">{activeSection === 'early' ? '−' : '+'}</span>
          </button>

          {activeSection === 'early' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pl-4 border-l-2 border-amber-500/30"
            >
              {plan?.warningSignsEarly?.map((sign) => (
                <div key={sign.id} className="flex items-center gap-2 py-2">
                  <span>{categoryIcons[sign.category]}</span>
                  <span className="text-sm text-text-mid">{sign.text}</span>
                </div>
              ))}
              
              {editing && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={newWarningCategory}
                      onChange={(e) => setNewWarningCategory(e.target.value as typeof newWarningCategory)}
                      className="bg-raised border border-border rounded px-2 py-1 text-xs text-text-main"
                    >
                      <option value="thoughts">💭 Thoughts</option>
                      <option value="feelings">❤️ Feelings</option>
                      <option value="behaviours">🚶 Behaviours</option>
                      <option value="physical">🫀 Physical</option>
                    </select>
                    <input
                      type="text"
                      value={newWarningSign}
                      onChange={(e) => setNewWarningSign(e.target.value)}
                      placeholder="Add early warning sign..."
                      className="flex-1 bg-raised border border-border rounded px-3 py-1 text-sm text-text-main placeholder:text-text-muted/50"
                    />
                    <button
                      onClick={() => { setNewWarningType('early'); addWarningSign(); }}
                      className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </section>

        {/* Late Warning Signs */}
        <section>
          <button
            onClick={() => setActiveSection(activeSection === 'late' ? null : 'late')}
            className="w-full flex items-center justify-between p-4 bg-raised rounded-lg hover:bg-red-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="text-left">
                <h3 className="font-cinzel text-sm text-text-main">Late Warning Signs</h3>
                <p className="text-xs text-text-muted">Signs that I need to act now</p>
              </div>
            </div>
            <span className="text-text-muted">{activeSection === 'late' ? '−' : '+'}</span>
          </button>

          {activeSection === 'late' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pl-4 border-l-2 border-red-500/30"
            >
              {plan?.warningSignsLate?.map((sign) => (
                <div key={sign.id} className="flex items-center gap-2 py-2">
                  <span>{categoryIcons[sign.category]}</span>
                  <span className="text-sm text-text-mid">{sign.text}</span>
                </div>
              ))}
              
              {editing && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={newWarningCategory}
                      onChange={(e) => setNewWarningCategory(e.target.value as typeof newWarningCategory)}
                      className="bg-raised border border-border rounded px-2 py-1 text-xs text-text-main"
                    >
                      <option value="thoughts">💭 Thoughts</option>
                      <option value="feelings">❤️ Feelings</option>
                      <option value="behaviours">🚶 Behaviours</option>
                      <option value="physical">🫀 Physical</option>
                    </select>
                    <input
                      type="text"
                      value={newWarningSign}
                      onChange={(e) => setNewWarningSign(e.target.value)}
                      placeholder="Add late warning sign..."
                      className="flex-1 bg-raised border border-border rounded px-3 py-1 text-sm text-text-main placeholder:text-text-muted/50"
                    />
                    <button
                      onClick={() => { setNewWarningType('late'); addWarningSign(); }}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </section>

        {/* Coping Strategies */}
        <section>
          <button
            onClick={() => setActiveSection(activeSection === 'coping' ? null : 'coping')}
            className="w-full flex items-center justify-between p-4 bg-raised rounded-lg hover:bg-teal-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛠️</span>
              <div className="text-left">
                <h3 className="font-cinzel text-sm text-text-main">Coping Strategies</h3>
                <p className="text-xs text-text-muted">Things that help me feel better</p>
              </div>
            </div>
            <span className="text-text-muted">{activeSection === 'coping' ? '−' : '+'}</span>
          </button>

          {activeSection === 'coping' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pl-4 border-l-2 border-teal-500/30"
            >
              <ul className="space-y-2">
                {plan?.copingStrategies?.map((strategy, i) => (
                  <li key={i} className="text-sm text-text-mid flex items-center gap-2">
                    <span className="text-teal-400">•</span>
                    {strategy}
                  </li>
                ))}
              </ul>
              
              {editing && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newCopingStrategy}
                    onChange={(e) => setNewCopingStrategy(e.target.value)}
                    placeholder="Add coping strategy..."
                    className="flex-1 bg-raised border border-border rounded px-3 py-1 text-sm text-text-main placeholder:text-text-muted/50"
                  />
                  <button
                    onClick={addCopingStrategy}
                    className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded text-xs"
                  >
                    Add
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </section>

        {/* Support People */}
        <section>
          <button
            onClick={() => setActiveSection(activeSection === 'support' ? null : 'support')}
            className="w-full flex items-center justify-between p-4 bg-raised rounded-lg hover:bg-blue-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div className="text-left">
                <h3 className="font-cinzel text-sm text-text-main">Support Network</h3>
                <p className="text-xs text-text-muted">People I can reach out to</p>
              </div>
            </div>
            <span className="text-text-muted">{activeSection === 'support' ? '−' : '+'}</span>
          </button>

          {activeSection === 'support' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pl-4 border-l-2 border-blue-500/30"
            >
              <div className="space-y-3">
                {plan?.supportPeople?.map((person, i) => (
                  <div key={i} className="bg-raised rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-cinzel text-sm text-text-main">{person.name}</span>
                      <a href={`tel:${person.phone}`} className="text-xs text-blue-400 hover:underline">
                        {person.phone}
                      </a>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{person.howTheyHelp}</p>
                  </div>
                ))}
              </div>
              
              {editing && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={newSupportPerson.name}
                    onChange={(e) => setNewSupportPerson({ ...newSupportPerson, name: e.target.value })}
                    placeholder="Name"
                    className="w-full bg-raised border border-border rounded px-3 py-1 text-sm text-text-main placeholder:text-text-muted/50"
                  />
                  <input
                    type="tel"
                    value={newSupportPerson.phone}
                    onChange={(e) => setNewSupportPerson({ ...newSupportPerson, phone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full bg-raised border border-border rounded px-3 py-1 text-sm text-text-main placeholder:text-text-muted/50"
                  />
                  <input
                    type="text"
                    value={newSupportPerson.howTheyHelp}
                    onChange={(e) => setNewSupportPerson({ ...newSupportPerson, howTheyHelp: e.target.value })}
                    placeholder="How they help me"
                    className="w-full bg-raised border border-border rounded px-3 py-1 text-sm text-text-main placeholder:text-text-muted/50"
                  />
                  <button
                    onClick={addSupportPerson}
                    className="w-full py-2 bg-blue-500/20 text-blue-400 rounded text-xs"
                  >
                    Add Person
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </section>

        {/* Reasons to Stay Well */}
        <section>
          <button
            onClick={() => setActiveSection(activeSection === 'reasons' ? null : 'reasons')}
            className="w-full flex items-center justify-between p-4 bg-raised rounded-lg hover:bg-emerald-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div className="text-left">
                <h3 className="font-cinzel text-sm text-text-main">Reasons to Stay Well</h3>
                <p className="text-xs text-text-muted">What I&apos;m working towards</p>
              </div>
            </div>
            <span className="text-text-muted">{activeSection === 'reasons' ? '−' : '+'}</span>
          </button>

          {activeSection === 'reasons' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pl-4 border-l-2 border-emerald-500/30"
            >
              <ul className="space-y-2">
                {plan?.reasonsToStayWell?.map((reason, i) => (
                  <li key={i} className="text-sm text-text-mid flex items-center gap-2">
                    <span className="text-emerald-400">★</span>
                    {reason}
                  </li>
                ))}
              </ul>
              
              {editing && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Add a reason..."
                    className="flex-1 bg-raised border border-border rounded px-3 py-1 text-sm text-text-main placeholder:text-text-muted/50"
                  />
                  <button
                    onClick={addReason}
                    className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs"
                  >
                    Add
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </section>

        {/* Crisis Contacts - Always visible */}
        <section className="bg-red-900/10 border border-red-500/30 rounded-lg p-4">
          <h3 className="font-cinzel text-sm text-red-400 mb-3">Emergency Contacts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {UK_CRISIS_CONTACTS.slice(0, 4).map((contact, i) => (
              <a
                key={i}
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="flex items-center justify-between p-2 bg-red-500/5 rounded hover:bg-red-500/10 transition-colors"
              >
                <span className="text-sm text-text-main">{contact.name}</span>
                <span className="text-xs text-red-400">{contact.phone}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
