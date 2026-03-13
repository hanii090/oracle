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
  '━━━ United States ━━━',
  '🆘 Suicide & Crisis Lifeline: Call or text 988 — free, 24/7',
  '🆘 Crisis Text Line: Text HOME to 741741',
  '',
  '━━━ United Kingdom ━━━',
  '🆘 Samaritans: Call 116 123 — free, 24/7, confidential',
  '🆘 Shout: Text SHOUT to 85258 — free, 24/7',
  '🆘 Mind Infoline: 0300 123 3393 (Mon-Fri 9am-6pm)',
  '🆘 Papyrus (under 35): Call 0800 068 4141 or text 07860 039967',
  '',
  '━━━ Ireland ━━━',
  '🆘 Samaritans Ireland: Call 116 123 — free, 24/7',
  '🆘 Pieta House: Call 1800 247 247 — free, 24/7',
  '',
  '━━━ International ━━━',
  '🆘 Find your local crisis centre: https://www.iasp.info/resources/Crisis_Centres/',
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
 *
 * When eolMode is true (End of Life mode), only HIGH severity patterns
 * are checked — grief, death, and loss discussions are expected and normal
 * in that context. Medium severity patterns are skipped.
 */
export function detectCrisis(message: string, eolMode?: boolean): CrisisDetection | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  // Check high severity first — always checked, even in EOL mode
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

  // In EOL mode, skip medium severity — grief, death discussions are expected
  if (eolMode) return null;

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

/**
 * Sanitize an IP address to prevent log injection and spoofing.
 */
export function sanitizeIp(ip: string): string {
  if (!ip) return 'unknown';
  // Allow only valid IPv4/IPv6 characters
  const sanitized = ip.replace(/[^a-fA-F0-9.:]/g, '');
  return sanitized || 'unknown';
}

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

// ═══════════════════════════════════════════════════════════════════════════
// SAFE MESSAGING MODE — Therapy Edition Feature
// ═══════════════════════════════════════════════════════════════════════════

export interface SafeMessagingState {
  isActive: boolean;
  activatedAt: string | null;
  reason: 'therapist_flagged' | 'distress_detected' | 'user_requested' | null;
  distressLevel: number; // 0-1 scale
  consecutiveDistressMessages: number;
}

const DISTRESS_ESCALATION_PATTERNS = [
  /\b(can'?t\s+(cope|handle|take|do\s+this|go\s+on)|falling\s+apart|losing\s+(it|my\s+mind)|breaking\s+down)\b/i,
  /\b(overwhelmed|desperate|hopeless|helpless|worthless|useless)\b/i,
  /\b(no\s+(one|body)\s+(cares|understands|listens)|completely\s+alone|all\s+alone)\b/i,
  /\b(everything\s+is\s+(wrong|falling\s+apart|too\s+much)|nothing\s+(works|helps|matters))\b/i,
  /\b(can'?t\s+(sleep|eat|think|function|breathe)|panic|anxiety\s+attack|spiraling)\b/i,
  /\b(scared|terrified|afraid)\s+(of\s+(myself|everything|the\s+future))/i,
  /\b(don'?t\s+know\s+what\s+to\s+do|don'?t\s+know\s+how\s+to\s+continue)\b/i,
];

const GROUNDING_PROMPTS = [
  "Let's pause here. Can you name three things you can see right now?",
  "Before we go further — take a breath. What's one thing that feels solid right now?",
  "I hear you. Let's slow down. What's something in your immediate environment that feels safe?",
  "This sounds really hard. Can you feel your feet on the ground? Let's start there.",
  "Let's take a moment. What's one small thing you did for yourself today?",
];

const SAFE_MODE_RESOURCES = [
  '💛 Samaritans: Call 116 123 (UK) — free, 24/7, confidential',
  '💛 Crisis Text Line: Text SHOUT to 85258 (UK)',
  '💛 Mind Infoline: 0300 123 3393 (UK)',
  '💛 SAMHSA Helpline: 1-800-662-4357 (US)',
];

/**
 * Detect escalating distress in a message for Safe Messaging Mode.
 * Returns a distress score (0-1) based on pattern matches.
 */
export function detectDistressLevel(message: string): number {
  const trimmed = message.trim().toLowerCase();
  if (!trimmed) return 0;

  let matchCount = 0;
  for (const pattern of DISTRESS_ESCALATION_PATTERNS) {
    if (pattern.test(trimmed)) {
      matchCount++;
    }
  }

  // Normalize to 0-1 scale, with diminishing returns
  return Math.min(1, matchCount * 0.25);
}

/**
 * Check if Safe Messaging Mode should be activated based on conversation history.
 * Activates when:
 * - 3+ consecutive messages with distress level > 0.3
 * - Any single message with distress level > 0.7
 * - Therapist has flagged the user
 */
export function shouldActivateSafeMode(
  currentDistress: number,
  consecutiveDistressCount: number,
  therapistFlagged?: boolean
): boolean {
  if (therapistFlagged) return true;
  if (currentDistress > 0.7) return true;
  if (consecutiveDistressCount >= 3 && currentDistress > 0.3) return true;
  return false;
}

/**
 * Get a grounding prompt for Safe Messaging Mode.
 * These redirect toward grounding and coping instead of depth escalation.
 */
export function getGroundingPrompt(): string {
  return GROUNDING_PROMPTS[Math.floor(Math.random() * GROUNDING_PROMPTS.length)];
}

/**
 * Get Safe Mode resources for display.
 */
export function getSafeModeResources(): string[] {
  return SAFE_MODE_RESOURCES;
}

/**
 * Build a Safe Messaging Mode system prompt modifier.
 * This constrains the AI to avoid depth escalation and focus on grounding.
 */
export function buildSafeModeSystemPrompt(): string {
  return `
🛡️ SAFE MESSAGING MODE ACTIVE
The user is showing signs of elevated distress. Modify your approach:

REQUIRED BEHAVIORS:
- Do NOT escalate depth beyond level 3
- Do NOT ask confrontational questions
- Do NOT surface past contradictions or painful memories
- Focus on grounding, presence, and small steps
- Questions should be calming, not probing
- Acknowledge difficulty without deepening it

SUGGESTED APPROACHES:
- Present-moment awareness questions
- Small, manageable action questions
- Connection to support systems
- Recognition of their strength in reaching out

Remember: Sorca is not a crisis counselor. If high-severity content is detected, signpost to professional resources.
`;
}

export interface SafeModeResponse {
  shouldActivate: boolean;
  distressLevel: number;
  groundingPrompt?: string;
  resources: string[];
  systemPromptModifier?: string;
}

/**
 * Pattern Detection for Therapist Alerts
 * Detects patterns that may warrant therapist attention
 */

export interface PatternDetectionResult {
  detected: boolean;
  type: 'distress' | 'pattern' | 'milestone' | 'mood_shift';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

const ESCALATING_DISTRESS_PATTERNS = [
  /\b(getting\s*worse|can'?t\s*cope|falling\s*apart|spiraling|losing\s*(control|it|my\s*mind))\b/i,
  /\b(every(thing|one)\s*(is|feels)\s*(hopeless|pointless|meaningless))\b/i,
  /\b(don'?t\s*know\s*(how\s*(much\s*)?longer|if\s*i\s*can))\b/i,
  /\b(exhausted|drained|empty|numb)\s+(all\s*the\s*time|every\s*day|constantly)/i,
];

const POSITIVE_SHIFT_PATTERNS = [
  /\b(breakthrough|finally\s*(understand|see|realize)|clicked|makes\s*sense\s*now)\b/i,
  /\b(feeling\s*(better|hopeful|stronger|clearer))\b/i,
  /\b(first\s*time\s*(in\s*(a\s*)?long\s*time|I'?ve\s*felt))/i,
  /\b(grateful|thankful|appreciat)/i,
];

const RECURRING_THEME_KEYWORDS = [
  'always', 'never', 'every time', 'keeps happening', 'pattern', 
  'same thing', 'again and again', 'stuck in', 'cycle'
];

/**
 * Detect patterns in user messages that should alert therapists
 */
export function detectPatterns(
  messages: Array<{ role: string; content: string }>,
  currentDistressLevel: number
): PatternDetectionResult | null {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return null;

  const recentMessages = userMessages.slice(-5);
  const lastMessage = userMessages[userMessages.length - 1]?.content || '';

  // Check for escalating distress
  for (const pattern of ESCALATING_DISTRESS_PATTERNS) {
    if (pattern.test(lastMessage)) {
      return {
        detected: true,
        type: 'distress',
        message: `Escalating distress language detected: "${lastMessage.slice(0, 100)}..."`,
        severity: currentDistressLevel > 0.6 ? 'high' : 'medium',
      };
    }
  }

  // Check for positive shifts (milestones)
  for (const pattern of POSITIVE_SHIFT_PATTERNS) {
    if (pattern.test(lastMessage)) {
      return {
        detected: true,
        type: 'milestone',
        message: `Positive shift detected: "${lastMessage.slice(0, 100)}..."`,
        severity: 'low',
      };
    }
  }

  // Check for recurring themes (patterns)
  const allContent = recentMessages.map(m => m.content.toLowerCase()).join(' ');
  const themeCount = RECURRING_THEME_KEYWORDS.filter(kw => 
    allContent.includes(kw.toLowerCase())
  ).length;

  if (themeCount >= 3) {
    return {
      detected: true,
      type: 'pattern',
      message: 'Recurring theme language detected across recent messages',
      severity: 'medium',
    };
  }

  // Check for mood shift (sudden change in tone)
  if (recentMessages.length >= 3) {
    const previousDistress = estimateDistressFromText(
      recentMessages.slice(0, -1).map(m => m.content).join(' ')
    );
    const currentDistress = estimateDistressFromText(lastMessage);
    
    if (Math.abs(currentDistress - previousDistress) > 0.4) {
      return {
        detected: true,
        type: 'mood_shift',
        message: `Significant mood shift detected (${previousDistress > currentDistress ? 'improvement' : 'decline'})`,
        severity: previousDistress > currentDistress ? 'low' : 'medium',
      };
    }
  }

  return null;
}

/**
 * Estimate distress level from text (simple heuristic)
 */
function estimateDistressFromText(text: string): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  
  const negativeWords = ['sad', 'angry', 'anxious', 'afraid', 'scared', 'hopeless', 
    'worthless', 'guilty', 'ashamed', 'lonely', 'empty', 'numb', 'overwhelmed'];
  const positiveWords = ['happy', 'hopeful', 'grateful', 'peaceful', 'calm', 
    'confident', 'strong', 'better', 'good', 'okay'];
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score += 0.1;
  });
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score -= 0.05;
  });
  
  return Math.max(0, Math.min(1, score));
}
