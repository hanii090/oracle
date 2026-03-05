/**
 * GP Integration Utilities
 * Generate NHS-standard letters and validate NHS numbers
 */

export interface GPDetails {
  practiceName: string;
  gpName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  phone?: string;
  email?: string;
}

export interface PatientDetails {
  fullName: string;
  dateOfBirth: string;
  nhsNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  phone?: string;
}

export interface TherapistDetails {
  name: string;
  qualifications: string;
  serviceName: string;
  addressLine1: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
}

/**
 * Validate NHS Number format using Modulus 11 check
 * NHS numbers are 10 digits with a check digit
 */
export function validateNHSNumber(nhsNumber: string): { valid: boolean; error?: string } {
  // Remove spaces and dashes
  const cleaned = nhsNumber.replace(/[\s-]/g, '');
  
  // Must be exactly 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return { valid: false, error: 'NHS number must be exactly 10 digits' };
  }
  
  // Modulus 11 check
  const digits = cleaned.split('').map(Number);
  const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = 11 - remainder;
  
  // Check digit of 11 becomes 0, 10 is invalid
  if (checkDigit === 10) {
    return { valid: false, error: 'Invalid NHS number (check digit 10)' };
  }
  
  const expectedCheckDigit = checkDigit === 11 ? 0 : checkDigit;
  
  if (digits[9] !== expectedCheckDigit) {
    return { valid: false, error: 'Invalid NHS number (check digit mismatch)' };
  }
  
  return { valid: true };
}

/**
 * Format NHS number with spaces (XXX XXX XXXX)
 */
export function formatNHSNumber(nhsNumber: string): string {
  const cleaned = nhsNumber.replace(/[\s-]/g, '');
  if (cleaned.length !== 10) return nhsNumber;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}

/**
 * Generate referral acknowledgment letter
 */
export function generateReferralAcknowledgmentLetter(
  patient: PatientDetails,
  gp: GPDetails,
  therapist: TherapistDetails,
  referralDate: string,
  appointmentDate?: string
): string {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
${therapist.serviceName}
${therapist.addressLine1}
${therapist.city}
${therapist.postcode}
Tel: ${therapist.phone}
Email: ${therapist.email}

${today}

${gp.gpName ? `Dr ${gp.gpName}` : 'The GP'}
${gp.practiceName}
${gp.addressLine1}
${gp.addressLine2 ? gp.addressLine2 + '\n' : ''}${gp.city}
${gp.postcode}

Dear ${gp.gpName ? `Dr ${gp.gpName}` : 'Doctor'},

Re: ${patient.fullName}
DOB: ${new Date(patient.dateOfBirth).toLocaleDateString('en-GB')}
${patient.nhsNumber ? `NHS Number: ${formatNHSNumber(patient.nhsNumber)}` : ''}
Address: ${patient.addressLine1}, ${patient.city}, ${patient.postcode}

Thank you for referring the above patient to our service. We received your referral on ${new Date(referralDate).toLocaleDateString('en-GB')}.

${appointmentDate 
  ? `We have offered the patient an initial assessment appointment on ${new Date(appointmentDate).toLocaleDateString('en-GB')}.`
  : `The patient has been added to our waiting list and will be contacted shortly to arrange an initial assessment.`
}

We will write to you again following the initial assessment with our findings and treatment recommendations.

If you have any queries regarding this referral, please do not hesitate to contact us.

Yours sincerely,


${therapist.name}
${therapist.qualifications}
${therapist.serviceName}
`.trim();
}

/**
 * Generate discharge summary letter
 */
export function generateDischargeSummaryLetter(
  patient: PatientDetails,
  gp: GPDetails,
  therapist: TherapistDetails,
  episode: {
    startDate: string;
    endDate: string;
    presentingProblem: string;
    treatmentProvided: string;
    sessionCount: number;
    initialPHQ9?: number;
    finalPHQ9?: number;
    initialGAD7?: number;
    finalGAD7?: number;
    outcome: string;
    recommendations: string[];
  }
): string {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const phq9Change = episode.initialPHQ9 !== undefined && episode.finalPHQ9 !== undefined
    ? episode.initialPHQ9 - episode.finalPHQ9
    : null;
  
  const gad7Change = episode.initialGAD7 !== undefined && episode.finalGAD7 !== undefined
    ? episode.initialGAD7 - episode.finalGAD7
    : null;

  return `
${therapist.serviceName}
${therapist.addressLine1}
${therapist.city}
${therapist.postcode}
Tel: ${therapist.phone}
Email: ${therapist.email}

${today}

${gp.gpName ? `Dr ${gp.gpName}` : 'The GP'}
${gp.practiceName}
${gp.addressLine1}
${gp.addressLine2 ? gp.addressLine2 + '\n' : ''}${gp.city}
${gp.postcode}

Dear ${gp.gpName ? `Dr ${gp.gpName}` : 'Doctor'},

Re: ${patient.fullName}
DOB: ${new Date(patient.dateOfBirth).toLocaleDateString('en-GB')}
${patient.nhsNumber ? `NHS Number: ${formatNHSNumber(patient.nhsNumber)}` : ''}

DISCHARGE SUMMARY

I am writing to inform you that the above patient has been discharged from our service.

TREATMENT EPISODE
-----------------
Treatment Period: ${new Date(episode.startDate).toLocaleDateString('en-GB')} to ${new Date(episode.endDate).toLocaleDateString('en-GB')}
Number of Sessions: ${episode.sessionCount}

PRESENTING PROBLEM
------------------
${episode.presentingProblem}

TREATMENT PROVIDED
------------------
${episode.treatmentProvided}

OUTCOME MEASURES
----------------
${episode.initialPHQ9 !== undefined ? `PHQ-9: ${episode.initialPHQ9} → ${episode.finalPHQ9} (change: ${phq9Change !== null && phq9Change >= 0 ? '+' : ''}${phq9Change !== null ? -phq9Change : 'N/A'})` : 'PHQ-9: Not recorded'}
${episode.initialGAD7 !== undefined ? `GAD-7: ${episode.initialGAD7} → ${episode.finalGAD7} (change: ${gad7Change !== null && gad7Change >= 0 ? '+' : ''}${gad7Change !== null ? -gad7Change : 'N/A'})` : 'GAD-7: Not recorded'}

OUTCOME
-------
${episode.outcome}

RECOMMENDATIONS
---------------
${episode.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

If you have any queries regarding this patient's treatment, please do not hesitate to contact us.

Yours sincerely,


${therapist.name}
${therapist.qualifications}
${therapist.serviceName}
`.trim();
}

/**
 * Generate progress update letter
 */
export function generateProgressLetter(
  patient: PatientDetails,
  gp: GPDetails,
  therapist: TherapistDetails,
  progress: {
    sessionCount: number;
    currentPHQ9?: number;
    currentGAD7?: number;
    summary: string;
    concerns?: string;
    plan: string;
  }
): string {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
${therapist.serviceName}
${therapist.addressLine1}
${therapist.city}
${therapist.postcode}
Tel: ${therapist.phone}
Email: ${therapist.email}

${today}

${gp.gpName ? `Dr ${gp.gpName}` : 'The GP'}
${gp.practiceName}
${gp.addressLine1}
${gp.addressLine2 ? gp.addressLine2 + '\n' : ''}${gp.city}
${gp.postcode}

Dear ${gp.gpName ? `Dr ${gp.gpName}` : 'Doctor'},

Re: ${patient.fullName}
DOB: ${new Date(patient.dateOfBirth).toLocaleDateString('en-GB')}
${patient.nhsNumber ? `NHS Number: ${formatNHSNumber(patient.nhsNumber)}` : ''}

PROGRESS UPDATE

I am writing to update you on the above patient's progress in psychological therapy.

Sessions Completed: ${progress.sessionCount}
${progress.currentPHQ9 !== undefined ? `Current PHQ-9: ${progress.currentPHQ9}` : ''}
${progress.currentGAD7 !== undefined ? `Current GAD-7: ${progress.currentGAD7}` : ''}

PROGRESS SUMMARY
----------------
${progress.summary}

${progress.concerns ? `CONCERNS
--------
${progress.concerns}

` : ''}TREATMENT PLAN
--------------
${progress.plan}

If you have any queries, please do not hesitate to contact us.

Yours sincerely,


${therapist.name}
${therapist.qualifications}
${therapist.serviceName}
`.trim();
}
