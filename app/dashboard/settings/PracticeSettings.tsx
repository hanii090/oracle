'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Stars } from '@/components/Stars';
import { SettingsIcon, TherapistIcon, CopyIcon, CheckIcon } from '@/components/icons';

interface Invite {
  id: string;
  inviteCode: string;
  clientEmail: string;
  clientName: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface InviteSummary {
  pending: number;
  accepted: number;
  expired: number;
}

export function PracticeSettings() {
  const { user, profile, profileLoaded, isTherapist, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();
  
  const [invites, setInvites] = useState<Invite[]>([]);
  const [summary, setSummary] = useState<InviteSummary>({ pending: 0, accepted: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newInviteLink, setNewInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  const loadInvites = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/invite', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites || []);
        setSummary(data.summary || { pending: 0, accepted: 0, expired: 0 });
      }
    } catch (e) {
      console.error('Failed to load invites:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/');
      return;
    }
    
    if (!profileLoaded) return;
    
    if (!isTherapist) {
      router.push('/user-dashboard');
      return;
    }
    
    loadInvites();
  }, [user, profileLoaded, isTherapist, authLoading, router, loadInvites]);

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setSubmitting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientEmail: inviteEmail,
          clientName: inviteName || undefined,
          message: inviteMessage || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewInviteLink(data.invite.inviteLink);
        setInviteEmail('');
        setInviteName('');
        setInviteMessage('');
        loadInvites();
      }
    } catch (e) {
      console.error('Failed to create invite:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (newInviteLink) {
      await navigator.clipboard.writeText(newInviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('Failed to open billing portal:', e);
    } finally {
      setBillingLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <Stars />
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!isTherapist) {
    return null;
  }

  const pendingInvites = invites.filter(i => i.status === 'pending');

  return (
    <main className="min-h-screen bg-void relative">
      <Stars />

      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-cinzel text-2xl text-gold mb-1">Practice Settings</h1>
            <p className="text-sm text-text-muted">Manage your practice account</p>
          </div>
          <a
            href="/dashboard"
            className="text-xs text-text-muted hover:text-gold font-cinzel tracking-widest"
          >
            ← Back to Dashboard
          </a>
        </div>

        {/* Subscription Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-2">
                Subscription
              </h2>
              <p className="text-sm text-text-mid">
                <span className="text-gold font-cinzel">Practice Tier</span> — Up to 10 clients
              </p>
              <p className="text-xs text-text-muted mt-1">
                {summary.accepted}/10 active clients
              </p>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              className="px-4 py-2 border border-gold text-gold font-cinzel text-xs tracking-widest rounded-lg hover:bg-gold/10 disabled:opacity-50"
            >
              {billingLoading ? 'Loading...' : 'Manage Billing'}
            </button>
          </div>
        </motion.div>

        {/* Invite Clients Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase">
              Invite Clients
            </h2>
            {!showInviteForm && !newInviteLink && (
              <button
                onClick={() => setShowInviteForm(true)}
                className="text-xs text-teal hover:text-teal-bright font-cinzel tracking-widest"
              >
                + New Invite
              </button>
            )}
          </div>

          {newInviteLink && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckIcon size={16} className="text-emerald-400" />
                <p className="text-sm text-emerald-400">Invite created!</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newInviteLink}
                  readOnly
                  className="flex-1 bg-surface border border-border rounded px-3 py-2 text-xs text-text-main"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-emerald-500 text-void rounded hover:bg-emerald-400 flex items-center gap-1"
                >
                  {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                  <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <button
                onClick={() => { setNewInviteLink(null); setShowInviteForm(false); }}
                className="text-xs text-text-muted hover:text-text-main mt-3"
              >
                Done
              </button>
            </div>
          )}

          {showInviteForm && !newInviteLink && (
            <div className="bg-raised border border-teal/30 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Client email address"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-teal/50 focus:outline-none"
                />
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Client name (optional)"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-teal/50 focus:outline-none"
                />
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Personal message (optional)"
                  rows={2}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-teal/50 focus:outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateInvite}
                    disabled={submitting || !inviteEmail.trim()}
                    className="px-4 py-2 bg-teal text-void font-cinzel text-xs tracking-widest rounded-lg hover:bg-teal-bright disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating...' : 'Create Invite'}
                  </button>
                  <button
                    onClick={() => setShowInviteForm(false)}
                    className="px-4 py-2 border border-border text-text-muted font-cinzel text-xs tracking-widest rounded-lg hover:border-teal/30"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Invites */}
          {pendingInvites.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-text-muted mb-2">{pendingInvites.length} pending invite(s)</p>
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 bg-raised rounded-lg">
                  <div>
                    <p className="text-sm text-text-main">{invite.clientEmail}</p>
                    {invite.clientName && (
                      <p className="text-xs text-text-muted">{invite.clientName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-amber-400">Pending</p>
                    <p className="text-[10px] text-text-muted">
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : !showInviteForm && !newInviteLink && (
            <div className="text-center py-8">
              <TherapistIcon size={32} className="mx-auto mb-3 text-text-muted/30" />
              <p className="text-sm text-text-muted">No pending invites</p>
              <p className="text-xs text-text-muted/70 mt-1">
                Create an invite to connect with your clients
              </p>
            </div>
          )}
        </motion.div>

        {/* Client Limit Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-lg p-6"
        >
          <h2 className="font-cinzel text-sm text-text-main tracking-widest uppercase mb-4">
            Client Overview
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-raised rounded-lg p-4">
              <p className="text-2xl font-cinzel text-emerald-400">{summary.accepted}</p>
              <p className="text-xs text-text-muted">Active</p>
            </div>
            <div className="bg-raised rounded-lg p-4">
              <p className="text-2xl font-cinzel text-amber-400">{summary.pending}</p>
              <p className="text-xs text-text-muted">Pending</p>
            </div>
            <div className="bg-raised rounded-lg p-4">
              <p className="text-2xl font-cinzel text-text-muted">{10 - summary.accepted - summary.pending}</p>
              <p className="text-xs text-text-muted">Available</p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
