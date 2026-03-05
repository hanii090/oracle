/**
 * NHS Stepped Care Model
 * Supports Step 1-3 treatment pathways for IAPT services
 */

import { IAPT_THRESHOLDS } from './iapt-dataset';

export type StepLevel = 1 | 2 | 3;

export interface StepDefinition {
  level: StepLevel;
  name: string;
  description: string;
  interventions: string[];
  typicalSessions: string;
  suitableFor: string;
}

export const STEPPED_CARE_MODEL: Record<StepLevel, StepDefinition> = {
  1: {
    level: 1,
    name: 'Guided Self-Help',
    description: 'Low-intensity interventions with minimal therapist contact',
    interventions: [
      'Computerised CBT (cCBT)',
      'Guided self-help books',
      'Psychoeducation groups',
      'Behavioural activation',
      'Sleep hygiene',
    ],
    typicalSessions: '4-6 sessions',
    suitableFor: 'Mild to moderate depression/anxiety, PHQ-9 < 15, GAD-7 < 12',
  },
  2: {
    level: 2,
    name: 'Low-Intensity Therapy',
    description: 'Brief psychological interventions delivered by PWPs',
    interventions: [
      'Guided self-help with regular support',
      'Behavioural activation',
      'Problem-solving therapy',
      'Exposure therapy for phobias',
      'Group-based CBT',
    ],
    typicalSessions: '6-8 sessions',
    suitableFor: 'Moderate symptoms, PHQ-9 10-19, GAD-7 8-14',
  },
  3: {
    level: 3,
    name: 'High-Intensity Therapy',
    description: 'Full CBT or other evidence-based therapy with qualified therapist',
    interventions: [
      'Individual CBT',
      'EMDR for trauma',
      'Interpersonal therapy (IPT)',
      'Couples therapy',
      'Counselling for depression',
    ],
    typicalSessions: '12-20 sessions',
    suitableFor: 'Moderate to severe symptoms, PHQ-9 >= 15, GAD-7 >= 12, or complex presentations',
  },
};

export interface TreatmentEpisode {
  id: string;
  patientId: string;
  therapistId: string;
  step: StepLevel;
  status: 'active' | 'completed' | 'stepped_up' | 'stepped_down' | 'discharged' | 'dropped_out';
  startDate: string;
  endDate?: string;
  referralSource: string;
  presentingProblem: string;
  initialPHQ9?: number;
  initialGAD7?: number;
  finalPHQ9?: number;
  finalGAD7?: number;
  sessionCount: number;
  dischargeReason?: string;
  dischargeSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StepRecommendation {
  recommendedStep: StepLevel;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  considerations: string[];
}

/**
 * Recommend initial step based on PHQ-9 and GAD-7 scores
 */
export function recommendInitialStep(
  phq9Score: number,
  gad7Score: number,
  hasComplexNeeds: boolean = false
): StepRecommendation {
  // Complex needs always go to Step 3
  if (hasComplexNeeds) {
    return {
      recommendedStep: 3,
      reason: 'Complex presentation requires high-intensity intervention',
      confidence: 'high',
      considerations: [
        'Consider trauma history',
        'Assess for personality difficulties',
        'Review medication needs',
      ],
    };
  }

  // Severe symptoms -> Step 3
  if (phq9Score >= 20 || gad7Score >= 15) {
    return {
      recommendedStep: 3,
      reason: 'Severe symptom levels indicate need for high-intensity therapy',
      confidence: 'high',
      considerations: [
        'Assess suicide risk (PHQ-9 Q9)',
        'Consider medication review',
        'Monitor closely in early sessions',
      ],
    };
  }

  // Moderate-severe -> Step 2 or 3
  if (phq9Score >= 15 || gad7Score >= 12) {
    return {
      recommendedStep: 3,
      reason: 'Moderately severe symptoms suggest high-intensity therapy',
      confidence: 'medium',
      considerations: [
        'Could trial Step 2 if patient prefers',
        'Step up if no improvement after 4 sessions',
        'Consider patient preference and previous treatment',
      ],
    };
  }

  // Moderate -> Step 2
  if (phq9Score >= IAPT_THRESHOLDS.PHQ9_CASENESS || gad7Score >= IAPT_THRESHOLDS.GAD7_CASENESS) {
    return {
      recommendedStep: 2,
      reason: 'Moderate symptoms suitable for low-intensity intervention',
      confidence: 'high',
      considerations: [
        'Review after 4 sessions',
        'Step up if no reliable change',
        'Good candidate for guided self-help',
      ],
    };
  }

  // Mild/subclinical -> Step 1
  return {
    recommendedStep: 1,
    reason: 'Mild symptoms appropriate for guided self-help',
    confidence: 'high',
    considerations: [
      'Psychoeducation may be sufficient',
      'Consider watchful waiting',
      'Self-referral to online resources',
    ],
  };
}

/**
 * Recommend step change based on progress
 */
export function recommendStepChange(
  currentStep: StepLevel,
  initialPHQ9: number,
  currentPHQ9: number,
  initialGAD7: number,
  currentGAD7: number,
  sessionsCompleted: number
): { action: 'stay' | 'step_up' | 'step_down' | 'discharge'; reason: string } {
  const phq9Change = initialPHQ9 - currentPHQ9;
  const gad7Change = initialGAD7 - currentGAD7;
  
  // Check for reliable improvement
  const phq9Improved = phq9Change >= IAPT_THRESHOLDS.PHQ9_RELIABLE_CHANGE;
  const gad7Improved = gad7Change >= IAPT_THRESHOLDS.GAD7_RELIABLE_CHANGE;
  
  // Check for reliable deterioration
  const phq9Deteriorated = phq9Change <= -IAPT_THRESHOLDS.PHQ9_RELIABLE_CHANGE;
  const gad7Deteriorated = gad7Change <= -IAPT_THRESHOLDS.GAD7_RELIABLE_CHANGE;
  
  // Below caseness on both measures
  const belowCaseness = currentPHQ9 < IAPT_THRESHOLDS.PHQ9_CASENESS && 
                        currentGAD7 < IAPT_THRESHOLDS.GAD7_CASENESS;

  // Recovery achieved
  if (belowCaseness && (phq9Improved || gad7Improved)) {
    return {
      action: 'discharge',
      reason: 'Recovery achieved - below clinical threshold with reliable improvement',
    };
  }

  // Good progress at Step 2/3, consider step down
  if (currentStep > 1 && (phq9Improved || gad7Improved) && !belowCaseness) {
    if (currentPHQ9 < 15 && currentGAD7 < 12) {
      return {
        action: 'step_down',
        reason: 'Good progress - consider stepping down to consolidate gains',
      };
    }
  }

  // No progress after adequate trial
  if (sessionsCompleted >= 6 && !phq9Improved && !gad7Improved) {
    if (currentStep < 3) {
      return {
        action: 'step_up',
        reason: 'Insufficient progress after adequate trial - step up recommended',
      };
    }
    return {
      action: 'stay',
      reason: 'Review treatment approach - consider alternative modality',
    };
  }

  // Deterioration
  if (phq9Deteriorated || gad7Deteriorated) {
    if (currentStep < 3) {
      return {
        action: 'step_up',
        reason: 'Reliable deterioration detected - urgent step up recommended',
      };
    }
    return {
      action: 'stay',
      reason: 'Deterioration at Step 3 - review risk and treatment plan',
    };
  }

  return {
    action: 'stay',
    reason: 'Continue current treatment - review at next session',
  };
}

/**
 * Calculate waiting time in weeks
 */
export function calculateWaitingTime(referralDate: string): number {
  const referral = new Date(referralDate);
  const now = new Date();
  const diffMs = now.getTime() - referral.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Check if waiting time exceeds NHS 18-week target
 */
export function isBreachingWaitTarget(referralDate: string, targetWeeks: number = 18): boolean {
  return calculateWaitingTime(referralDate) >= targetWeeks;
}

/**
 * Generate discharge summary
 */
export function generateDischargeSummary(episode: TreatmentEpisode): string {
  const lines: string[] = [];
  
  lines.push(`TREATMENT EPISODE SUMMARY`);
  lines.push(`========================`);
  lines.push(``);
  lines.push(`Step: ${STEPPED_CARE_MODEL[episode.step].name}`);
  lines.push(`Sessions: ${episode.sessionCount}`);
  lines.push(`Duration: ${episode.startDate} to ${episode.endDate || 'ongoing'}`);
  lines.push(``);
  
  if (episode.initialPHQ9 !== undefined && episode.finalPHQ9 !== undefined) {
    const phq9Change = episode.initialPHQ9 - episode.finalPHQ9;
    lines.push(`PHQ-9: ${episode.initialPHQ9} → ${episode.finalPHQ9} (change: ${phq9Change >= 0 ? '+' : ''}${-phq9Change})`);
  }
  
  if (episode.initialGAD7 !== undefined && episode.finalGAD7 !== undefined) {
    const gad7Change = episode.initialGAD7 - episode.finalGAD7;
    lines.push(`GAD-7: ${episode.initialGAD7} → ${episode.finalGAD7} (change: ${gad7Change >= 0 ? '+' : ''}${-gad7Change})`);
  }
  
  lines.push(``);
  lines.push(`Presenting Problem: ${episode.presentingProblem}`);
  lines.push(`Discharge Reason: ${episode.dischargeReason || 'Not specified'}`);
  
  return lines.join('\n');
}
