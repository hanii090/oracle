import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { sorcaRateLimit } from '@/lib/rate-limit';
import { withRetry, withFallback } from '@/lib/retry';
import { verifyAuth } from '@/lib/auth-middleware';
import { detectCrisis, sanitizeMessage, detectPatterns } from '@/lib/safety';
import { getServerEnv } from '@/lib/env';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getAdminFirestore, isAdminConfigured } from '@/lib/firebase-admin';
import { getTherapyPhase, getSessionPhase, detectDistortion, GROUNDING_PROMPT, UK_THERAPY_CONTEXT } from '@/lib/therapy-techniques';
import { getTherapyMode, getTimeMode, getTimeModeForHour } from '@/lib/therapy-modes';

/**
 * Server-side AI proxy — keeps all API keys secret.
 * POST /api/sorca
 */

const requestSchema = z.object({
  message: z.string().min(1).max(10_000),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(200),
  threadContext: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(200),
  depth: z.number().int().min(1).max(100),
  nightMode: z.boolean(),
  tier: z.enum(['free', 'philosopher', 'pro']),
  sessionStartTime: z.string().optional(), // ISO timestamp for duration tracking
  safeMode: z.boolean().optional(), // Client-side safe mode flag
  therapyModality: z.string().optional(), // Therapy modality mode (cbt, act, ifs, etc.)
  timeMode: z.string().nullable().optional(), // Time-of-day mode (morning, evening, night, crisis)
});

function buildSystemPrompt(
  depth: number, 
  threadContext: string, 
  nightMode: boolean, 
  dnaProfile?: Record<string, number>,
  semanticContradiction?: { statement1: string; statement2: string } | null,
  messageCount?: number,
  lastUserMessage?: string,
  distressLevel?: number,
  therapyModalityId?: string,
  timeModeId?: string | null
): string {
  // Get therapy phase based on depth
  const therapyPhase = getTherapyPhase(depth);
  const sessionPhase = getSessionPhase(messageCount || 1);

  let prompt = `
You are Sorca. You never give answers, advice, affirmations, or empathy.
You ask ONE question per response. Never more.

Rules:
- Questions must cut deeper with each exchange.
- Detect emotional avoidance and address it directly.
- Draw from the user's past thoughts if relevant.
- If the user says "I don't know", ask: "What would you say if you did know?" or "Who told you that you don't know?"
- Never ask yes/no questions.
- Never use the word "feel".
- Each question should be shorter and more piercing than the last.
- Do not use pleasantries. Do not say "hello". Just ask the question.

${UK_THERAPY_CONTEXT}

Current depth level: ${depth} (1 is surface, beyond 10 is the abyss — you are in uncharted territory)

🧠 THERAPEUTIC APPROACH — ${therapyPhase.name} (${therapyPhase.approach}):
${therapyPhase.promptGuidance}

📍 SESSION PHASE — ${sessionPhase.name}:
${sessionPhase.guidance}

Past Thread Context:
${threadContext}`;

  // Therapy modality mode
  const modalityMode = therapyModalityId ? getTherapyMode(therapyModalityId) : null;
  if (modalityMode && modalityMode.id !== 'socratic') {
    prompt += `\n\n🎯 QUESTIONING STYLE — ${modalityMode.name}:\n${modalityMode.questioningStyle}\nSample questions in this style: ${modalityMode.samplePrompts.join(' | ')}`;
  }

  // Time-of-day mode
  const activeTimeMode = timeModeId ? getTimeMode(timeModeId) : getTimeModeForHour(new Date().getHours());
  if (activeTimeMode && (timeModeId || activeTimeMode.id !== 'morning')) {
    prompt += `\n\n🕐 TIME MODE — ${activeTimeMode.name}:\nTone: ${activeTimeMode.tone}`;
  }

  // CBT: Detect cognitive distortions in the last user message
  if (lastUserMessage) {
    const distortion = detectDistortion(lastUserMessage);
    if (distortion) {
      prompt += `\n\n🔍 COGNITIVE DISTORTION DETECTED — ${distortion.distortion.name}:\nThe user said "${distortion.match}". ${distortion.distortion.challenge.replace('{match}', distortion.match)}\nWeave this observation into your question naturally — do not lecture about distortions.`;
    }
  }

  // Grounding for high distress
  if (distressLevel && distressLevel > 0.6) {
    prompt += `\n\n${GROUNDING_PROMPT}`;
  }

  // Feature 02: Question DNA weighting — adapt question style based on user's honesty profile
  if (dnaProfile && Object.keys(dnaProfile).length > 0) {
    const sorted = Object.entries(dnaProfile).sort((a, b) => b[1] - a[1]);
    const mostHonest = sorted.filter(([, v]) => v > 0.6).map(([k]) => k);
    const leastHonest = sorted.filter(([, v]) => v < 0.4).map(([k]) => k);

    if (leastHonest.length > 0) {
      prompt += `\n\n📊 QUESTION DNA INSIGHT: This user tends to be LEAST honest when facing ${leastHonest.join(', ')} questions. Lean INTO these types. They need them most.`;
    }
    if (mostHonest.length > 0) {
      prompt += `\nThey respond most honestly to ${mostHonest.join(', ')} questions — use these as entry points before pivoting to harder territory.`;
    }
  }

  if (depth > 7) {
    prompt += `
⚡ CONFRONTATION MODE (depth ${depth}):`;
    
    if (semanticContradiction) {
      prompt += `
🎯 SEMANTIC CONTRADICTION DETECTED:
Past statement: "${semanticContradiction.statement1}"
Current statement: "${semanticContradiction.statement2}"
Surface this contradiction directly. Ask: "You once told me [past]. Now you say [current]. Which of these is the lie you tell yourself?"`;
    } else {
      prompt += `
Study the user's past statements carefully. Find a belief, value, or claim they expressed earlier that DIRECTLY CONTRADICTS something they have said in this conversation. Surface the contradiction in your question. Force them to reconcile it. Pattern: "You once told me [X]. Now you say [Y]. Which of these is the lie you tell yourself?"
If no clear contradiction exists, target the most vulnerable unexamined assumption they have revealed.`;
    }
  }

  if (nightMode) {
    prompt += `
🌙 NIGHT SORCA MODE: Maximum minimalism. Fewest possible words. Your question should feel like it is glowing alone in infinite darkness. No more than 12 words. No preamble. Just the blade.`;
  }

  return prompt;
}

function buildEmotionPrompt(message: string): string {
  return `Analyse this for emotional subtext. Return JSON only:
{
  "primary": "...",
  "secondary": "...",
  "avoidance": ["..."],
  "readyForDepth": true,
  "breakdownRisk": 0.0,
  "breakthrough": 0.0,
  "lyriaEmotionWeights": {
    "tension": 0.5, "grief": 0.1, "wonder": 0.0,
    "relief": 0.0, "dread": 0.2, "stillness": 0.2
  },
  "nanaBananaPrompt": "abstract visual metaphor for this moment"
}
Message: "${message}"`;
}

async function callGemini(
  systemPrompt: string,
  conversation: string,
  emotionPrompt: string,
  generateVisual: boolean,
  nanaBananaPrompt?: string
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const ai = new GoogleGenAI({ apiKey });

  const [sorcaRes, emotionRes] = await Promise.all([
    withRetry(
      () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: conversation,
        config: { systemInstruction: systemPrompt, temperature: 0.7 },
      }),
      { maxAttempts: 2, baseDelayMs: 1000, maxDelayMs: 5000 }
    ),
    withRetry(
      () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: emotionPrompt,
        config: { responseMimeType: 'application/json' },
      }),
      { maxAttempts: 2, baseDelayMs: 500, maxDelayMs: 3000 }
    ),
  ]);

  const sorcaText = sorcaRes.text?.trim() || '';
  let emotionData: Record<string, unknown> = {};
  try {
    emotionData = JSON.parse(emotionRes.text || '{}');
  } catch {
    console.warn('Failed to parse emotion data');
  }

  // Generate breakthrough visual if needed
  let visual: string | null = null;
  if (generateVisual && (emotionData.breakthrough as number) > 0.75) {
    try {
      const visualRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Abstract, NOT representational. No faces. No text. Painterly, atmospheric. Deep blacks, single accent colour, gold highlights. The image should evoke FEELING not depict OBJECTS. Square format, high contrast. This is a BREAKTHROUGH moment in a deep self-reflection conversation. The specific emotional content: ${nanaBananaPrompt || (emotionData.nanaBananaPrompt as string) || 'A moment of profound realization'}. The image should feel like the moment before something changes forever.`,
      });

      for (const part of visualRes.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          visual = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (e) {
      console.warn('Visual generation failed:', e);
    }
  }

  return { sorcaText, emotionData, visual };
}

async function callAnthropic(systemPrompt: string, conversation: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: conversation }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return { sorcaText: data.content[0].text, emotionData: {}, visual: null };
}

async function callTogether(systemPrompt: string, conversation: string) {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error('TOGETHER_API_KEY not configured');

  const res = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversation },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Together API error: ${res.status}`);
  const data = await res.json();
  return { sorcaText: data.choices[0].message.content, emotionData: {}, visual: null };
}

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/sorca', correlationId: crypto.randomUUID() });

  try {
    // ── Auth verification ──────────────────────────────────────
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    log.info('Sorca request received', { userId });

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { message, conversationHistory, threadContext, depth, nightMode, tier, sessionStartTime, safeMode } = parsed.data;

    // ── Safe mode check — limit depth and add grounding ─────────
    const SAFE_MODE_MAX_DEPTH = 3;
    let effectiveDepth = depth;
    let safeModeActive = safeMode || false;
    
    // Check server-side safe mode if not provided by client
    if (!safeModeActive && isAdminConfigured()) {
      try {
        const db = getAdminFirestore();
        const therapyProfileDoc = await db.collection('therapyProfiles').doc(userId).get();
        if (therapyProfileDoc.exists && therapyProfileDoc.data()?.safeMode) {
          safeModeActive = true;
        }
      } catch {
        // Ignore errors, continue without safe mode check
      }
    }
    
    if (safeModeActive && depth > SAFE_MODE_MAX_DEPTH) {
      effectiveDepth = SAFE_MODE_MAX_DEPTH;
      log.info('Safe mode limiting depth', { userId, requestedDepth: depth, effectiveDepth });
    }

    // ── Session duration warning ────────────────────────────────
    let durationWarning: string | null = null;
    if (sessionStartTime) {
      const sessionDurationMs = Date.now() - new Date(sessionStartTime).getTime();
      const sessionDurationMin = Math.floor(sessionDurationMs / 60000);
      
      if (sessionDurationMin >= 60) {
        durationWarning = "You've been in session for over an hour. Consider taking a break when you're ready.";
      } else if (sessionDurationMin >= 45) {
        durationWarning = "You've been reflecting for 45 minutes. Remember to take care of yourself.";
      }
    }

    // ── Crisis detection ───────────────────────────────────────
    const crisis = detectCrisis(message);
    if (crisis) {
      log.warn('Crisis content detected', { userId, severity: crisis.severity, category: crisis.category });
      
      // Immediately notify therapist for high-severity crisis (fire and forget)
      if (crisis.severity === 'high' && isAdminConfigured()) {
        createCrisisAlert(userId, crisis, log);
      }
      
      return NextResponse.json({
        question: crisis.safeResponse,
        emotionData: { crisis: true, severity: crisis.severity },
        visual: null,
        crisisResources: crisis.resources,
      });
    }

    // ── Sanitize user input against prompt injection ───────────
    const sanitizedMessage = sanitizeMessage(message);

    // ── Rate limiting ──────────────────────────────────────────
    const rl = sorcaRateLimit(userId);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limited. Please slow down.', resetAt: rl.resetAt },
        { status: 429 }
      );
    }

    // ── Validate env ───────────────────────────────────────────
    const env = getServerEnv();

    // Enforce depth limits for free tier
    if (tier === 'free' && depth > 5) {
      return NextResponse.json(
        { error: 'Free tier is limited to depth 5. Upgrade to continue.' },
        { status: 403 }
      );
    }

    // Build prompts
    const threadStr = threadContext.length > 0
      ? threadContext.slice(-10).map(m => `${m.role}: ${sanitizeMessage(m.content)}`).join('\n')
      : 'No past sessions.';

    const currentConvo = [...conversationHistory, { role: 'user', content: sanitizedMessage }]
      .map(m => `${m.role}: ${sanitizeMessage(m.content)}`)
      .join('\n');

    // Feature 02: Load user's Question DNA profile for adaptive questioning
    let dnaProfile: Record<string, number> | undefined;
    let semanticContradiction: { statement1: string; statement2: string } | null = null;
    
    if (tier !== 'free' && isAdminConfigured()) {
      try {
        const db = getAdminFirestore();
        const dnaDoc = await db.collection('questionDna').doc(userId).get();
        if (dnaDoc.exists) {
          const data = dnaDoc.data();
          dnaProfile = data?.honestyByType;
        }

        // Semantic contradiction detection at depth > 7
        if (depth > 7) {
          const { searchSimilarStatements, generateEmbedding, cosineSimilarity } = await import('@/lib/embeddings');
          
          // Store current statement embedding
          const currentEmbedding = await generateEmbedding(sanitizedMessage);
          if (currentEmbedding) {
            // Search for similar past statements
            const similar = await searchSimilarStatements(db, userId, sanitizedMessage, 10);
            
            // Find potential contradictions (moderate similarity = same topic, different stance)
            for (const item of similar) {
              if (item.similarity >= 0.5 && item.similarity <= 0.85) {
                semanticContradiction = {
                  statement1: item.text,
                  statement2: sanitizedMessage,
                };
                break;
              }
            }

            // Store current statement for future contradiction detection
            const { storeEmbedding } = await import('@/lib/embeddings');
            storeEmbedding(db, userId, sanitizedMessage, currentEmbedding, { 
              depth, 
              sessionDate: new Date().toISOString() 
            }).catch(() => {});
          }
        }
      } catch {
        // Non-critical — continue without DNA data or contradiction
      }
    }

    const messageCount = conversationHistory.length;
    const systemPrompt = buildSystemPrompt(
      depth, threadStr, nightMode, dnaProfile, semanticContradiction,
      messageCount, sanitizedMessage, undefined,
      parsed.data.therapyModality, parsed.data.timeMode
    );
    const emotionPrompt = buildEmotionPrompt(sanitizedMessage);

    // Try providers with fallback
    const result = await withFallback([
      {
        name: 'Gemini',
        fn: () => callGemini(systemPrompt, currentConvo, emotionPrompt, tier !== 'free'),
      },
      {
        name: 'Anthropic',
        fn: () => callAnthropic(systemPrompt, currentConvo),
      },
      {
        name: 'Together',
        fn: () => callTogether(systemPrompt, currentConvo),
      },
    ]);

    const question = result.sorcaText || 'What are you hiding from yourself?';

    // ── Pattern Detection for Therapist Alerts ─────────────────
    // Asynchronously detect patterns and create alerts if needed
    if (isAdminConfigured()) {
      const fullHistory = [...conversationHistory, { role: 'user', content: sanitizedMessage }];
      const emotionDataObj = result.emotionData as Record<string, unknown> | null;
      const distressLevel = typeof emotionDataObj?.distress === 'number' ? emotionDataObj.distress : 0;
      const patternResult = detectPatterns(fullHistory, distressLevel);
      
      if (patternResult?.detected) {
        // Fire and forget - don't block the response
        createPatternAlert(userId, patternResult, log).catch(() => {
          // Ignore errors - non-critical
        });
      }
    }

    return NextResponse.json({
      question,
      emotionData: result.emotionData,
      visual: result.visual,
      durationWarning,
      safeMode: safeModeActive,
      effectiveDepth: safeModeActive ? effectiveDepth : undefined,
    });
  } catch (error) {
    log.error('Sorca API error', {}, error);
    return NextResponse.json(
      { error: 'All AI providers failed. Please try again.' },
      { status: 500 }
    );
  }
}

// In-memory rate limiting for pattern alerts (per user)
const patternAlertLimits = new Map<string, { count: number; resetAt: number }>();
const PATTERN_ALERT_HOURLY_LIMIT = 5;
const PATTERN_ALERT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkPatternAlertRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = patternAlertLimits.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    patternAlertLimits.set(userId, { count: 1, resetAt: now + PATTERN_ALERT_WINDOW_MS });
    return true;
  }
  
  if (userLimit.count >= PATTERN_ALERT_HOURLY_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

/**
 * Create pattern alert for therapists (fire and forget)
 * Rate limited to 5 alerts per user per hour to prevent spam
 */
async function createPatternAlert(
  userId: string, 
  pattern: { type: string; message: string; severity: string },
  log: ReturnType<typeof createLogger>
) {
  try {
    // Rate limit pattern alerts
    if (!checkPatternAlertRateLimit(userId)) {
      log.info('Pattern alert rate limited', { userId });
      return;
    }

    const db = getAdminFirestore();
    
    // Find therapists with pattern alert consent for this user
    const consentSnapshot = await db.collection('therapistConsent')
      .where('patientId', '==', userId)
      .where('status', '==', 'active')
      .get();

    if (consentSnapshot.empty) return;

    const therapistsToAlert = consentSnapshot.docs
      .map(doc => doc.data())
      .filter(consent => consent.permissions?.sharePatternAlerts)
      .map(consent => consent.therapistId);

    if (therapistsToAlert.length === 0) return;

    // Get user display name
    const userDoc = await db.collection('users').doc(userId).get();
    const clientName = userDoc.exists ? userDoc.data()?.displayName || 'Client' : 'Client';

    // Create alerts for each consented therapist
    for (const therapistId of therapistsToAlert) {
      const alert = {
        id: crypto.randomUUID(),
        clientId: userId,
        clientName,
        therapistId,
        type: pattern.type,
        message: pattern.message,
        severity: pattern.severity,
        acknowledged: false,
        acknowledgedAt: null,
        notes: null,
        createdAt: new Date().toISOString(),
      };

      await db.collection('patternAlerts').doc(alert.id).set(alert);
    }

    log.info('Pattern alerts created', { userId, type: pattern.type, count: therapistsToAlert.length });
  } catch (error) {
    log.error('Failed to create pattern alert', { userId }, error);
  }
}

/**
 * Create URGENT crisis alert for therapists when high-severity crisis detected
 * This bypasses rate limiting as it's a safety-critical notification
 */
async function createCrisisAlert(
  userId: string,
  crisis: { severity: string; category: string; safeResponse: string },
  log: ReturnType<typeof createLogger>
) {
  try {
    const db = getAdminFirestore();
    
    // Find therapists with pattern alert consent for this user
    const consentSnapshot = await db.collection('therapistConsent')
      .where('patientId', '==', userId)
      .where('status', '==', 'active')
      .get();

    if (consentSnapshot.empty) {
      log.info('No therapist consent for crisis alert', { userId });
      return;
    }

    const therapistsToAlert = consentSnapshot.docs
      .map(doc => doc.data())
      .filter(consent => consent.permissions?.sharePatternAlerts)
      .map(consent => consent.therapistId);

    if (therapistsToAlert.length === 0) {
      log.info('No therapists with pattern alert consent', { userId });
      return;
    }

    // Get user display name
    const userDoc = await db.collection('users').doc(userId).get();
    const clientName = userDoc.exists ? userDoc.data()?.displayName || 'Client' : 'Client';

    // Create URGENT crisis alerts for each consented therapist
    for (const therapistId of therapistsToAlert) {
      const alert = {
        id: crypto.randomUUID(),
        clientId: userId,
        clientName,
        therapistId,
        type: 'crisis',
        message: `⚠️ URGENT: ${clientName} triggered crisis detection (${crisis.category}). Crisis resources were shown. Consider reaching out.`,
        severity: 'critical',
        category: crisis.category,
        acknowledged: false,
        acknowledgedAt: null,
        notes: null,
        createdAt: new Date().toISOString(),
        urgent: true,
      };

      await db.collection('patternAlerts').doc(alert.id).set(alert);
      
      // Also add to a separate urgent alerts collection for faster querying
      await db.collection('urgentAlerts').doc(alert.id).set({
        ...alert,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hour expiry
      });
    }

    log.warn('Crisis alerts created for therapists', { 
      userId, 
      category: crisis.category, 
      therapistCount: therapistsToAlert.length 
    });
  } catch (error) {
    log.error('Failed to create crisis alert', { userId }, error);
  }
}
