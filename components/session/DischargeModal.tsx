'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface DischargeModalProps {
  clientId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
  onDischarged: () => void;
}

const DISCHARGE_REASONS = [
  { value: 'completed', label: 'Treatment Completed', desc: 'Client has met treatment goals' },
  { value: 'terminated', label: 'Early Termination', desc: 'Treatment ended before completion' },
  { value: 'transferred', label: 'Transferred', desc: 'Client referred to another provider' },
  { value: 'other', label: 'Other', desc: 'Other reason for discharge' },
] as const;

export function DischargeModal({ clientId, clientName, isOpen, onClose, onDischarged }: DischargeModalProps) {
  const { getIdToken } = useAuth();
  const [reason, setReason] = useState<string>('completed');
  const [notes, setNotes] = useState('');
  const [includeHistory, setIncludeHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const handleDischarge = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/discharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientId,
          reason,
          notes: notes.trim() || undefined,
          includeFullHistory: includeHistory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setArchiveId(data.archive?.id || null);
        setStep('done');
        onDischarged();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to discharge client');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface border border-crimson/20 rounded-lg p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'form' && (
          <>
            <h2 className="font-cinzel text-lg text-text-main mb-1">Discharge Client</h2>
            <p className="text-xs text-text-muted mb-6">
              Discharge <strong className="text-text-main">{clientName}</strong> from your practice. This will revoke data sharing consent and archive the treatment record.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">Reason</label>
                <div className="space-y-2">
                  {DISCHARGE_REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        reason === r.value
                          ? 'border-gold bg-gold/5'
                          : 'border-border hover:border-gold/30'
                      }`}
                    >
                      <div className="font-cinzel text-xs text-text-main">{r.label}</div>
                      <div className="text-[10px] text-text-muted">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-muted font-cinzel tracking-wider mb-2">Discharge Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Clinical notes about the discharge..."
                  rows={3}
                  className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-sm text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHistory}
                  onChange={(e) => setIncludeHistory(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-raised text-gold focus:ring-gold/50"
                />
                <div>
                  <p className="text-sm text-text-main">Include full treatment history</p>
                  <p className="text-[10px] text-text-muted">Archive homework, notes, and session data</p>
                </div>
              </label>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-crimson/10 border border-crimson/20 rounded-lg">
                <p className="text-sm text-crimson">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-gold/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 py-3 bg-crimson/10 border border-crimson/30 text-crimson font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-crimson/20 transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-crimson/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="font-cinzel text-lg text-crimson mb-2">Confirm Discharge</h2>
              <p className="text-sm text-text-muted">
                This will permanently end the therapeutic relationship with <strong className="text-text-main">{clientName}</strong> and revoke all data sharing consent.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-crimson/10 border border-crimson/20 rounded-lg">
                <p className="text-sm text-crimson">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('form')}
                className="flex-1 py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-gold/30 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleDischarge}
                disabled={submitting}
                className="flex-1 py-3 bg-crimson text-void font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-crimson-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Discharging...' : 'Confirm Discharge'}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="text-center">
            <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="font-cinzel text-lg text-teal mb-2">Client Discharged</h2>
            <p className="text-sm text-text-muted mb-2">
              {clientName} has been discharged from your practice.
            </p>
            {archiveId && (
              <p className="text-[10px] text-text-muted/70 mb-6">
                Archive ID: {archiveId.slice(0, 8).toUpperCase()}
              </p>
            )}
            <button
              onClick={onClose}
              className="px-8 py-3 bg-teal/10 border border-teal text-teal font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-teal hover:text-void transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
