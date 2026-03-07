/**
 * Audit logging for therapist data access.
 * Creates an immutable trail of who accessed what patient data and when.
 */

import { getAdminFirestore, isAdminConfigured } from './firebase-admin';

export type AuditAction =
  | 'dashboard_view'
  | 'client_data_view'
  | 'session_prep_view'
  | 'week_summary_view'
  | 'homework_assign'
  | 'homework_view'
  | 'pattern_alert_view'
  | 'notes_create'
  | 'notes_view'
  | 'discharge'
  | 'safe_mode_toggle'
  | 'consent_view'
  | 'export_data';

interface AuditEntry {
  therapistId: string;
  action: AuditAction;
  patientId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  timestamp: string;
}

/**
 * Log a therapist data access event.
 * Fire-and-forget — does not throw on failure.
 */
export async function logTherapistAccess(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
  if (!isAdminConfigured()) return;

  try {
    const db = getAdminFirestore();
    await db.collection('therapistAuditLog').add({
      ...entry,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    // Audit logging should never break the main flow
    console.error('[audit-log] Failed to write audit entry:', e instanceof Error ? e.message : e);
  }
}
