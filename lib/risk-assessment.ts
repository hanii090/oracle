/**
 * Risk Assessment Framework
 * NHS-compliant risk levels and safety planning
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'crisis';

export interface RiskIndicator {
  category: string;
  indicator: string;
  level: RiskLevel;
  action: string;
}

export const RISK_INDICATORS: RiskIndicator[] = [
  // Self-harm indicators
  { category: 'self_harm', indicator: 'Thoughts of self-harm without plan', level: 'medium', action: 'Explore safety, review coping strategies' },
  { category: 'self_harm', indicator: 'Self-harm with plan but no intent', level: 'high', action: 'Safety plan required, consider step-up' },
  { category: 'self_harm', indicator: 'Active self-harm or intent', level: 'crisis', action: 'Immediate safety assessment, crisis referral' },
  
  // Suicidal ideation
  { category: 'suicide', indicator: 'Passive suicidal ideation (life not worth living)', level: 'medium', action: 'Monitor closely, safety planning' },
  { category: 'suicide', indicator: 'Active suicidal ideation without plan', level: 'high', action: 'Urgent safety plan, daily contact' },
  { category: 'suicide', indicator: 'Suicidal ideation with plan', level: 'crisis', action: 'Immediate crisis intervention' },
  { category: 'suicide', indicator: 'Suicidal ideation with plan and means', level: 'crisis', action: 'Emergency services, do not leave alone' },
  
  // Substance use
  { category: 'substance', indicator: 'Increased alcohol/drug use', level: 'low', action: 'Psychoeducation, monitor' },
  { category: 'substance', indicator: 'Substance use affecting functioning', level: 'medium', action: 'Consider dual diagnosis pathway' },
  { category: 'substance', indicator: 'Dangerous substance use patterns', level: 'high', action: 'Specialist substance service referral' },
  
  // Social factors
  { category: 'social', indicator: 'Social isolation increasing', level: 'low', action: 'Behavioural activation, social goals' },
  { category: 'social', indicator: 'Loss of support network', level: 'medium', action: 'Crisis contacts, community resources' },
  { category: 'social', indicator: 'Domestic abuse concerns', level: 'high', action: 'Safeguarding referral, safety planning' },
  
  // Functional decline
  { category: 'function', indicator: 'Difficulty maintaining self-care', level: 'medium', action: 'Practical support, consider step-up' },
  { category: 'function', indicator: 'Unable to work/study', level: 'medium', action: 'Fit note, occupational support' },
  { category: 'function', indicator: 'Severe functional impairment', level: 'high', action: 'Consider secondary care referral' },
];

export interface SafetyPlan {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  warningSignsPersonal: string[];
  warningSignsOthers: string[];
  copingStrategies: string[];
  distractionActivities: string[];
  supportPeople: Array<{ name: string; phone: string; relationship: string }>;
  professionalContacts: Array<{ name: string; phone: string; service: string }>;
  crisisContacts: Array<{ name: string; phone: string; available: string }>;
  safeEnvironment: string[];
  reasonsToLive: string[];
}

// UK Crisis Contacts
export const UK_CRISIS_CONTACTS = [
  { name: 'Samaritans', phone: '116 123', available: '24/7', description: 'Emotional support for anyone in distress' },
  { name: 'NHS 111', phone: '111', available: '24/7', description: 'NHS non-emergency medical advice' },
  { name: 'Crisis Text Line', phone: 'Text SHOUT to 85258', available: '24/7', description: 'Free text support' },
  { name: 'Papyrus HOPELINEUK', phone: '0800 068 4141', available: '9am-midnight', description: 'For under 35s' },
  { name: 'CALM', phone: '0800 58 58 58', available: '5pm-midnight', description: 'For men' },
  { name: 'Childline', phone: '0800 1111', available: '24/7', description: 'For under 19s' },
  { name: 'Emergency Services', phone: '999', available: '24/7', description: 'Life-threatening emergencies' },
] as const;

/**
 * Assess risk level from PHQ-9 Question 9 (suicidal ideation)
 */
export function assessPHQ9Question9Risk(score: number): { level: RiskLevel; action: string } {
  switch (score) {
    case 0:
      return { level: 'low', action: 'No current suicidal ideation' };
    case 1:
      return { level: 'medium', action: 'Several days - explore further, safety planning recommended' };
    case 2:
      return { level: 'high', action: 'More than half the days - urgent safety assessment required' };
    case 3:
      return { level: 'crisis', action: 'Nearly every day - immediate crisis intervention, consider emergency referral' };
    default:
      return { level: 'low', action: 'Unable to assess' };
  }
}

/**
 * Determine overall risk level from multiple indicators
 */
export function calculateOverallRisk(indicators: RiskLevel[]): RiskLevel {
  if (indicators.includes('crisis')) return 'crisis';
  if (indicators.includes('high')) return 'high';
  if (indicators.includes('medium')) return 'medium';
  return 'low';
}

/**
 * Get recommended actions based on risk level
 */
export function getRiskActions(level: RiskLevel): string[] {
  switch (level) {
    case 'crisis':
      return [
        'Do not end session without safety plan in place',
        'Contact emergency services if immediate danger',
        'Notify supervisor/on-call clinician',
        'Arrange same-day or next-day follow-up',
        'Provide crisis contact numbers',
        'Consider voluntary or involuntary admission if needed',
      ];
    case 'high':
      return [
        'Complete or update safety plan',
        'Increase session frequency',
        'Consider step-up to higher intensity',
        'Discuss with supervisor',
        'Ensure crisis contacts are accessible',
        'Schedule follow-up within 48 hours',
      ];
    case 'medium':
      return [
        'Review and update safety plan',
        'Monitor at each session',
        'Ensure coping strategies are in place',
        'Provide crisis contact information',
        'Consider increasing session frequency',
      ];
    case 'low':
      return [
        'Continue current treatment plan',
        'Routine monitoring',
        'Maintain awareness of warning signs',
      ];
  }
}

/**
 * Generate safety plan template
 */
export function createEmptySafetyPlan(userId: string): SafetyPlan {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    userId,
    createdAt: now,
    updatedAt: now,
    warningSignsPersonal: [],
    warningSignsOthers: [],
    copingStrategies: [],
    distractionActivities: [],
    supportPeople: [],
    professionalContacts: [],
    crisisContacts: UK_CRISIS_CONTACTS.map(c => ({
      name: c.name,
      phone: c.phone,
      available: c.available,
    })),
    safeEnvironment: [],
    reasonsToLive: [],
  };
}

/**
 * Keywords that may indicate risk in session content
 * Used for automated flagging - always requires human review
 */
export const RISK_KEYWORDS = {
  high: [
    'kill myself', 'end my life', 'suicide', 'suicidal',
    'want to die', 'better off dead', 'no point living',
    'hurt myself', 'self-harm', 'cutting', 'overdose',
    'plan to', 'method', 'means to',
  ],
  medium: [
    'hopeless', 'worthless', 'burden', 'trapped',
    'no way out', 'can\'t go on', 'give up',
    'not worth it', 'disappear', 'escape',
  ],
  safeguarding: [
    'abuse', 'hitting', 'violence', 'assault',
    'neglect', 'exploitation', 'trafficking',
    'forced', 'coerced', 'threatened',
  ],
};

/**
 * Scan text for risk indicators
 * Returns detected risk level and matched keywords
 */
export function scanForRiskIndicators(text: string): {
  level: RiskLevel;
  matchedKeywords: string[];
  requiresReview: boolean;
} {
  const lowerText = text.toLowerCase();
  const matchedKeywords: string[] = [];
  let highestLevel: RiskLevel = 'low';

  // Check high-risk keywords
  for (const keyword of RISK_KEYWORDS.high) {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      highestLevel = 'high';
    }
  }

  // Check medium-risk keywords
  for (const keyword of RISK_KEYWORDS.medium) {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      if (highestLevel === 'low') highestLevel = 'medium';
    }
  }

  // Check safeguarding keywords
  for (const keyword of RISK_KEYWORDS.safeguarding) {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      if (highestLevel === 'low') highestLevel = 'medium';
    }
  }

  return {
    level: highestLevel,
    matchedKeywords,
    requiresReview: matchedKeywords.length > 0,
  };
}

/**
 * Format risk assessment for clinical notes
 */
export function formatRiskAssessment(
  level: RiskLevel,
  indicators: string[],
  actions: string[]
): string {
  return `
RISK ASSESSMENT
===============
Level: ${level.toUpperCase()}

Indicators:
${indicators.map(i => `- ${i}`).join('\n')}

Actions Taken/Planned:
${actions.map(a => `- ${a}`).join('\n')}

Assessment Date: ${new Date().toISOString().split('T')[0]}
  `.trim();
}
