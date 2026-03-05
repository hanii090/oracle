'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Stars } from '@/components/Stars';
import { HomeworkIcon, CheckIcon, ChevronIcon } from '@/components/icons';

interface Client {
  id: string;
  displayName: string;
  email: string | null;
}

interface HomeworkTemplate {
  id: string;
  title: string;
  description: string;
  defaultDuration: number;
  questions: string[];
}

const HOMEWORK_TEMPLATES: HomeworkTemplate[] = [
  {
    id: 'thought-record',
    title: 'Thought Record',
    description: 'Daily CBT thought tracking exercise',
    defaultDuration: 7,
    questions: [
      'What situation triggered this thought?',
      'What emotion did you feel?',
      'What was the automatic thought?',
      'What evidence supports or contradicts this thought?',
    ],
  },
  {
    id: 'gratitude',
    title: 'Gratitude Practice',
    description: 'Daily gratitude reflection',
    defaultDuration: 7,
    questions: [
      'What are you grateful for today?',
      'Who made a positive difference?',
      'What small moment brought you joy?',
    ],
  },
  {
    id: 'behavioral-activation',
    title: 'Behavioral Activation',
    description: 'Schedule and track meaningful activities',
    defaultDuration: 7,
    questions: [
      'What activity did you complete today?',
      'How did you feel before vs after?',
      'What might you try tomorrow?',
    ],
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness Practice',
    description: 'Daily mindfulness check-in',
    defaultDuration: 7,
    questions: [
      'What did you notice in your body today?',
      'What thoughts passed through without judgment?',
      'When were you most present?',
    ],
  },
];

export function HomeworkAssignmentPage() {
  const { user, isTherapist, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<HomeworkTemplate | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [duration, setDuration] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [journeyPreview, setJourneyPreview] = useState<Record<string, { theme: string; question: string }> | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [useJourney, setUseJourney] = useState(true);

  const loadClients = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (e) {
      console.error('Failed to load clients:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (!authLoading && user && !isTherapist) {
      router.push('/');
      return;
    }
    if (user && isTherapist) {
      loadClients();
    }
  }, [user, isTherapist, authLoading, router, loadClients]);

  const generatePreview = async () => {
    const topic = selectedTemplate?.title || customTopic;
    if (!topic.trim()) return;

    setGeneratingPreview(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/homework-journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic,
          durationDays: duration,
          clientContext: customDescription || undefined,
          assign: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setJourneyPreview(data.journeyPlan);
      }
    } catch (e) {
      console.error('Failed to generate preview:', e);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedClient) return;
    if (!selectedTemplate && !customTopic.trim()) return;

    setSubmitting(true);
    try {
      const token = await getIdToken();
      const topic = selectedTemplate?.title || customTopic;

      // Use journey API if enabled, otherwise use basic assignment
      const endpoint = useJourney ? '/api/therapist/homework-journey' : '/api/therapist/assign-homework';
      const body = useJourney
        ? {
            topic,
            clientId: selectedClient.id,
            durationDays: duration,
            clientContext: customDescription || undefined,
            templateId: selectedTemplate?.id,
            assign: true,
          }
        : {
            clientId: selectedClient.id,
            topic,
            description: selectedTemplate?.description || customDescription,
            durationDays: duration,
            customQuestions: selectedTemplate?.questions || undefined,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSelectedClient(null);
          setSelectedTemplate(null);
          setCustomTopic('');
          setCustomDescription('');
          setDuration(7);
          setJourneyPreview(null);
        }, 2000);
      }
    } catch (e) {
      console.error('Failed to assign homework:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-void relative">
      <Stars />

      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <HomeworkIcon size={24} className="text-violet-400" />
            <div>
              <h1 className="font-cinzel text-2xl text-text-main">Assign Homework</h1>
              <p className="text-sm text-text-muted">Create conversational homework for your clients</p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="text-xs text-text-muted hover:text-gold font-cinzel tracking-widest"
          >
            ← Dashboard
          </a>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckIcon size={32} className="text-emerald-400" />
            </div>
            <h2 className="font-cinzel text-xl text-text-main mb-2">Homework Assigned!</h2>
            <p className="text-sm text-text-muted">
              {selectedClient?.displayName} will receive their first check-in tomorrow.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Client Selection */}
            <div className="space-y-6">
              <div className="bg-surface border border-border rounded-lg p-6">
                <h2 className="font-cinzel text-sm text-text-main mb-4">Select Client</h2>
                {clients.length === 0 ? (
                  <p className="text-sm text-text-muted">No clients with homework consent</p>
                ) : (
                  <div className="space-y-2">
                    {clients.map(client => (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedClient?.id === client.id
                            ? 'bg-violet-500/10 border border-violet-500/50'
                            : 'bg-raised border border-border hover:border-violet-500/30'
                        }`}
                      >
                        <div className="font-cinzel text-sm text-text-main">
                          {client.displayName}
                        </div>
                        {client.email && (
                          <div className="text-[10px] text-text-muted">{client.email}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Duration */}
              <div className="bg-surface border border-border rounded-lg p-6">
                <h2 className="font-cinzel text-sm text-text-main mb-4">Duration</h2>
                <div className="flex gap-2">
                  {[3, 5, 7, 14].map(days => (
                    <button
                      key={days}
                      onClick={() => setDuration(days)}
                      className={`px-4 py-2 rounded text-sm font-cinzel transition-all ${
                        duration === days
                          ? 'bg-violet-500 text-void'
                          : 'bg-raised border border-border hover:border-violet-500/30 text-text-mid'
                      }`}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Template Selection */}
            <div className="space-y-6">
              <div className="bg-surface border border-border rounded-lg p-6">
                <h2 className="font-cinzel text-sm text-text-main mb-4">Choose Template</h2>
                <div className="space-y-3">
                  {HOMEWORK_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setCustomTopic('');
                        setCustomDescription('');
                      }}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'bg-violet-500/10 border border-violet-500/50'
                          : 'bg-raised border border-border hover:border-violet-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-cinzel text-sm text-text-main">{template.title}</div>
                        <ChevronIcon size={16} className="text-text-muted" />
                      </div>
                      <p className="text-xs text-text-muted mt-1">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Homework */}
              <div className="bg-surface border border-border rounded-lg p-6">
                <h2 className="font-cinzel text-sm text-text-main mb-4">Or Create Custom</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => {
                      setCustomTopic(e.target.value);
                      setSelectedTemplate(null);
                    }}
                    placeholder="Homework topic"
                    className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-violet-500"
                  />
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Instructions for the client (optional)"
                    rows={3}
                    className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>
              </div>

              {/* AI Journey Toggle */}
              <div className="bg-surface border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-cinzel text-sm text-text-main">AI Conversational Journey</h2>
                    <p className="text-[10px] text-text-muted">Generate adaptive daily questions</p>
                  </div>
                  <button
                    onClick={() => setUseJourney(!useJourney)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      useJourney ? 'bg-violet-500' : 'bg-raised'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      useJourney ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {useJourney && (selectedTemplate || customTopic.trim()) && (
                  <button
                    onClick={generatePreview}
                    disabled={generatingPreview}
                    className="w-full py-2 border border-violet-500/50 text-violet-400 text-xs rounded-lg hover:bg-violet-500/10 transition-colors disabled:opacity-50"
                  >
                    {generatingPreview ? 'Generating Preview...' : '✨ Preview Journey'}
                  </button>
                )}

                {journeyPreview && (
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(journeyPreview).slice(0, 3).map(([day, content]) => (
                      <div key={day} className="bg-raised rounded p-2">
                        <p className="text-[10px] text-violet-400 uppercase">{day}: {content.theme}</p>
                        <p className="text-xs text-text-mid">{content.question}</p>
                      </div>
                    ))}
                    {Object.keys(journeyPreview).length > 3 && (
                      <p className="text-[10px] text-text-muted text-center">
                        +{Object.keys(journeyPreview).length - 3} more days...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleAssign}
                disabled={!selectedClient || (!selectedTemplate && !customTopic.trim()) || submitting}
                className="w-full py-4 bg-violet-500 text-void font-cinzel text-sm tracking-widest uppercase rounded-lg hover:bg-violet-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Assigning...' : useJourney ? 'Generate & Assign Journey' : 'Assign Homework'}
              </button>

              <p className="text-center text-[10px] text-text-muted">
                ⏱️ Takes ~2 minutes to complete
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
