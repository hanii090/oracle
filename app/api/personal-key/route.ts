import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore } from '@/lib/firebase-admin';

/**
 * Personal Key — Feature 07
 * POST /api/personal-key
 *
 * Assigns a musical key on first session based on emotional state.
 * The root note stays forever. Mode shifts (major/minor) with sessions.
 */
import { GoogleGenAI } from '@google/genai';

const MUSICAL_KEYS = [
  { key: 'C', emotion: 'innocence', color: '#f5f0e8' },
  { key: 'C#', emotion: 'tension', color: '#8b1a2f' },
  { key: 'D', emotion: 'triumph', color: '#b8860b' },
  { key: 'Eb', emotion: 'grief', color: '#5b4a8a' },
  { key: 'E', emotion: 'joy', color: '#e74c3c' },
  { key: 'F', emotion: 'pastoral', color: '#2a6b6b' },
  { key: 'F#', emotion: 'yearning', color: '#c42847' },
  { key: 'G', emotion: 'simplicity', color: '#d4a017' },
  { key: 'Ab', emotion: 'mystery', color: '#4a3f6b' },
  { key: 'A', emotion: 'warmth', color: '#c0392b' },
  { key: 'Bb', emotion: 'contemplation', color: '#7a7060' },
  { key: 'B', emotion: 'unresolved', color: '#3d3830' },
];

const KEY_ASSIGNMENT_PROMPT = `Analyse this opening message from a self-reflection session. Based on the emotional tone, assign a musical key.

Keys and their emotional associations:
C - innocence, blank slate, new beginning
C# - tension, urgency, something pressing
D - triumph over struggle, determination
Eb - grief, loss, melancholy
E - joy, breakthrough, radiance
F - pastoral, calm, nature, acceptance
F# - yearning, longing, reaching for something
G - simplicity, groundedness, truth
Ab - mystery, depth, the unknown
A - warmth, love, connection
Bb - contemplation, philosophical, reflective
B - unresolved, on the edge, transformation

Also determine the mode:
- major: the person is approaching their truth with openness or courage
- minor: the person is approaching their truth through pain or fear

Return JSON: { "key": "C", "mode": "minor", "reasoning": "brief explanation" }

Opening message: `;

export async function POST(req: Request) {
  const log = createLogger({ route: '/api/personal-key', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const { action, openingMessage, sessionMood } = await req.json();

    const adminDb = getAdminFirestore();
    const userRef = adminDb.collection('users').doc(userId);

    if (action === 'assign') {
      // Check if user already has a key
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      if (userData?.personalKey?.rootNote) {
        // Key already assigned — only update mode based on current mood
        if (sessionMood) {
          const apiKey = process.env.GEMINI_API_KEY;
          if (apiKey) {
            try {
              const ai = new GoogleGenAI({ apiKey });
              const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Based on this mood description, should the music be in major or minor mode? Mood: "${sessionMood}". Return JSON: { "mode": "major" or "minor" }`,
                config: { responseMimeType: 'application/json' },
              });
              const modeData = JSON.parse(result.text || '{}');
              if (modeData.mode) {
                await userRef.update({ 'personalKey.currentMode': modeData.mode, 'personalKey.lastUpdated': new Date().toISOString() });
                return NextResponse.json({
                  personalKey: { ...userData.personalKey, currentMode: modeData.mode },
                  updated: true,
                });
              }
            } catch {
              // Use existing mode
            }
          }
        }

        return NextResponse.json({ personalKey: userData.personalKey, existing: true });
      }

      // Assign a new key
      if (!openingMessage) {
        return NextResponse.json({ error: 'Opening message required for key assignment' }, { status: 400 });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: KEY_ASSIGNMENT_PROMPT + openingMessage,
        config: { responseMimeType: 'application/json' },
      });

      let keyData = { key: 'A', mode: 'minor', reasoning: 'Default assignment' };
      try {
        keyData = JSON.parse(result.text || '{}');
      } catch {
        // Use default
      }

      const musicalKeyInfo = MUSICAL_KEYS.find(k => k.key === keyData.key) || MUSICAL_KEYS[9]; // Default to A

      const personalKey = {
        rootNote: keyData.key,
        currentMode: keyData.mode,
        emotion: musicalKeyInfo.emotion,
        color: musicalKeyInfo.color,
        reasoning: keyData.reasoning,
        assignedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        modeHistory: [{ mode: keyData.mode, date: new Date().toISOString() }],
      };

      await userRef.set({ personalKey }, { merge: true });

      log.info('Personal key assigned', { userId, key: personalKey.rootNote, mode: personalKey.currentMode });

      return NextResponse.json({ personalKey, assigned: true });

    } else if (action === 'get') {
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      return NextResponse.json({
        personalKey: userData?.personalKey || null,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    log.error('Personal key error', {}, error);
    return NextResponse.json({ error: 'Personal key failed' }, { status: 500 });
  }
}
