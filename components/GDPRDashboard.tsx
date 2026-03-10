'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
  dataSharing: boolean;
  cookies: boolean;
}

interface AuditEntry {
  action: string;
  consentType: string;
  granted: boolean;
  timestamp: string;
}

interface DataExport {
  id: string;
  requestedAt: string;
  completedAt: string | null;
  status: string;
}

interface DeletionRequest {
  id: string;
  requestedAt: string;
  reason?: string;
  status: string;
  scheduledDeletionDate: string;
}

interface GDPRDashboardProps {
  onClose?: () => void;
}

const CONSENT_DESCRIPTIONS: Record<string, { label: string; description: string; essential: boolean }> = {
  cookies: {
    label: 'Essential Cookies',
    description: 'Required for the application to function. These cannot be disabled.',
    essential: true,
  },
  analytics: {
    label: 'Analytics',
    description: 'Help us understand how you use Sorca to improve the experience. No data is sold or shared with advertisers.',
    essential: false,
  },
  marketing: {
    label: 'Product Updates',
    description: 'Receive occasional emails about new features and improvements. You can unsubscribe at any time.',
    essential: false,
  },
  thirdParty: {
    label: 'Third-Party Integrations',
    description: 'Allow integration with external services like calendar sync. No clinical data is ever shared.',
    essential: false,
  },
  dataSharing: {
    label: 'Anonymised Research',
    description: 'Contribute anonymised, aggregated data to mental health research. Individual data is never identifiable.',
    essential: false,
  },
};

export function GDPRDashboard({ onClose }: GDPRDashboardProps) {
  const { user, profile, getIdToken } = useAuth();
  const [consents, setConsents] = useState<ConsentState>({
    analytics: false,
    marketing: false,
    thirdParty: false,
    dataSharing: false,
    cookies: true,
  });
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [dataExports, setDataExports] = useState<DataExport[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'consents' | 'audit' | 'export' | 'delete'>('consents');

  const [togglingConsent, setTogglingConsent] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);

  // Deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      const res = await fetch('/api/gdpr', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setConsents(data.consents);
        setAuditLog(data.auditLog || []);
        setDataExports(data.dataExports || []);
        setDeletionRequests(data.deletionRequests || []);
      }
    } catch (e) {
      console.error('Failed to load GDPR data:', e);
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleConsent = async (consentType: keyof ConsentState) => {
    if (consentType === 'cookies' || togglingConsent) return;
    const newValue = !consents[consentType];

    setConsents(prev => ({ ...prev, [consentType]: newValue }));
    setTogglingConsent(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/gdpr?action=update-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'update-consent',
          consentType,
          granted: newValue,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConsents(data.consents);
      } else {
        setConsents(prev => ({ ...prev, [consentType]: !newValue }));
      }
    } catch {
      setConsents(prev => ({ ...prev, [consentType]: !newValue }));
    } finally {
      setTogglingConsent(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/gdpr?action=export', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setExportData(JSON.stringify(data.exportData, null, 2));
        await loadData();
      }
    } catch (e) {
      console.error('Failed to export data:', e);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadExport = () => {
    if (!exportData) return;
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sorca-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRequestDeletion = async () => {
    if (!deleteEmail) return;
    setDeleting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/gdpr?action=delete-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'delete-request',
          confirmEmail: deleteEmail,
          reason: deleteReason || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDeleteMessage(data.message);
        setShowDeleteConfirm(false);
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit deletion request');
      }
    } catch (e) {
      console.error('Failed to request deletion:', e);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeletion = async (requestId: string) => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/gdpr?action=cancel-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'cancel-deletion', requestId }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error('Failed to cancel deletion:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'consents' as const, label: 'My Consents' },
    { id: 'audit' as const, label: 'Audit Log' },
    { id: 'export' as const, label: 'Export Data' },
    { id: 'delete' as const, label: 'Delete Data' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-cinzel text-lg text-text-main">Data & Privacy</h2>
          <p className="text-xs text-text-muted">UK GDPR compliant. Your data, your control.</p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text-main text-sm">✕</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 touch-scroll scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 text-[10px] font-cinzel tracking-widest rounded-full whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-teal/10 text-teal border border-teal/30'
                : 'text-text-muted hover:text-text-mid border border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Consents */}
        {activeTab === 'consents' && (
          <motion.div key="consents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {Object.entries(CONSENT_DESCRIPTIONS).map(([key, desc]) => (
              <div key={key} className="bg-surface border border-border rounded-lg p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm text-text-main">{desc.label}</h4>
                    {desc.essential && (
                      <span className="text-[8px] px-1.5 py-0.5 bg-teal/10 text-teal rounded">Essential</span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed">{desc.description}</p>
                </div>
                <button
                  onClick={() => handleToggleConsent(key as keyof ConsentState)}
                  disabled={desc.essential || togglingConsent}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    consents[key as keyof ConsentState] ? 'bg-teal' : 'bg-border'
                  } ${desc.essential || togglingConsent ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                      consents[key as keyof ConsentState] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}

            <div className="bg-raised border border-border rounded-lg p-3 mt-4">
              <p className="text-[9px] text-text-muted">
                <strong>Your rights under UK GDPR:</strong> You have the right to access, rectify, erase, restrict processing, 
                port your data, and object to processing. Sorca processes data under legitimate interest for service provision 
                and explicit consent for optional features. Data controller: Sorca. ICO registration pending.
              </p>
            </div>
          </motion.div>
        )}

        {/* Audit Log */}
        {activeTab === 'audit' && (
          <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {auditLog.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-text-muted">No consent changes recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...auditLog].reverse().map((entry, i) => (
                  <div key={i} className="bg-surface border border-border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-main">
                        {entry.action === 'consent_granted' && '✓ Consent granted'}
                        {entry.action === 'consent_withdrawn' && '✕ Consent withdrawn'}
                        {entry.action === 'deletion_requested' && '⚠ Deletion requested'}
                        {entry.action === 'deletion_cancelled' && '↩ Deletion cancelled'}
                        {' — '}
                        <span className="text-text-muted">
                          {CONSENT_DESCRIPTIONS[entry.consentType]?.label || entry.consentType}
                        </span>
                      </p>
                    </div>
                    <span className="text-[9px] text-text-muted whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Export Data */}
        {activeTab === 'export' && (
          <motion.div key="export" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="bg-surface border border-border rounded-lg p-5">
              <h3 className="font-cinzel text-sm text-text-main mb-2">Subject Access Request</h3>
              <p className="text-xs text-text-muted mb-4">
                Under UK GDPR Article 15, you have the right to receive a copy of all personal data we hold about you. 
                This includes your profile, session data, assessments, homework, mood records, and consent history.
              </p>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-6 py-2.5 bg-teal/10 text-teal border border-teal/30 rounded-lg font-cinzel text-xs tracking-widest hover:bg-teal/20 disabled:opacity-50 transition-colors"
              >
                {exporting ? 'Generating export...' : 'Generate Data Export'}
              </button>
            </div>

            {exportData && (
              <div className="bg-surface border border-teal/30 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-cinzel text-sm text-teal">Export Ready</h4>
                  <button
                    onClick={handleDownloadExport}
                    className="px-4 py-1.5 bg-teal text-void rounded text-[10px] font-cinzel tracking-widest"
                  >
                    Download JSON
                  </button>
                </div>
                <pre className="bg-raised border border-border rounded p-3 text-[10px] text-text-muted font-mono max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {exportData.slice(0, 2000)}{exportData.length > 2000 ? '\n...[truncated in preview]' : ''}
                </pre>
              </div>
            )}

            {dataExports.length > 0 && (
              <div>
                <h4 className="text-xs text-text-muted font-cinzel tracking-wider mb-2">Previous Exports</h4>
                <div className="space-y-1.5">
                  {dataExports.map(exp => (
                    <div key={exp.id} className="bg-surface/50 border border-border rounded p-2 flex items-center justify-between">
                      <span className="text-[10px] text-text-mid">Export {exp.id.slice(0, 8)}</span>
                      <span className="text-[9px] text-text-muted">
                        {new Date(exp.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Delete Data */}
        {activeTab === 'delete' && (
          <motion.div key="delete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {deleteMessage && (
              <div className="bg-teal/5 border border-teal/20 rounded-lg p-4">
                <p className="text-xs text-text-main">{deleteMessage}</p>
              </div>
            )}

            {/* Active deletion requests */}
            {deletionRequests.filter(r => r.status === 'pending').length > 0 && (
              <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-5">
                <h3 className="font-cinzel text-sm text-amber-400 mb-3">Pending Deletion</h3>
                {deletionRequests.filter(r => r.status === 'pending').map(req => (
                  <div key={req.id} className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-text-main">
                        Scheduled for: {new Date(req.scheduledDeletionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-[9px] text-text-muted">
                        Requested: {new Date(req.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelDeletion(req.id)}
                      className="px-3 py-1.5 border border-amber-500/30 text-amber-400 text-[10px] font-cinzel rounded hover:bg-amber-500/10"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-surface border border-border rounded-lg p-5">
              <h3 className="font-cinzel text-sm text-text-main mb-2">Right to Erasure</h3>
              <p className="text-xs text-text-muted mb-4">
                Under UK GDPR Article 17, you have the right to request deletion of all your personal data. 
                This action is irreversible after the 30-day cooling-off period. All session data, assessments, 
                profiles, and consent records will be permanently erased.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-2.5 border border-red-500/30 text-red-400 rounded-lg font-cinzel text-xs tracking-widest hover:bg-red-500/10 transition-colors"
                >
                  Request Data Deletion
                </button>
              ) : (
                <div className="space-y-3 bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                  <p className="text-xs text-red-400 font-medium">
                    Are you sure? This will schedule permanent deletion of all your data.
                  </p>
                  <input
                    type="email"
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    placeholder="Confirm your email address"
                    className="w-full bg-raised border border-border rounded px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-red-500/50 focus:outline-none"
                  />
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Reason for deletion (optional)"
                    rows={2}
                    className="w-full bg-raised border border-border rounded px-3 py-2 text-xs text-text-main placeholder:text-text-muted/50 focus:border-red-500/50 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRequestDeletion}
                      disabled={deleting || !deleteEmail}
                      className="flex-1 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded font-cinzel text-xs tracking-widest hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {deleting ? 'Submitting...' : 'Confirm Deletion Request'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 border border-border text-text-muted rounded text-xs font-cinzel hover:text-text-main"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-raised border border-border rounded-lg p-3">
              <p className="text-[9px] text-text-muted">
                <strong>30-day cooling-off:</strong> After requesting deletion, you have 30 days to change your mind. 
                During this period, your account remains active and no data is deleted. After 30 days, deletion is 
                irreversible. If you have an active therapist connection, please inform them before requesting deletion.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
