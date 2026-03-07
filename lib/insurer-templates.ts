/**
 * UK Insurer Report Templates
 * 
 * Pre-built templates for the major UK health insurers.
 * Therapists fill in clinical fields; the template handles
 * standard language, formatting, and insurer-specific requirements.
 */

export interface InsurerTemplate {
  id: string;
  name: string;
  shortName: string;
  requiredFields: string[];
  optionalFields: string[];
  claimCodeFormat?: string;
  notes: string;
  template: string;
}

export interface InsurerReportData {
  // Client details
  clientName: string;
  clientDOB: string;
  policyNumber: string;
  claimNumber?: string;
  
  // Therapist details
  therapistName: string;
  therapistQualifications: string;
  therapistRegistration: string; // e.g. "BACP Registered (123456)"
  practiceName?: string;
  practiceAddress?: string;
  
  // Clinical details
  referralDate: string;
  presentingProblem: string;
  diagnosis?: string; // ICD-10/DSM-5 code if required
  treatmentModality: string;
  sessionFrequency: string;
  sessionsAttended: number;
  sessionsAuthorised?: number;
  sessionsRequested?: number;
  
  // Outcome measures
  initialPHQ9?: number;
  currentPHQ9?: number;
  initialGAD7?: number;
  currentGAD7?: number;
  
  // Progress
  progressSummary: string;
  treatmentPlan: string;
  riskAssessment: string;
  
  // Dates
  reportDate: string;
  treatmentStartDate: string;
  expectedEndDate?: string;
}

export const INSURER_TEMPLATES: InsurerTemplate[] = [
  {
    id: 'axa-health',
    name: 'AXA Health',
    shortName: 'AXA',
    requiredFields: ['policyNumber', 'claimNumber', 'diagnosis', 'sessionsAuthorised', 'sessionsRequested'],
    optionalFields: ['expectedEndDate'],
    claimCodeFormat: 'AXA-XXXXXXX',
    notes: 'AXA Health requires ICD-10 codes and pre-authorisation reference numbers. Reports must include validated outcome measures (PHQ-9/GAD-7) for extension requests.',
    template: `PSYCHOLOGICAL THERAPY PROGRESS REPORT
FOR: AXA Health

Date of Report: {reportDate}

PATIENT DETAILS
Name: {clientName}
Date of Birth: {clientDOB}
Policy Number: {policyNumber}
Claim/Authorisation Number: {claimNumber}

THERAPIST DETAILS
Name: {therapistName}
Qualifications: {therapistQualifications}
Registration: {therapistRegistration}
Practice: {practiceName}
Address: {practiceAddress}

REFERRAL & PRESENTING PROBLEM
Date of Referral: {referralDate}
Presenting Problem: {presentingProblem}
Diagnosis (ICD-10): {diagnosis}

TREATMENT
Modality: {treatmentModality}
Frequency: {sessionFrequency}
Treatment Start Date: {treatmentStartDate}
Sessions Authorised: {sessionsAuthorised}
Sessions Attended to Date: {sessionsAttended}
Additional Sessions Requested: {sessionsRequested}

VALIDATED OUTCOME MEASURES
PHQ-9 (Depression): Initial {initialPHQ9} → Current {currentPHQ9}
GAD-7 (Anxiety): Initial {initialGAD7} → Current {currentGAD7}

PROGRESS SUMMARY
{progressSummary}

TREATMENT PLAN
{treatmentPlan}

RISK ASSESSMENT
{riskAssessment}

Expected End Date: {expectedEndDate}

Signed: {therapistName}, {therapistQualifications}
{therapistRegistration}
Date: {reportDate}`,
  },
  {
    id: 'bupa',
    name: 'BUPA',
    shortName: 'BUPA',
    requiredFields: ['policyNumber', 'presentingProblem', 'sessionsAttended'],
    optionalFields: ['diagnosis', 'sessionsRequested', 'expectedEndDate'],
    notes: 'BUPA typically requires progress reports every 6 sessions. Include clear treatment goals and measurable outcomes. BUPA may request a Treatment Summary Form separately.',
    template: `THERAPY PROGRESS REPORT
SUBMITTED TO: BUPA

Report Date: {reportDate}

CLIENT INFORMATION
Full Name: {clientName}
Date of Birth: {clientDOB}
BUPA Membership Number: {policyNumber}

TREATING THERAPIST
{therapistName}
{therapistQualifications}
{therapistRegistration}
{practiceName}

CLINICAL SUMMARY

Referral Date: {referralDate}
Presenting Difficulties: {presentingProblem}

Treatment Approach: {treatmentModality}
Session Frequency: {sessionFrequency}
Sessions Completed: {sessionsAttended}
Treatment Commenced: {treatmentStartDate}

OUTCOME MEASURES
PHQ-9: Baseline {initialPHQ9} | Current {currentPHQ9}
GAD-7: Baseline {initialGAD7} | Current {currentGAD7}

PROGRESS TO DATE
{progressSummary}

ONGOING TREATMENT PLAN
{treatmentPlan}

RISK
{riskAssessment}

RECOMMENDATION
Sessions requested for continued treatment: {sessionsRequested}
Anticipated completion: {expectedEndDate}

{therapistName}
{therapistQualifications} | {therapistRegistration}
{reportDate}`,
  },
  {
    id: 'cigna',
    name: 'Cigna Healthcare',
    shortName: 'Cigna',
    requiredFields: ['policyNumber', 'presentingProblem', 'treatmentModality', 'sessionsAttended'],
    optionalFields: ['diagnosis', 'claimNumber', 'sessionsRequested'],
    notes: 'Cigna uses an online portal for claims. This report format supplements their standard claim form. Cigna requires evidence of clinical need for session extensions beyond initial authorisation.',
    template: `CLINICAL REPORT — PSYCHOLOGICAL THERAPY
Provider: {therapistName}
Insurer: Cigna Healthcare

Date: {reportDate}

MEMBER DETAILS
Name: {clientName}
DOB: {clientDOB}
Cigna ID: {policyNumber}
Claim Reference: {claimNumber}

PROVIDER DETAILS
Therapist: {therapistName}
Credentials: {therapistQualifications}
Professional Body: {therapistRegistration}

CLINICAL INFORMATION
Date of First Session: {treatmentStartDate}
Referral Source & Date: {referralDate}
Presenting Complaint: {presentingProblem}

Therapeutic Modality: {treatmentModality}
Session Frequency: {sessionFrequency}
Total Sessions to Date: {sessionsAttended}

STANDARDISED MEASURES
PHQ-9: Pre-treatment {initialPHQ9} / Current {currentPHQ9}
GAD-7: Pre-treatment {initialGAD7} / Current {currentGAD7}

CLINICAL PROGRESS
{progressSummary}

TREATMENT PLAN & GOALS
{treatmentPlan}

RISK STATUS
{riskAssessment}

FURTHER TREATMENT RECOMMENDATION
Additional sessions recommended: {sessionsRequested}

Signature: {therapistName}, {therapistQualifications}
Date: {reportDate}`,
  },
  {
    id: 'vitality',
    name: 'Vitality Health',
    shortName: 'Vitality',
    requiredFields: ['policyNumber', 'presentingProblem', 'treatmentModality'],
    optionalFields: ['diagnosis', 'sessionsRequested', 'expectedEndDate'],
    notes: 'Vitality typically covers a set number of sessions per year. Reports should clearly demonstrate clinical necessity for treatment continuation. Vitality partners with specific EAP providers.',
    template: `THERAPY REPORT
For: Vitality Health Insurance

Date of Report: {reportDate}

PATIENT
Name: {clientName}
Date of Birth: {clientDOB}
Vitality Plan Number: {policyNumber}

THERAPIST
{therapistName}
{therapistQualifications}
{therapistRegistration}

CLINICAL DETAILS
Referral Date: {referralDate}
Presenting Issues: {presentingProblem}

Treatment Type: {treatmentModality}
Frequency: {sessionFrequency}
Start Date: {treatmentStartDate}
Sessions Attended: {sessionsAttended}

OUTCOME TRACKING
PHQ-9: Initial {initialPHQ9} → Current {currentPHQ9}
GAD-7: Initial {initialGAD7} → Current {currentGAD7}

PROGRESS REPORT
{progressSummary}

TREATMENT PLAN
{treatmentPlan}

RISK ASSESSMENT
{riskAssessment}

RECOMMENDATION
{sessionsRequested} further sessions recommended.
Expected completion: {expectedEndDate}

{therapistName}
{therapistRegistration}
{reportDate}`,
  },
  {
    id: 'aviva',
    name: 'Aviva',
    shortName: 'Aviva',
    requiredFields: ['policyNumber', 'presentingProblem'],
    optionalFields: ['diagnosis', 'claimNumber', 'sessionsRequested', 'expectedEndDate'],
    notes: 'Aviva may require reports to be submitted via their clinical team portal. Keep language clear and outcome-focused. Include NICE guideline references where appropriate.',
    template: `PSYCHOLOGICAL THERAPY REPORT
Insurer: Aviva

Report Date: {reportDate}

CLIENT
Name: {clientName}
Date of Birth: {clientDOB}
Policy Number: {policyNumber}
Claim Reference: {claimNumber}

THERAPIST
Name: {therapistName}
Qualifications: {therapistQualifications}
Registration: {therapistRegistration}
Practice: {practiceName}

ASSESSMENT & TREATMENT

Referral Date: {referralDate}
Presenting Problem: {presentingProblem}

Therapeutic Approach: {treatmentModality}
Session Frequency: {sessionFrequency}
Treatment Start: {treatmentStartDate}
Sessions Completed: {sessionsAttended}

VALIDATED MEASURES
PHQ-9 (Depression Severity): Intake {initialPHQ9} | Latest {currentPHQ9}
GAD-7 (Anxiety Severity): Intake {initialGAD7} | Latest {currentGAD7}

PROGRESS
{progressSummary}

ONGOING PLAN
{treatmentPlan}

RISK
{riskAssessment}

FURTHER SESSIONS
Recommended: {sessionsRequested}
Projected end date: {expectedEndDate}

{therapistName}, {therapistQualifications}
{therapistRegistration}
{reportDate}`,
  },
];

export function getInsurerTemplate(id: string): InsurerTemplate | undefined {
  return INSURER_TEMPLATES.find(t => t.id === id);
}

export function populateTemplate(template: string, data: Partial<InsurerReportData>): string {
  let result = template;
  const fields: Array<keyof InsurerReportData> = [
    'clientName', 'clientDOB', 'policyNumber', 'claimNumber',
    'therapistName', 'therapistQualifications', 'therapistRegistration',
    'practiceName', 'practiceAddress',
    'referralDate', 'presentingProblem', 'diagnosis', 'treatmentModality',
    'sessionFrequency', 'sessionsAttended', 'sessionsAuthorised', 'sessionsRequested',
    'initialPHQ9', 'currentPHQ9', 'initialGAD7', 'currentGAD7',
    'progressSummary', 'treatmentPlan', 'riskAssessment',
    'reportDate', 'treatmentStartDate', 'expectedEndDate',
  ];

  for (const field of fields) {
    const value = data[field];
    const placeholder = `{${field}}`;
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), 
      value !== undefined && value !== null ? String(value) : '[Not provided]');
  }

  return result;
}

export function getInsurerList(): Array<{ id: string; name: string; shortName: string }> {
  return INSURER_TEMPLATES.map(t => ({ id: t.id, name: t.name, shortName: t.shortName }));
}
