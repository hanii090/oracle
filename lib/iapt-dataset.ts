/**
 * IAPT (Improving Access to Psychological Therapies) Dataset Definitions
 * For UK NHS-compliant therapy outcome tracking
 */

// PHQ-9 Depression Questionnaire
export const PHQ9_QUESTIONS = [
  { id: 1, text: 'Little interest or pleasure in doing things' },
  { id: 2, text: 'Feeling down, depressed, or hopeless' },
  { id: 3, text: 'Trouble falling or staying asleep, or sleeping too much' },
  { id: 4, text: 'Feeling tired or having little energy' },
  { id: 5, text: 'Poor appetite or overeating' },
  { id: 6, text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
  { id: 7, text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
  { id: 8, text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual' },
  { id: 9, text: 'Thoughts that you would be better off dead or of hurting yourself in some way' },
] as const;

export const PHQ9_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
] as const;

// GAD-7 Anxiety Questionnaire
export const GAD7_QUESTIONS = [
  { id: 1, text: 'Feeling nervous, anxious, or on edge' },
  { id: 2, text: 'Not being able to stop or control worrying' },
  { id: 3, text: 'Worrying too much about different things' },
  { id: 4, text: 'Trouble relaxing' },
  { id: 5, text: 'Being so restless that it\'s hard to sit still' },
  { id: 6, text: 'Becoming easily annoyed or irritable' },
  { id: 7, text: 'Feeling afraid as if something awful might happen' },
] as const;

export const GAD7_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
] as const;

// WSAS - Work and Social Adjustment Scale
export const WSAS_QUESTIONS = [
  { id: 1, text: 'Because of my problems, my ability to work is impaired' },
  { id: 2, text: 'Because of my problems, my home management (cleaning, tidying, shopping, cooking, looking after home or children, paying bills) is impaired' },
  { id: 3, text: 'Because of my problems, my social leisure activities (with other people, such as parties, pubs, clubs, outings, visits, dating, home entertaining) are impaired' },
  { id: 4, text: 'Because of my problems, my private leisure activities (done alone, such as reading, gardening, collecting, sewing, walking alone) are impaired' },
  { id: 5, text: 'Because of my problems, my ability to form and maintain close relationships with others, including those I live with, is impaired' },
] as const;

export const WSAS_OPTIONS = [
  { value: 0, label: '0 - Not at all' },
  { value: 1, label: '1' },
  { value: 2, label: '2 - Slightly' },
  { value: 3, label: '3' },
  { value: 4, label: '4 - Definitely' },
  { value: 5, label: '5' },
  { value: 6, label: '6 - Markedly' },
  { value: 7, label: '7' },
  { value: 8, label: '8 - Very severely' },
] as const;

// Severity thresholds
export const PHQ9_SEVERITY = {
  minimal: { min: 0, max: 4, label: 'Minimal depression' },
  mild: { min: 5, max: 9, label: 'Mild depression' },
  moderate: { min: 10, max: 14, label: 'Moderate depression' },
  moderatelySevere: { min: 15, max: 19, label: 'Moderately severe depression' },
  severe: { min: 20, max: 27, label: 'Severe depression' },
} as const;

export const GAD7_SEVERITY = {
  minimal: { min: 0, max: 4, label: 'Minimal anxiety' },
  mild: { min: 5, max: 9, label: 'Mild anxiety' },
  moderate: { min: 10, max: 14, label: 'Moderate anxiety' },
  severe: { min: 15, max: 21, label: 'Severe anxiety' },
} as const;

export const WSAS_SEVERITY = {
  subclinical: { min: 0, max: 9, label: 'Subclinical' },
  mild: { min: 10, max: 19, label: 'Mild functional impairment' },
  moderate: { min: 20, max: 29, label: 'Moderate functional impairment' },
  severe: { min: 30, max: 40, label: 'Severe functional impairment' },
} as const;

// Clinical thresholds for IAPT
export const IAPT_THRESHOLDS = {
  PHQ9_CASENESS: 10, // Score >= 10 indicates clinical caseness
  GAD7_CASENESS: 8,  // Score >= 8 indicates clinical caseness
  PHQ9_RELIABLE_CHANGE: 6, // Change of 6+ is reliable
  GAD7_RELIABLE_CHANGE: 4, // Change of 4+ is reliable
} as const;

// Helper functions
export function getPHQ9Severity(score: number): string {
  if (score <= 4) return PHQ9_SEVERITY.minimal.label;
  if (score <= 9) return PHQ9_SEVERITY.mild.label;
  if (score <= 14) return PHQ9_SEVERITY.moderate.label;
  if (score <= 19) return PHQ9_SEVERITY.moderatelySevere.label;
  return PHQ9_SEVERITY.severe.label;
}

export function getGAD7Severity(score: number): string {
  if (score <= 4) return GAD7_SEVERITY.minimal.label;
  if (score <= 9) return GAD7_SEVERITY.mild.label;
  if (score <= 14) return GAD7_SEVERITY.moderate.label;
  return GAD7_SEVERITY.severe.label;
}

export function getWSASSeverity(score: number): string {
  if (score <= 9) return WSAS_SEVERITY.subclinical.label;
  if (score <= 19) return WSAS_SEVERITY.mild.label;
  if (score <= 29) return WSAS_SEVERITY.moderate.label;
  return WSAS_SEVERITY.severe.label;
}

export function calculateReliableChange(
  initialScore: number,
  currentScore: number,
  measureType: 'PHQ9' | 'GAD7'
): { changed: boolean; improved: boolean; deteriorated: boolean } {
  const threshold = measureType === 'PHQ9' 
    ? IAPT_THRESHOLDS.PHQ9_RELIABLE_CHANGE 
    : IAPT_THRESHOLDS.GAD7_RELIABLE_CHANGE;
  
  const difference = initialScore - currentScore;
  
  return {
    changed: Math.abs(difference) >= threshold,
    improved: difference >= threshold,
    deteriorated: difference <= -threshold,
  };
}

export function calculateRecovery(
  initialPHQ9: number,
  currentPHQ9: number,
  initialGAD7: number,
  currentGAD7: number
): { recovered: boolean; reliablyImproved: boolean; reliablyDeteriorated: boolean } {
  const phq9Change = calculateReliableChange(initialPHQ9, currentPHQ9, 'PHQ9');
  const gad7Change = calculateReliableChange(initialGAD7, currentGAD7, 'GAD7');
  
  // Was above caseness at start
  const wasCase = initialPHQ9 >= IAPT_THRESHOLDS.PHQ9_CASENESS || 
                  initialGAD7 >= IAPT_THRESHOLDS.GAD7_CASENESS;
  
  // Is below caseness now
  const isBelowCaseness = currentPHQ9 < IAPT_THRESHOLDS.PHQ9_CASENESS && 
                          currentGAD7 < IAPT_THRESHOLDS.GAD7_CASENESS;
  
  // Reliable improvement on at least one measure
  const reliablyImproved = phq9Change.improved || gad7Change.improved;
  
  // Reliable deterioration on at least one measure
  const reliablyDeteriorated = phq9Change.deteriorated || gad7Change.deteriorated;
  
  // Recovery = was a case, now below caseness, AND reliably improved
  const recovered = wasCase && isBelowCaseness && reliablyImproved;
  
  return { recovered, reliablyImproved, reliablyDeteriorated };
}

// IAPT Problem Descriptors (SNOMED-CT aligned)
export const PROBLEM_DESCRIPTORS = [
  { code: 'F32', label: 'Depressive episode' },
  { code: 'F33', label: 'Recurrent depressive disorder' },
  { code: 'F40', label: 'Phobic anxiety disorders' },
  { code: 'F41.0', label: 'Panic disorder' },
  { code: 'F41.1', label: 'Generalised anxiety disorder' },
  { code: 'F41.2', label: 'Mixed anxiety and depressive disorder' },
  { code: 'F42', label: 'Obsessive-compulsive disorder' },
  { code: 'F43.1', label: 'Post-traumatic stress disorder' },
  { code: 'F43.2', label: 'Adjustment disorders' },
  { code: 'F45', label: 'Somatoform disorders' },
  { code: 'F50', label: 'Eating disorders' },
  { code: 'OTHER', label: 'Other presenting problem' },
] as const;

// Employment status codes
export const EMPLOYMENT_STATUS = [
  { code: '01', label: 'Employed' },
  { code: '02', label: 'Unemployed and seeking work' },
  { code: '03', label: 'Students' },
  { code: '04', label: 'Long-term sick or disabled' },
  { code: '05', label: 'Homemaker' },
  { code: '06', label: 'Not receiving benefits, not working, not seeking work' },
  { code: '07', label: 'Unpaid voluntary work' },
  { code: '08', label: 'Retired' },
  { code: '98', label: 'Not stated' },
] as const;

// Referral sources
export const REFERRAL_SOURCES = [
  { code: 'GP', label: 'GP referral' },
  { code: 'SELF', label: 'Self-referral' },
  { code: 'SECONDARY', label: 'Secondary care' },
  { code: 'EMPLOYER', label: 'Employer' },
  { code: 'EDUCATION', label: 'Education' },
  { code: 'SOCIAL', label: 'Social services' },
  { code: 'OTHER', label: 'Other' },
] as const;

// Discharge reasons
export const DISCHARGE_REASONS = [
  { code: 'COMPLETED', label: 'Treatment completed' },
  { code: 'DROPPED_OUT', label: 'Dropped out' },
  { code: 'DECLINED', label: 'Declined treatment' },
  { code: 'REFERRED_ON', label: 'Referred to another service' },
  { code: 'NOT_SUITABLE', label: 'Not suitable for service' },
  { code: 'MOVED', label: 'Moved out of area' },
  { code: 'OTHER', label: 'Other' },
] as const;

export type OutcomeMeasureType = 'PHQ9' | 'GAD7' | 'WSAS';

export interface OutcomeMeasure {
  id: string;
  userId: string;
  episodeId?: string;
  type: OutcomeMeasureType;
  scores: number[];
  total: number;
  severity: string;
  timestamp: string;
  sessionNumber?: number;
  isInitial: boolean;
}
