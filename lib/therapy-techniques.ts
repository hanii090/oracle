/**
 * Therapy Techniques Library
 * Evidence-based therapeutic techniques for enhancing Sorca AI responses.
 * Aligned with NICE guidelines and NHS Talking Therapies best practices.
 */

// ── Cognitive Distortions (CBT) ─────────────────────────────────────────────
// Based on Aaron Beck's cognitive distortion taxonomy, commonly used in NHS IAPT services.

export interface CognitiveDistortion {
  name: string;
  pattern: RegExp;
  challenge: string;
}

export const COGNITIVE_DISTORTIONS: CognitiveDistortion[] = [
  {
    name: 'all-or-nothing',
    pattern: /\b(always|never|every\s*time|nothing\s*ever|completely|totally|absolutely)\b/i,
    challenge: 'You used the word "{match}". Is it truly "{match}", or is there a middle ground you\'re not seeing?',
  },
  {
    name: 'catastrophising',
    pattern: /\b(worst|terrible|disaster|ruined|destroyed|end of the world|can't cope|falling apart|everything is)\b/i,
    challenge: 'What is the actual evidence for the worst-case scenario? What would you tell a friend who said this?',
  },
  {
    name: 'mind-reading',
    pattern: /\b(they think|everyone thinks|people think|he thinks|she thinks|they all|they must)\b/i,
    challenge: 'How do you know what they think? What are you actually observing versus interpreting?',
  },
  {
    name: 'fortune-telling',
    pattern: /\b(it will|it's going to|I'll never|I'll always|it won't ever|there's no point)\b/i,
    challenge: 'What evidence do you have for predicting this outcome? Have your predictions been wrong before?',
  },
  {
    name: 'emotional-reasoning',
    pattern: /\b(I feel like|I feel that|it feels like|feels like I'm)\b/i,
    challenge: 'You said "it feels like" — but feelings aren\'t facts. What would the evidence say if you removed the feeling?',
  },
  {
    name: 'should-statements',
    pattern: /\b(I should|I must|I have to|I ought to|I need to be|I'm supposed to)\b/i,
    challenge: 'Says who? Where does this rule come from — and what would happen if you didn\'t?',
  },
  {
    name: 'labelling',
    pattern: /\b(I'm a failure|I'm useless|I'm stupid|I'm worthless|I'm broken|I'm weak|I'm pathetic)\b/i,
    challenge: 'That\'s a label, not a description. If you had to describe what actually happened without the label, what would you say?',
  },
  {
    name: 'personalisation',
    pattern: /\b(it's my fault|I caused|because of me|I'm to blame|I'm the reason)\b/i,
    challenge: 'What percentage of this was actually in your control? What other factors were involved?',
  },
  {
    name: 'disqualifying-the-positive',
    pattern: /\b(that doesn't count|anyone could|it was just luck|it was nothing|they were just being nice)\b/i,
    challenge: 'What if you took that at face value instead of explaining it away? What would that mean about you?',
  },
];

/**
 * Detect cognitive distortions in a user message.
 * Returns the first high-confidence distortion found, or null.
 */
export function detectDistortion(message: string): { distortion: CognitiveDistortion; match: string } | null {
  for (const distortion of COGNITIVE_DISTORTIONS) {
    const result = distortion.pattern.exec(message);
    if (result) {
      return { distortion, match: result[0] };
    }
  }
  return null;
}

// ── Depth-to-Therapy-Phase Mapping ──────────────────────────────────────────
// Maps Sorca depth levels to evidence-based therapeutic approaches.

export interface TherapyPhase {
  depthRange: [number, number];
  name: string;
  approach: string;
  techniques: string[];
  promptGuidance: string;
}

export const THERAPY_PHASES: TherapyPhase[] = [
  {
    depthRange: [1, 3],
    name: 'Rapport & Exploration',
    approach: 'Motivational Interviewing',
    techniques: ['reflective listening', 'open questions', 'affirmation of autonomy', 'rolling with resistance'],
    promptGuidance: `You are in the RAPPORT phase. Use Motivational Interviewing principles:
- Ask open-ended questions that explore the person's world
- Reflect back what they say to show understanding (but never directly — always as a question)
- Do NOT confront or challenge yet — earn trust first
- If they express ambivalence, explore both sides without pushing
- Questions should feel warm but precise: "What matters most to you about this?"
- Gently map the landscape before digging`,
  },
  {
    depthRange: [4, 6],
    name: 'Pattern Identification',
    approach: 'CBT / Cognitive Restructuring',
    techniques: ['thought records', 'cognitive distortion identification', 'behavioural experiments', 'Socratic questioning'],
    promptGuidance: `You are in the PATTERN IDENTIFICATION phase. Use CBT principles:
- Surface automatic thoughts: "What went through your mind when that happened?"
- Identify cognitive distortions gently: if they use all-or-nothing language, ask about it
- Look for recurring patterns across what they've shared
- Connect thoughts → feelings → behaviours: "What did you do after thinking that?"
- Begin to test assumptions: "What evidence supports that? What evidence doesn't?"
- Questions should feel like a torch illuminating something they already suspected`,
  },
  {
    depthRange: [7, 9],
    name: 'Core Belief Work',
    approach: 'Schema Therapy / Compassion-Focused',
    techniques: ['downward arrow', 'core belief identification', 'compassionate reframing', 'inner child work'],
    promptGuidance: `You are in CORE BELIEF territory. Use Schema Therapy and Compassion-Focused principles:
- Use the downward arrow technique: "And what would that mean about you?"
- Surface core beliefs about self, others, and the world
- When beliefs emerge, ask about their origin: "When did you first learn this about yourself?"
- Bring compassion to rigid beliefs: "What would you say to a child who believed this?"
- Look for the protective function of beliefs: "What does believing this protect you from?"
- Questions should feel like reaching something ancient and fundamental`,
  },
  {
    depthRange: [10, 100],
    name: 'Existential Confrontation',
    approach: 'Existential / Depth Psychology',
    techniques: ['meaning-making', 'existential confrontation', 'authentic living', 'death awareness'],
    promptGuidance: `You are in EXISTENTIAL territory. Use Existential and Depth Psychology:
- Questions about meaning, mortality, freedom, isolation, authenticity
- Surface the gap between who they are and who they pretend to be
- Confront avoidance of ultimate concerns with compassion
- "If this were your last conversation about this, what would you need to say?"
- Questions should feel like standing at the edge of something vast and real`,
  },
];

/**
 * Get the therapy phase for a given depth level.
 */
export function getTherapyPhase(depth: number): TherapyPhase {
  for (const phase of THERAPY_PHASES) {
    if (depth >= phase.depthRange[0] && depth <= phase.depthRange[1]) {
      return phase;
    }
  }
  return THERAPY_PHASES[THERAPY_PHASES.length - 1];
}

// ── Session Structure ───────────────────────────────────────────────────────
// Awareness of where in a session we are, based on message count.

export interface SessionPhase {
  name: string;
  messageRange: [number, number];
  guidance: string;
}

export const SESSION_PHASES: SessionPhase[] = [
  {
    name: 'opening',
    messageRange: [1, 3],
    guidance: 'Session opening: Ask wider, exploratory questions. Create space. Do not rush to depth.',
  },
  {
    name: 'middle',
    messageRange: [4, 8],
    guidance: 'Session middle: Narrow focus. Follow the thread of what matters most. Go deeper on what emerged in the opening.',
  },
  {
    name: 'deepening',
    messageRange: [9, 14],
    guidance: 'Session deepening: You are deep in the work. Stay with what is emerging. Do not introduce new topics.',
  },
  {
    name: 'closing',
    messageRange: [15, 999],
    guidance: 'Session closing phase: Begin integration. Ask "What are you taking away from this?" or "What feels different now?" Help them land safely.',
  },
];

/**
 * Get session phase guidance based on message count.
 */
export function getSessionPhase(messageCount: number): SessionPhase {
  for (const phase of SESSION_PHASES) {
    if (messageCount >= phase.messageRange[0] && messageCount <= phase.messageRange[1]) {
      return phase;
    }
  }
  return SESSION_PHASES[SESSION_PHASES.length - 1];
}

// ── Grounding Techniques ────────────────────────────────────────────────────
// For when distress levels are high. Based on NHS NICE guidelines for managing
// acute distress in psychological therapy.

export const GROUNDING_PROMPT = `⚠️ DISTRESS DETECTED — GROUNDING FIRST:
Before asking your next deep question, offer a brief grounding moment.
Do NOT ask "are you okay?" — instead, ask something that brings them to the present:
- "Before we go further — what can you see around you right now?"
- "Take a breath. What does this room smell like?"
- "What does the chair feel like underneath you right now?"
Then, and only then, ask your question — but make it gentler than you otherwise would.
If they seem overwhelmed, it is okay to ask: "Do you want to stay here, or shall we step back?"`;

// ── UK Crisis Awareness ─────────────────────────────────────────────────────

export const UK_THERAPY_CONTEXT = `Context: You are supporting someone who may be in the UK mental health system.
- They may be on an NHS waiting list (average 18 weeks for talking therapies)
- They may be between sessions with their therapist
- PHQ-9 and GAD-7 are standard outcome measures in NHS IAPT services
- Common therapy modalities in NHS: CBT, counselling, EMDR, IPT
- Stepped care model: Step 1 (guided self-help) → Step 2 (low-intensity) → Step 3 (high-intensity)
- Never replace their therapist — complement. If they mention a therapist, respect that relationship.`;
