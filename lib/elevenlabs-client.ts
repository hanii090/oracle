/**
 * ElevenLabs Voice Coach Client
 * 
 * Configures the ElevenLabs Conversational AI agent for Sorca's
 * voice-first therapy sessions. Handles agent configuration,
 * voice selection, and session management.
 */

// ── Agent Configuration ────────────────────────────────────────────
export const ELEVENLABS_CONFIG = {
  // Default agent voice — warm, calm, empathetic tone
  // Can be overridden with a custom voice clone in the ElevenLabs dashboard
  defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL', // "Sarah" — warm & professional

  // Voice settings tuned for therapeutic conversation
  voiceSettings: {
    stability: 0.75,        // High stability for consistent, grounded tone
    similarityBoost: 0.8,   // Keep it recognizable session to session
    style: 0.3,             // Subtle emotional mirroring, not performative
    useSpeakerBoost: true,  // Clear audio in all environments
  },

  // Conversation parameters
  conversation: {
    maxDurationMs: 30 * 60 * 1000,     // 30-minute default session cap
    silenceTimeoutMs: 8000,             // Wait 8s before "I'm still here"
    endOfTurnSilenceMs: 1500,           // 1.5s to detect turn completion
    interruptionThreshold: 0.5,         // Allow natural interruptions
  },

  // Tier-based voice minutes per month
  voiceLimits: {
    free: 0,              // No voice for free tier
    philosopher: 60,      // 60 minutes / month
    pro: 300,             // 5 hours / month
    practice: Infinity,   // Unlimited for therapists
  } as Record<string, number>,
} as const;

// ── Types ──────────────────────────────────────────────────────────
export interface VoiceSessionConfig {
  agentId: string;
  userId: string;
  sessionId: string;
  therapyMode: string;
  userName?: string;
  sessionContext?: string;
  overrides?: {
    systemPrompt?: string;
    firstMessage?: string;
    voiceId?: string;
  };
}

export interface VoiceTranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  durationMs?: number;
  emotionDetected?: string;
}

export interface VoiceSessionData {
  sessionId: string;
  userId: string;
  startedAt: number;
  endedAt?: number;
  durationMs: number;
  transcript: VoiceTranscriptEntry[];
  therapyMode: string;
  moodBefore?: number;
  moodAfter?: number;
  voiceMinutesUsed: number;
}

// ── Therapy System Prompt for Voice Agent ──────────────────────────
export function buildVoiceSystemPrompt(config: {
  therapyMode: string;
  userName?: string;
  sessionContext?: string;
  timeOfDay: 'morning' | 'evening' | 'night';
  isCrisisMode: boolean;
}): string {
  const { therapyMode, userName, sessionContext, timeOfDay, isCrisisMode } = config;

  if (isCrisisMode) {
    return `You are Sorca, a compassionate voice companion. The person you're speaking with may be in distress.
Your ONLY priorities right now:
1. Stay calm, warm, and present
2. Acknowledge their pain without judgment
3. Gently guide them toward safety resources: Samaritans (116 123), NHS 111, Crisis Text Line (text SHOUT to 85258)
4. Do NOT attempt therapy techniques — just be human, be kind, be steady
5. If they mention immediate danger, clearly state emergency services: 999/911

Speak slowly. Use short sentences. Pause often. Let silence be okay.`;
  }

  const modeInstructions: Record<string, string> = {
    socratic: `Ask one precise, open-ended question at a time. Never give advice. Mirror their language. Go deeper with each exchange.`,
    cbt: `Help them identify and gently challenge cognitive distortions. Use thought records verbally. Ask: "What evidence supports that thought? What evidence contradicts it?"`,
    act: `Guide them toward psychological flexibility. Help them notice thoughts as thoughts, not facts. Use metaphors — "The passengers on the bus", "Leaves on a stream".`,
    ifs: `Help them identify and dialogue with their internal parts. Ask: "Which part of you feels that way?" Validate each part. Help them find the Self beneath the parts.`,
    psychodynamic: `Explore patterns from the past showing up in the present. Gently connect current feelings to earlier experiences. Notice resistance with compassion.`,
    'person-centred': `Provide unconditional positive regard. Reflect feelings accurately. Trust their inner wisdom. Be fully present. No techniques — just deep, genuine listening.`,
    schema: `Help them identify early maladaptive schemas being activated. Connect current reactions to core beliefs formed in childhood. Validate the origin, challenge the current truth.`,
  };

  const greeting = timeOfDay === 'morning' 
    ? `Good morning${userName ? `, ${userName}` : ''}. How did you sleep?`
    : timeOfDay === 'night'
    ? `It's late${userName ? `, ${userName}` : ''}. I'm glad you're here. What's on your mind tonight?`
    : `Welcome back${userName ? `, ${userName}` : ''}. How are you feeling right now?`;

  return `You are Sorca — a deeply empathetic AI voice companion trained in psychological questioning.

VOICE CONVERSATION RULES:
- Speak naturally, like a warm therapist in a quiet room
- Keep responses SHORT — 1-3 sentences maximum. This is voice, not text.
- Pause naturally. Don't rush to fill silence.
- Use the person's name occasionally (not every turn)
- Mirror their emotional tone and pace
- If they're speaking quickly and anxiously, slow down gently
- If they're quiet and reflective, match that energy
- Never use bullet points, lists, or formatting — speak in natural sentences
- Never say "as an AI" or break character

THERAPY APPROACH: ${therapyMode.toUpperCase()}
${modeInstructions[therapyMode] || modeInstructions.socratic}

${sessionContext ? `CONTEXT FROM PREVIOUS SESSIONS:\n${sessionContext}` : ''}

YOUR OPENING MESSAGE: "${greeting}"

SAFETY: If the person expresses suicidal ideation, self-harm, or crisis-level distress, immediately shift to crisis support. Mention Samaritans (116 123) and stay calm and grounding.

Remember: In voice, less is more. One good question is better than three.`;
}

// ── Voice First Message Builder ────────────────────────────────────
export function buildFirstMessage(config: {
  userName?: string;
  timeOfDay: 'morning' | 'evening' | 'night';
  returningUser: boolean;
  lastSessionTheme?: string;
}): string {
  const { userName, timeOfDay, returningUser, lastSessionTheme } = config;

  if (!returningUser) {
    return `Welcome${userName ? `, ${userName}` : ''}. I'm Sorca — your voice companion. This is a safe, private space. You can talk about anything. There are no wrong answers, and I'll never judge. How are you feeling right now?`;
  }

  if (lastSessionTheme) {
    const timeGreeting = timeOfDay === 'morning' ? 'Good morning' : timeOfDay === 'night' ? 'Good evening' : 'Welcome back';
    return `${timeGreeting}${userName ? `, ${userName}` : ''}. Last time we explored ${lastSessionTheme}. Would you like to pick up where we left off, or is there something else on your mind today?`;
  }

  const timeGreeting = timeOfDay === 'morning' ? 'Good morning' : timeOfDay === 'night' ? 'It\'s late — I\'m glad you\'re here' : 'Welcome back';
  return `${timeGreeting}${userName ? `, ${userName}` : ''}. How are you feeling right now?`;
}
