/**
 * Crisis detection module — identifies self-harm, suicidal ideation,
 * and other emergency content in user messages.
 *
 * For a "deep psychological questioning" app, this is essential.
 * Returns crisis info if detected, null otherwise.
 */

export interface CrisisDetection {
  isCrisis: boolean;
  severity: 'low' | 'medium' | 'high';
  category: string;
  safeResponse: string;
  resources: string[];
}

// Keywords and phrases grouped by severity
const HIGH_SEVERITY_PATTERNS = [
  /\b(kill\s*(my)?self|suicide|suicidal|end\s*(my|it\s*all)|want\s*to\s*die|don'?t\s*want\s*to\s*(live|be\s*alive|exist))\b/i,
  /\b(slit\s*(my)?\s*wrists?|hang\s*myself|overdose|jump\s*off|pull\s*the\s*trigger)\b/i,
  /\b(planning\s*(to|my)\s*(die|death|end)|goodbye\s*(letter|note|world|everyone)|final\s*(note|goodbye|letter))\b/i,
  /\b(no\s*(reason|point)\s*(to|in)\s*(live|living|go\s*on|continue)|better\s*off\s*(dead|without\s*me))\b/i,
];

const MEDIUM_SEVERITY_PATTERNS = [
  /\b(self[- ]?harm|cutting\s*(myself)?|hurt\s*(my)?self|burning\s*(my)?self)\b/i,
  /\b(starving\s*(my)?self|purging|binging\s*and\s*purging)\b/i,
  /\b(abuse|being\s*(abused|beaten|assaulted)|domestic\s*violence)\b/i,
  /\b(eating\s*disorder|anorex|bulimi)\b/i,
  /\b(can'?t\s*(take|handle|bear)\s*(it|this|anymore)\s*(any\s*more|anymore)?)\b/i,
  /\b(everything\s*is\s*hopeless|no\s*hope|completely\s*alone|nobody\s*cares)\b/i,
];

const CRISIS_RESOURCES = [
  '🆘 Suicide & Crisis Lifeline: Call or text 988 (US)',
  '🆘 Crisis Text Line: Text HOME to 741741 (US)',
  '🆘 Samaritans: Call 116 123 (UK) — free, 24/7',
  '🆘 International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/',
];

const SELF_HARM_RESOURCES = [
  '💛 Crisis Text Line: Text HELLO to 741741 (US)',
  '💛 Samaritans: Call 116 123 (UK) — free, 24/7',
  '💛 SAMHSA Helpline: 1-800-662-4357 (US)',
  '💛 Mind: https://www.mind.org.uk/information-support/helplines/',
];

/**
 * Scan a message for crisis-level content.
 * Returns null if no crisis detected.
 */
export function detectCrisis(message: string): CrisisDetection | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  // Check high severity first
  for (const pattern of HIGH_SEVERITY_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isCrisis: true,
        severity: 'high',
        category: 'suicidal ideation',
        safeResponse:
          "I need to pause our conversation. What you're describing sounds really serious, and I want you to know that support is available right now. You don't have to face this alone. Please reach out to one of these resources — they are free, confidential, and available 24/7.",
        resources: CRISIS_RESOURCES,
      };
    }
  }

  // Check medium severity
  for (const pattern of MEDIUM_SEVERITY_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isCrisis: true,
        severity: 'medium',
        category: 'self-harm or distress',
        safeResponse:
          "I hear you, and what you're going through matters. This conversation is designed to help you think more clearly — but for what you're describing, speaking with a trained professional would be more helpful right now. Here are some resources that can help.",
        resources: SELF_HARM_RESOURCES,
      };
    }
  }

  return null;
}

/**
 * Sanitize user message to prevent prompt injection.
 * Strips or escapes patterns that could manipulate the AI's behavior.
 */
export function sanitizeMessage(message: string): string {
  let sanitized = message;

  // Remove attempts to impersonate the assistant role
  sanitized = sanitized.replace(/^(sorca|system|assistant)\s*:/gim, '[user said]:');

  // Remove markdown-style system instructions
  sanitized = sanitized.replace(/```(system|instruction|prompt)[\s\S]*?```/gi, '[filtered]');

  // Remove XML-style injection attempts
  sanitized = sanitized.replace(/<\s*\/?(system|instruction|prompt|role|context)[^>]*>/gi, '[filtered]');

  // Remove "ignore previous instructions" patterns
  sanitized = sanitized.replace(
    /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|prompts?|context)/gi,
    '[filtered]'
  );

  // Remove "you are now" re-prompting attempts
  sanitized = sanitized.replace(
    /you\s+are\s+now\s+(a|an|the)\b/gi,
    '[filtered]'
  );

  return sanitized.trim();
}
