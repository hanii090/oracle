'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { Stars } from '@/components/Stars';
import { ConsentIcon, CheckIcon } from '@/components/icons';

interface InviteData {
  id: string;
  therapistName: string;
  therapistEmail: string | null;
  message: string | null;
  defaultPermissions: {
    shareWeekSummary: boolean;
    shareHomeworkProgress: boolean;
    sharePatternAlerts: boolean;
    shareMoodData: boolean;
  };
  expiresAt: string;
}

function ConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, signIn, getIdToken } = useAuth();
  
  const inviteCode = searchParams.get('invite');
  
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({
    shareWeekSummary: true,
    shareHomeworkProgress: true,
    sharePatternAlerts: true,
    shareMoodData: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadInvite = useCallback(async () => {
    if (!inviteCode) {
      setError('No invite code provided');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/therapist/invite?code=${inviteCode}`);
      if (res.ok) {
        const data = await res.json();
        setInvite(data.invite);
        if (data.invite.defaultPermissions) {
          setPermissions(data.invite.defaultPermissions);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid or expired invite');
      }
    } catch {
      setError('Failed to load invite');
    } finally {
      setLoading(false);
    }
  }, [inviteCode]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  const handleAccept = async () => {
    if (!user) {
      await signIn();
      return;
    }

    if (!invite) return;

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
          inviteCode,
          permissions,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/user-dashboard');
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to grant consent');
      }
    } catch {
      setError('Failed to grant consent');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <Stars />
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <Stars />
        <div className="text-center px-6">
          <ConsentIcon size={48} className="mx-auto mb-4 text-text-muted/30" />
          <h1 className="font-cinzel text-xl text-text-main mb-2">Invalid Invite</h1>
          <p className="text-sm text-text-muted mb-6">{error}</p>
          <a href="/" className="text-gold hover:underline font-cinzel text-sm tracking-widest">
            ← Return to Sorca
          </a>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <Stars />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-6"
        >
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon size={32} className="text-emerald-400" />
          </div>
          <h1 className="font-cinzel text-xl text-emerald-400 mb-2">Consent Granted</h1>
          <p className="text-sm text-text-muted mb-4">
            You&apos;ve connected with {invite?.therapistName}. Redirecting to your dashboard...
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void flex items-center justify-center relative">
      <Stars />
      
      <div className="max-w-lg w-full mx-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-gold/30 rounded-lg p-8"
        >
          <div className="text-center mb-8">
            <ConsentIcon size={48} className="mx-auto mb-4 text-gold" />
            <h1 className="font-cinzel text-xl text-gold tracking-widest uppercase mb-2">
              Therapist Connection
            </h1>
            <p className="font-cormorant text-base text-text-mid">
              {invite?.therapistName} has invited you to connect on Sorca
            </p>
          </div>

          {invite?.message && (
            <div className="bg-raised rounded-lg p-4 mb-6">
              <p className="text-sm text-text-mid italic">&ldquo;{invite.message}&rdquo;</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-cinzel text-xs text-text-main tracking-widest uppercase mb-3">
              What you&apos;re sharing
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.shareWeekSummary}
                  onChange={(e) => setPermissions(p => ({ ...p, shareWeekSummary: e.target.checked }))}
                  className="w-4 h-4 rounded border-border bg-raised text-gold focus:ring-gold/50"
                />
                <div>
                  <p className="text-sm text-text-main">Week Summaries</p>
                  <p className="text-[10px] text-text-muted">Your weekly reflection summaries</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.shareHomeworkProgress}
                  onChange={(e) => setPermissions(p => ({ ...p, shareHomeworkProgress: e.target.checked }))}
                  className="w-4 h-4 rounded border-border bg-raised text-gold focus:ring-gold/50"
                />
                <div>
                  <p className="text-sm text-text-main">Homework Progress</p>
                  <p className="text-[10px] text-text-muted">Your homework completion and responses</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.sharePatternAlerts}
                  onChange={(e) => setPermissions(p => ({ ...p, sharePatternAlerts: e.target.checked }))}
                  className="w-4 h-4 rounded border-border bg-raised text-gold focus:ring-gold/50"
                />
                <div>
                  <p className="text-sm text-text-main">Pattern Alerts</p>
                  <p className="text-[10px] text-text-muted">Alerts when significant patterns are detected</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.shareMoodData}
                  onChange={(e) => setPermissions(p => ({ ...p, shareMoodData: e.target.checked }))}
                  className="w-4 h-4 rounded border-border bg-raised text-gold focus:ring-gold/50"
                />
                <div>
                  <p className="text-sm text-text-main">Mood Data</p>
                  <p className="text-[10px] text-text-muted">Your mood trends and emotional patterns</p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            {!user ? (
              <button
                onClick={() => signIn()}
                className="w-full py-3 bg-gold text-void font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/90 transition-colors"
              >
                Sign In to Accept
              </button>
            ) : (
              <button
                onClick={handleAccept}
                disabled={submitting}
                className="w-full py-3 bg-gold text-void font-cinzel text-xs tracking-widest uppercase rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Connecting...' : 'Accept & Connect'}
              </button>
            )}

            <a
              href="/"
              className="block text-center py-3 border border-border text-text-muted font-cinzel text-xs tracking-widest uppercase rounded-lg hover:border-gold/30 transition-colors"
            >
              Decline
            </a>
          </div>

          <p className="text-center text-[10px] text-text-muted mt-6">
            You can revoke consent at any time from your dashboard settings.
          </p>
        </motion.div>
      </div>
    </main>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <ConsentContent />
    </Suspense>
  );
}
