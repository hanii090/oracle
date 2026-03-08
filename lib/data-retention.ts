/**
 * NHS Data Retention Policies
 * Implements NHS standard retention periods and secure deletion
 */

export interface RetentionPolicy {
  category: string;
  retentionYears: number;
  description: string;
  legalBasis: string;
}

// NHS Records Management Code of Practice 2021
export const NHS_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    category: 'adult_mental_health',
    retentionYears: 20,
    description: 'Adult mental health records',
    legalBasis: 'NHS Records Management Code of Practice 2021',
  },
  {
    category: 'child_mental_health',
    retentionYears: 25,
    description: 'Child and adolescent mental health records (retain until 25th birthday or 8 years after last contact, whichever is longer)',
    legalBasis: 'NHS Records Management Code of Practice 2021',
  },
  {
    category: 'general_clinical',
    retentionYears: 8,
    description: 'General clinical records',
    legalBasis: 'NHS Records Management Code of Practice 2021',
  },
  {
    category: 'consent_records',
    retentionYears: 8,
    description: 'Consent documentation',
    legalBasis: 'GDPR Article 6, NHS Records Management Code',
  },
  {
    category: 'safeguarding',
    retentionYears: 25,
    description: 'Safeguarding records',
    legalBasis: 'Working Together to Safeguard Children 2018',
  },
  {
    category: 'audit_logs',
    retentionYears: 8,
    description: 'Access and audit logs',
    legalBasis: 'Data Protection Act 2018, NHS DSP Toolkit',
  },
];

export interface DataRecord {
  id: string;
  userId: string;
  category: string;
  createdAt: string;
  lastAccessedAt: string;
  treatmentEndDate?: string;
  dateOfBirth?: string;
  isArchived: boolean;
  scheduledDeletionDate?: string;
}

/**
 * Calculate retention end date based on category and patient details
 */
export function calculateRetentionEndDate(
  category: string,
  treatmentEndDate: string,
  dateOfBirth?: string
): Date {
  const policy = NHS_RETENTION_POLICIES.find(p => p.category === category);
  if (!policy) {
    // Default to 8 years if category not found
    const endDate = new Date(treatmentEndDate);
    endDate.setFullYear(endDate.getFullYear() + 8);
    return endDate;
  }

  // For child records, calculate based on 25th birthday or standard retention
  if (category === 'child_mental_health' && dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const twentyFifthBirthday = new Date(dob);
    twentyFifthBirthday.setFullYear(dob.getFullYear() + 25);

    const standardRetention = new Date(treatmentEndDate);
    standardRetention.setFullYear(standardRetention.getFullYear() + 8);

    // Return whichever is later
    return twentyFifthBirthday > standardRetention ? twentyFifthBirthday : standardRetention;
  }

  // Standard retention calculation
  const endDate = new Date(treatmentEndDate);
  endDate.setFullYear(endDate.getFullYear() + policy.retentionYears);
  return endDate;
}

/**
 * Check if a record is due for deletion
 */
export function isRecordDueForDeletion(record: DataRecord): boolean {
  if (!record.scheduledDeletionDate) return false;
  return new Date(record.scheduledDeletionDate) <= new Date();
}

/**
 * Check if a record should be archived (treatment ended)
 */
export function shouldArchiveRecord(record: DataRecord): boolean {
  if (record.isArchived) return false;
  if (!record.treatmentEndDate) return false;
  
  // Archive 30 days after treatment end
  const archiveDate = new Date(record.treatmentEndDate);
  archiveDate.setDate(archiveDate.getDate() + 30);
  return new Date() >= archiveDate;
}

/**
 * Get records approaching deletion (within 90 days)
 */
export function getRecordsApproachingDeletion(records: DataRecord[]): DataRecord[] {
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  return records.filter(record => {
    if (!record.scheduledDeletionDate) return false;
    const deletionDate = new Date(record.scheduledDeletionDate);
    return deletionDate <= ninetyDaysFromNow && deletionDate > new Date();
  });
}

export interface DeletionRequest {
  id: string;
  userId: string;
  requestedAt: string;
  requestedBy: 'user' | 'system' | 'admin';
  reason: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  completedAt?: string;
  recordIds: string[];
}

/**
 * Generate deletion audit record
 */
export function generateDeletionAuditRecord(
  request: DeletionRequest,
  deletedRecordCount: number
): string {
  return JSON.stringify({
    deletionId: request.id,
    userId: request.userId,
    requestedAt: request.requestedAt,
    requestedBy: request.requestedBy,
    reason: request.reason,
    approvedBy: request.approvedBy,
    approvedAt: request.approvedAt,
    completedAt: new Date().toISOString(),
    recordsDeleted: deletedRecordCount,
    retentionPolicyApplied: true,
  });
}

/**
 * GDPR Subject Access Request (SAR) data export format
 */
export interface SubjectAccessExport {
  exportDate: string;
  userId: string;
  personalData: {
    profile: Record<string, unknown>;
    sessions: Array<Record<string, unknown>>;
    outcomeMeasures: Array<Record<string, unknown>>;
    homework: Array<Record<string, unknown>>;
    consents: Array<Record<string, unknown>>;
  };
  processingActivities: string[];
  dataRetentionInfo: {
    category: string;
    retentionPeriod: string;
    scheduledDeletion?: string;
  }[];
}

/**
 * Generate GDPR-compliant data export
 */
export function generateSubjectAccessExport(
  userId: string,
  data: SubjectAccessExport['personalData']
): SubjectAccessExport {
  return {
    exportDate: new Date().toISOString(),
    userId,
    personalData: data,
    processingActivities: [
      'Provision of psychological therapy support',
      'Outcome measurement and clinical effectiveness tracking',
      'Homework assignment and progress monitoring',
      'Communication with healthcare providers (with consent)',
      'Service improvement and anonymised research',
    ],
    dataRetentionInfo: NHS_RETENTION_POLICIES.map(policy => ({
      category: policy.category,
      retentionPeriod: `${policy.retentionYears} years`,
      scheduledDeletion: undefined,
    })),
  };
}

/**
 * Right to erasure eligibility check
 */
export function canEraseData(
  record: DataRecord,
  hasActiveConsent: boolean,
  hasOngoingTreatment: boolean
): { canErase: boolean; reason: string } {
  // Cannot erase during active treatment
  if (hasOngoingTreatment) {
    return {
      canErase: false,
      reason: 'Data cannot be erased during active treatment',
    };
  }

  // Check if within mandatory retention period
  if (record.treatmentEndDate) {
    const retentionEnd = calculateRetentionEndDate(
      record.category,
      record.treatmentEndDate,
      record.dateOfBirth
    );
    
    if (new Date() < retentionEnd) {
      return {
        canErase: false,
        reason: `Data must be retained until ${retentionEnd.toLocaleDateString('en-GB')} per NHS retention policy`,
      };
    }
  }

  // Safeguarding records have special protection
  if (record.category === 'safeguarding') {
    return {
      canErase: false,
      reason: 'Safeguarding records cannot be erased under legal obligation',
    };
  }

  return {
    canErase: true,
    reason: 'Data eligible for erasure',
  };
}

/**
 * Anonymisation function for research/audit purposes
 */
export function anonymiseRecord(record: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'userId', 'patientId', 'therapistId', 'email', 'phone',
    'name', 'displayName', 'fullName', 'address', 'postcode',
    'nhsNumber', 'dateOfBirth', 'gpDetails',
  ];

  const anonymised = structuredClone(record);
  
  for (const field of sensitiveFields) {
    if (field in anonymised) {
      anonymised[field] = '[REDACTED]';
    }
  }

  // Generate anonymous ID
  anonymised.anonymousId = `ANON_${crypto.randomUUID().slice(0, 8)}`;
  
  return anonymised;
}
