'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'motion/react';

interface SharedProfile {
  goals: string[];
  modality: string;
  modalityOther?: string;
  recurringThemes: string[];
  breakthroughMoments: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
  }>;
  preferredApproach: string | null;
  triggerWarnings: string[];
  communicationPreferences: string | null;
}

const MODALITY_LABELS: Record<string, string> = {
  cbt: 'Cognitive Behavioural Therapy (CBT)',
  act: 'Acceptance & Commitment Therapy (ACT)',
  schema: 'Schema Therapy',
  ifs: 'Internal Family Systems (IFS)',
  psychodynamic: 'Psychodynamic Therapy',
  humanistic: 'Humanistic / Person-Centred',
  integrative: 'Integrative',
  'person-centred': 'Person-Centred',
  dbt: 'Dialectical Behaviour Therapy (DBT)',
  emdr: 'Eye Movement Desensitisation & Reprocessing (EMDR)',
  other: 'Other',
  unsure: 'Not yet decided',
};

export default function SharedProfilePage() {
  const params = useParams();
  const token = params?.token as string;
  const [profile, setProfile] = useState<SharedProfile | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/therapy-profile/share?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setExpiresAt(data.expiresAt);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to load profile');
        }
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-cinzel text-xl text-text-main mb-3">Profile Not Available</h1>
          <p className="text-sm text-text-muted">{error || 'This share link may have expired or been revoked.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Shared via Sorca</p>
          <h1 className="font-cinzel text-2xl text-text-main mb-2">My Therapy Profile</h1>
          <p className="text-xs text-text-muted">
            This is a client-created, portable therapy profile. It is not a clinical document.
          </p>
          {expiresAt && (
            <p className="text-[9px] text-text-muted mt-1">
              Link expires: {new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        <div className="space-y-6">
          {/* Modality */}
          <div className="bg-surface border border-border rounded-lg p-5">
            <h2 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-2">Therapy Modality</h2>
            <p className="text-sm text-text-main">
              {MODALITY_LABELS[profile.modality] || profile.modality}
              {profile.modalityOther && ` — ${profile.modalityOther}`}
            </p>
          </div>

          {/* Goals */}
          {profile.goals.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-5">
              <h2 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-3">Therapy Goals</h2>
              <ul className="space-y-2">
                {profile.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gold mt-0.5">•</span>
                    <span className="text-sm text-text-main">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recurring Themes */}
          {profile.recurringThemes.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-5">
              <h2 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-3">Recurring Themes</h2>
              <div className="flex flex-wrap gap-2">
                {profile.recurringThemes.map((theme, i) => (
                  <span key={i} className="px-3 py-1.5 bg-gold/10 text-gold text-xs rounded-full border border-gold/20">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Breakthrough Moments */}
          {profile.breakthroughMoments.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-5">
              <h2 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-3">Breakthrough Moments</h2>
              <div className="space-y-3">
                {profile.breakthroughMoments.map((moment) => (
                  <div key={moment.id} className="bg-raised/50 border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm text-text-main font-medium">{moment.title}</h3>
                      <span className="text-[9px] text-text-muted">
                        {new Date(moment.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-text-mid leading-relaxed">{moment.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Approach */}
          {profile.preferredApproach && (
            <div className="bg-surface border border-border rounded-lg p-5">
              <h2 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-2">What Works for Me</h2>
              <p className="text-sm text-text-main leading-relaxed">{profile.preferredApproach}</p>
            </div>
          )}

          {/* Communication Preferences */}
          {profile.communicationPreferences && (
            <div className="bg-surface border border-border rounded-lg p-5">
              <h2 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-2">Communication Preferences</h2>
              <p className="text-sm text-text-main leading-relaxed">{profile.communicationPreferences}</p>
            </div>
          )}

          {/* Trigger Warnings */}
          {profile.triggerWarnings.length > 0 && (
            <div className="bg-surface border border-amber-500/20 rounded-lg p-5">
              <h2 className="font-cinzel text-xs text-amber-400 tracking-wider uppercase mb-3">Sensitive Areas</h2>
              <ul className="space-y-1.5">
                {profile.triggerWarnings.map((warning, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">⚠</span>
                    <span className="text-xs text-text-mid">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-text-muted max-w-md mx-auto">
            This profile was created by the individual using Sorca, a Socratic reflection tool.
            It is a patient-held record — not a clinical assessment or referral document.
            All content is self-reported and should be discussed collaboratively in session.
          </p>
          <p className="text-[9px] text-text-muted mt-2">
            sorca.uk — Socratic Reflection & Cognitive Archaeology
          </p>
        </div>
      </motion.div>
    </div>
  );
}
