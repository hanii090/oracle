import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export type EmotionWeights = {
  tension?: number; grief?: number; wonder?: number;
  relief?: number; dread?: number; stillness?: number;
}

export type PersonalKeyInfo = {
  key: string;
  mode: string;
  emotion: string;
}

const EMOTION_TO_PROMPT: Record<string, string> = {
  tension: "tense sparse piano, minor key, unresolved chord, silence between notes",
  grief: "slow cello, low register, long sustained notes, minor thirds",
  wonder: "shimmering strings, open fifths, gentle arpeggios, soft reverb",
  relief: "warm harmonics, major key resolution, slow breath, returning home",
  dread: "deep bass drone, dissonant intervals, slow pulse, atmospheric dark",
  stillness: "near silence, single note held, infinite reverb, empty space"
}

const KEY_TO_MUSICAL: Record<string, string> = {
  "C minor": "C natural minor scale, somber, introspective quality",
  "D minor": "D minor key, melancholic but grounded, baroque sadness",
  "E♭ major": "E-flat major, warm heroic quality, expansive feeling",
  "F# minor": "F-sharp minor, dark tension, searching quality",
  "G major": "G major key, pastoral brightness, gentle optimism",
  "A minor": "A natural minor, contemplative, classical depth",
  "B♭ major": "B-flat major, warm resonance, steady grounding",
  "C# minor": "C-sharp minor, mysterious darkness, profound depth",
  "D major": "D major key, triumphant clarity, bright confidence",
  "E minor": "E minor, folk-like simplicity, honest vulnerability",
  "F minor": "F minor key, deep passion, emotional intensity",
  "A♭ major": "A-flat major, rich warmth, complex beauty",
}

export class LyriaFoleyEngine {
  private session: any = null;
  private audioCtx: AudioContext | null = null;
  private nextPlayTime = 0;
  private isPlaying = false;
  private reconnectAttempts = 0;
  private personalKey: PersonalKeyInfo | null = null;
  private breakthroughAudioBuffers: Float32Array[] = [];
  private isCapturingBreakthrough = false;

  /** Feature 07: Set the user's personal musical key for all audio generation */
  setPersonalKey(key: PersonalKeyInfo) {
    this.personalKey = key;
  }

  /** Feature 08: Get stored breakthrough audio signature */
  getBreakthroughSignature(): Float32Array[] {
    return this.breakthroughAudioBuffers;
  }

  async connect() {
    let apiKey: string | undefined;
    try {
      const res = await fetch('/api/lyria-token');
      if (res.ok) {
        const data = await res.json();
        apiKey = data.apiKey;
      }
    } catch {
      // Proxy not available — fall back
    }

    if (!apiKey) {
      apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();
    }

    if (!apiKey) return;

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Fix audio distortion: Create AudioContext with proper initialization
      // AudioContext must be created after user interaction and resumed properly
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Resume AudioContext if it's in suspended state (browser autoplay policy)
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const keyInstruction = this.personalKey
        ? ` All music should be rooted in ${KEY_TO_MUSICAL[this.personalKey.key] || this.personalKey.key}, with ${this.personalKey.mode} mode.`
        : '';

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            this.isPlaying = true;
            this.steer({ stillness: 0.7, wonder: 0.3 });
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const pcmData = this.base64ToFloat32(base64Audio);
              this.queueAudio(pcmData);

              // Feature 08: Capture audio during breakthrough for soundmark
              if (this.isCapturingBreakthrough) {
                this.breakthroughAudioBuffers.push(pcmData);
              }
            }
          },
          onclose: () => {
            if (this.isPlaying && this.reconnectAttempts < 5) {
              const delay = Math.pow(2, this.reconnectAttempts) * 1000;
              setTimeout(() => this.connect(), delay);
              this.reconnectAttempts++;
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
          },
          systemInstruction: `Generate ambient music based on the user's emotional state.${keyInstruction}`
        }
      });

      this.session = await sessionPromise;
    } catch (e) {
      console.error("Lyria connection failed", e);
    }
  }

  steer(emotions: EmotionWeights) {
    if (!this.session) return;

    const weightedPrompts = Object.entries(emotions)
      .filter(([, weight]) => (weight as number) > 0.05)
      .map(([emotion, weight]) => ({
        text: EMOTION_TO_PROMPT[emotion],
        weight: weight as number
      }));

    const keyContext = this.personalKey
      ? ` Maintain the root key of ${this.personalKey.key} ${this.personalKey.mode}.`
      : '';

    const promptText = weightedPrompts.map(p => `${p.text} (weight: ${p.weight})`).join(", ");

    this.session.sendRealtimeInput([{
      text: `Generate ambient music with these characteristics: ${promptText}${keyContext}`
    }]);
  }

  /** Feature 08: Trigger breakthrough with soundmark capture */
  async triggerBreakthrough() {
    // Start capturing audio for the breakthrough soundmark
    this.isCapturingBreakthrough = true;
    this.breakthroughAudioBuffers = [];

    this.steer({ wonder: 0.9, relief: 0.3, stillness: 0.1 });
    await new Promise(r => setTimeout(r, 8000));

    // Stop capturing
    this.isCapturingBreakthrough = false;

    this.steer({ stillness: 0.8 });
  }

  /** Feature 08: Replay stored breakthrough soundmark */
  async replayBreakthroughSignature() {
    if (!this.audioCtx || this.breakthroughAudioBuffers.length === 0) return;

    for (const pcm of this.breakthroughAudioBuffers) {
      this.queueAudio(pcm);
    }
  }

  private async queueAudio(pcm: Float32Array) {
    if (!this.audioCtx) return;
    
    // Ensure AudioContext is running before playing audio
    if (this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch {
        // Context resume failed, skip this audio chunk
        return;
      }
    }
    
    const buffer = this.audioCtx.createBuffer(1, pcm.length, 24000);
    buffer.getChannelData(0).set(pcm);
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioCtx.destination);
    
    const currentTime = this.audioCtx.currentTime;
    if (this.nextPlayTime < currentTime) {
      // Add small buffer to prevent audio glitches from timing issues
      this.nextPlayTime = currentTime + 0.01;
    }
    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;
  }

  private base64ToFloat32(b64: string): Float32Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    return float32;
  }

  disconnect() {
    this.isPlaying = false;
    this.isCapturingBreakthrough = false;
    if (this.session) {
      this.session = null;
    }
    this.audioCtx?.close();
  }
}
