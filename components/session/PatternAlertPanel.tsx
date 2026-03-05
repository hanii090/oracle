'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { AlertIcon, CheckIcon, CloseIcon } from '@/components/icons';

interface PatternAlert {
  id: string;
  clientId: string;
  clientName: string;
  type: 'distress' | 'pattern' | 'milestone' | 'mood_shift';
  message: string;
  severity: 'low' | 'medium' | 'high';
  acknowledged: boolean;
  createdAt: string;
}

interface PatternAlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALERT_TYPE_CONFIG = {
  distress: { label: 'Distress', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  pattern: { label: 'Pattern', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  milestone: { label: 'Milestone', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  mood_shift: { label: 'Mood Shift', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
};

export function PatternAlertPanel({ isOpen, onClose }: PatternAlertPanelProps) {
  const { getIdToken } = useAuth();
  const [alerts, setAlerts] = useState<PatternAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/pattern-alert', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen, loadAlerts]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/pattern-alert', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ alertId, acknowledged: true }),
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => 
          a.id === alertId ? { ...a, acknowledged: true } : a
        ));
      }
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/pattern-alert', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ alertId }),
      });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch (e) {
      console.error('Failed to dismiss alert:', e);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const unreadAlerts = alerts.filter(a => !a.acknowledged);
  const readAlerts = alerts.filter(a => a.acknowledged);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-void/50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-surface border-l border-border shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertIcon size={20} className="text-amber-400" />
                <h2 className="font-cinzel text-sm text-text-main tracking-wider">
                  Pattern Alerts
                </h2>
                {unreadAlerts.length > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-cinzel rounded-full">
                    {unreadAlerts.length} new
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-raised rounded transition-colors"
                aria-label="Close panel"
              >
                <CloseIcon size={18} className="text-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertIcon size={32} className="mx-auto mb-4 text-text-muted/50" />
                  <p className="text-sm text-text-muted">No alerts yet</p>
                  <p className="text-xs text-text-muted/70 mt-1">
                    Alerts will appear when patterns are detected in client sessions
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Unread Alerts */}
                  {unreadAlerts.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-cinzel text-text-muted tracking-widest uppercase mb-3">
                        New
                      </h3>
                      <div className="space-y-3">
                        {unreadAlerts.map(alert => {
                          const config = ALERT_TYPE_CONFIG[alert.type];
                          return (
                            <motion.div
                              key={alert.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-4 rounded-lg border ${config.border} ${config.bg}`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <span className={`text-[10px] font-cinzel tracking-wider ${config.color}`}>
                                    {config.label}
                                  </span>
                                  <span className="text-[10px] text-text-muted ml-2">
                                    {alert.clientName}
                                  </span>
                                </div>
                                <span className="text-[9px] text-text-muted">
                                  {formatTime(alert.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-text-mid leading-relaxed mb-3">
                                {alert.message}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => acknowledgeAlert(alert.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-cinzel rounded hover:bg-emerald-500/20 transition-colors"
                                >
                                  <CheckIcon size={12} />
                                  Acknowledge
                                </button>
                                <button
                                  onClick={() => dismissAlert(alert.id)}
                                  className="px-3 py-1.5 text-text-muted text-xs font-cinzel rounded hover:bg-raised transition-colors"
                                >
                                  Dismiss
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Read Alerts */}
                  {readAlerts.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-cinzel text-text-muted tracking-widest uppercase mb-3">
                        Previous
                      </h3>
                      <div className="space-y-2">
                        {readAlerts.slice(0, 10).map(alert => {
                          const config = ALERT_TYPE_CONFIG[alert.type];
                          return (
                            <div
                              key={alert.id}
                              className="p-3 rounded-lg bg-raised/50 border border-border"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`text-[10px] font-cinzel tracking-wider ${config.color} opacity-60`}>
                                  {config.label} · {alert.clientName}
                                </span>
                                <span className="text-[9px] text-text-muted">
                                  {formatTime(alert.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                                {alert.message}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Alert Badge for header
export function PatternAlertBadge({ onClick }: { onClick: () => void }) {
  const { getIdToken, isTherapist } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isTherapist) return;

    const loadUnreadCount = async () => {
      try {
        const token = await getIdToken();
        const res = await fetch('/api/pattern-alert?unread=true', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // Ignore
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [isTherapist, getIdToken]);

  if (!isTherapist) return null;

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-amber-500/10 rounded-lg transition-colors"
      aria-label={`Pattern alerts${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <AlertIcon size={20} className="text-amber-400/70 hover:text-amber-400" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-void text-[9px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
